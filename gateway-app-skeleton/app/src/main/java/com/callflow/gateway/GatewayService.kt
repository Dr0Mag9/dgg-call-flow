package com.callflow.gateway

import android.Manifest
import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException
import java.util.*
import android.os.BatteryManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStreamWriter
import java.io.InputStreamReader
import java.io.BufferedReader
import android.os.Handler
import android.os.Looper
import android.util.Log

class GatewayService : Service() {

    private var socket: Socket? = null
    private val CHANNEL_ID = "GatewayServiceChannel"
    private var apiKey: String? = null
    private var manualPhoneNumber: String? = null
    private var serverUrl: String? = null
    private val pollerTimer = Timer()
    private val healthTimer = Timer()
    private val mainHandler = Handler(Looper.getMainLooper())
    private var currentCallId: String? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        CallController.init(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        serverUrl = intent?.getStringExtra("SERVER_URL")
        apiKey = intent?.getStringExtra("API_KEY")
        manualPhoneNumber = intent?.getStringExtra("MANUAL_PHONE")
        
        if (serverUrl == null || apiKey == null) return START_NOT_STICKY

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CallFlow Gateway Active")
            .setContentText("Connected to $serverUrl")
            .setSmallIcon(android.R.drawable.stat_sys_phone_call)
            .setOngoing(true)
            .build()

        startForeground(1, notification)

        // Register via HTTP first (reliable), then try socket (real-time)
        registerViaHttp()
        connectToSocket(serverUrl!!, apiKey!!)
        startCommandPolling()
        startHealthReporting()

        return START_STICKY
    }

    /**
     * Register gateway device with the server via HTTP POST
     */
    private fun registerViaHttp() {
        Thread {
            try {
                val url = URL("$serverUrl/api/gateway/connect")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.doOutput = true
                conn.connectTimeout = 10000
                conn.readTimeout = 10000
                conn.setRequestProperty("Content-Type", "application/json")

                val body = JSONObject().apply {
                    put("apiKey", apiKey)
                    put("deviceName", Build.MODEL)
                    put("phoneNumber", manualPhoneNumber ?: getSimPhoneNumber() ?: "")
                }
                OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }

                if (conn.responseCode == 200) {
                    sendStatusUpdate("Status: Connected (HTTP)")
                } else {
                    sendStatusUpdate("Status: HTTP Register Failed (${conn.responseCode})")
                }
                conn.disconnect()
            } catch (e: Exception) {
                sendStatusUpdate("Status: HTTP Register Error - ${e.message}")
            }
        }.start()
    }

    /**
     * Poll server for pending commands every 3 seconds
     */
    private fun startCommandPolling() {
        pollerTimer.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                pollCommands()
            }
        }, 3000, 3000)
    }

    private fun pollCommands() {
        val urlStr = "$serverUrl/api/gateway/commands?apiKey=$apiKey"
        try {
            val url = URL(urlStr)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 5000
            conn.readTimeout = 5000

            if (conn.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val response = reader.use { it.readText() }
                val json = JSONObject(response)

                val action = json.optString("action", "NONE")
                when (action) {
                    "CALL" -> {
                        mainHandler.post { handleCallCommand(json) }
                    }
                    "HANGUP" -> {
                        mainHandler.post { handleHangupCommand(json) }
                    }
                    "NONE" -> { /* No pending commands */ }
                }
            }
            conn.disconnect()
        } catch (e: Exception) {
            // Silently retry on next poll cycle
        }
    }

    /**
     * Socket.io connection for real-time commands
     */
    private fun connectToSocket(url: String, key: String) {
        try {
            val opts = IO.Options()
            // Standard Socket.io path for Node.js
            opts.path = "/socket.io"
            opts.reconnection = true
            opts.reconnectionAttempts = 100
            opts.reconnectionDelay = 2000
            opts.forceNew = true
            opts.timeout = 30000
            
            // Explicitly set transports. v2.1.0 client with Node v4 usually needs EIO3 + specific transports
            opts.transports = arrayOf("polling", "websocket")
            
            Log.d("Gateway", "[Socket] Connecting to $url with path ${opts.path}")
            socket = IO.socket(url, opts)

            socket?.on(Socket.EVENT_CONNECT) {
                Log.d("Gateway", "[Socket] Connected to server")
                val phoneNumber = getSimPhoneNumber()
                val authData = JSONObject().apply {
                    put("apiKey", key)
                    put("phoneNumber", manualPhoneNumber ?: getSimPhoneNumber() ?: "")
                }
                socket?.emit("gateway:auth", authData)
                sendStatusUpdate("Status: Online")
            }

            socket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("Gateway", "[Socket] Disconnected")
                sendStatusUpdate("Status: Reconnecting...")
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = if (args.isNotEmpty()) args[0].toString() else "Unknown"
                Log.e("Gateway", "[Socket] Connect Error: $error")
                sendStatusUpdate("Status: Socket Error ($error), using Polling")
            }

            socket?.on("gateway:command") { args ->
                if (args.isNotEmpty()) {
                    val data = args[0] as JSONObject
                    mainHandler.post { handleCommand(data) }
                }
            }

            socket?.on("gateway:ready") {
                sendStatusUpdate("Status: Online (Socket + Polling)")
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            sendStatusUpdate("Status: Invalid server URL")
        }
    }

    /**
     * Unified command handler for both socket and polling
     */
    private fun handleCommand(data: JSONObject) {
        val action = when {
            data.has("action") -> data.getString("action")
            data.has("command") -> data.getString("command")
            else -> "NONE"
        }

        when (action) {
            "CALL", "DIAL" -> handleCallCommand(data)
            "HANGUP", "END" -> handleHangupCommand(data)
            "ANSWER" -> handleAnswerCommand()
        }
    }

    /**
     * Handle DIAL/CALL command - place a phone call
     */
    private fun handleCallCommand(data: JSONObject) {
        val number = data.optString("phoneNumber", "")
        val sessionId = data.optString("sessionId", data.optString("callId", "unknown"))
        val simSlot = if (data.has("simSlot")) data.getInt("simSlot") else -1

        if (number.isEmpty()) {
            sendStatusUpdate("Status: Error - No phone number")
            return
        }

        currentCallId = sessionId
        sendStatusUpdate("Dialing: $number")

        // Enhanced dial with simSlot support
        val success = CallController.dial(number, sessionId, simSlot)
        if (success) {
            reportCallStatus(sessionId, "start")
            logCallLocally(number)
        } else {
            reportCallStatus(sessionId, "end", "FAILED")
            Log.e("Gateway", "[Call] Dial Failed - Check permissions")
            sendStatusUpdate("Status: Dial Failed")
        }
    }

    /**
     * Handle HANGUP command - end the active call
     */
    private fun handleHangupCommand(data: JSONObject) {
        val callId = data.optString("callId", data.optString("sessionId", currentCallId ?: ""))
        Log.d("Gateway", "[Call] Ending call $callId")
        sendStatusUpdate("Ending call...")

        val success = CallController.endCall()
        if (success) {
            reportCallStatus(callId, "end", "ENDED")
            sendStatusUpdate("Status: Call Ended")
            currentCallId = null
        } else {
            Log.w("Gateway", "[Call] Hangup failed or call already ended")
            sendStatusUpdate("Status: Call Already Ended")
            reportCallStatus(callId, "end", "ENDED")
            currentCallId = null
        }
    }

    /**
     * Handle ANSWER command - answer incoming call
     */
    private fun handleAnswerCommand() {
        val success = CallController.answerCall()
        if (success) {
            sendStatusUpdate("Status: Call Answered")
        } else {
            sendStatusUpdate("Status: Answer failed")
        }
    }

    /**
     * Report call status changes back to the server
     */
    private fun reportCallStatus(callId: String, endpoint: String, status: String? = null) {
        if (callId.isEmpty() || callId == "unknown") return

        Thread {
            try {
                val url = URL("$serverUrl/api/gateway/call/$endpoint")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.doOutput = true
                conn.connectTimeout = 5000
                conn.setRequestProperty("Content-Type", "application/json")

                val body = JSONObject().apply {
                    put("apiKey", apiKey)
                    put("callId", callId)
                    if (status != null) put("status", status)
                }

                OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
                conn.responseCode
                conn.disconnect()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }.start()
    }

    /**
     * Send periodic health/heartbeat updates via both HTTP and socket
     */
    private fun startHealthReporting() {
        healthTimer.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                // Socket heartbeat
                val batteryLevel = getBatteryLevel()
                val healthData = JSONObject().apply {
                    put("battery", batteryLevel)
                    put("status", "ONLINE")
                }
                socket?.emit("gateway:health_update", healthData)

                // HTTP heartbeat (ensures device stays ONLINE even if socket drops)
                try {
                    val url = URL("$serverUrl/api/gateway/heartbeat")
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.doOutput = true
                    conn.connectTimeout = 5000
                    conn.setRequestProperty("Content-Type", "application/json")
                    val body = JSONObject().apply { put("apiKey", apiKey) }
                    OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }
                    conn.responseCode
                    conn.disconnect()
                } catch (e: Exception) { /* retry next cycle */ }
            }
        }, 5000, 30000) // Every 30 seconds
    }

    private fun getBatteryLevel(): Int {
        val bm = getSystemService(BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun getSimPhoneNumber(): String? {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_NUMBERS)
            != PackageManager.PERMISSION_GRANTED) {
            return null
        }
        return try {
            val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            tm.line1Number
        } catch (e: Exception) {
            null
        }
    }

    private fun logCallLocally(number: String) {
        val prefs = getSharedPreferences("GatewayLogs", Context.MODE_PRIVATE)
        val logs = prefs.getString("history", "") ?: ""
        val timestamp = java.text.SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
        prefs.edit().putString("history", "$number ($timestamp)|$logs").apply()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Gateway Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "CallFlow SIM Bridge background service"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun sendStatusUpdate(status: String) {
        val intent = Intent("com.callflow.gateway.STATUS_UPDATE")
        intent.putExtra("status", status)
        sendBroadcast(intent)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        pollerTimer.cancel()
        healthTimer.cancel()
        socket?.disconnect()
        super.onDestroy()
    }
}
