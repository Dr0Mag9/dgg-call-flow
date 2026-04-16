package com.callflow.gateway

import android.Manifest
import android.app.*
import android.content.Context
import android.content.Intent
import android.net.Uri
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
import android.telephony.SubscriptionManager
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import java.net.HttpURLConnection
import java.net.URL
import java.io.OutputStreamWriter
import java.io.InputStreamReader
import java.io.BufferedReader
import android.os.Handler
import android.os.Looper

class GatewayService : Service() {

    private var socket: Socket? = null
    private val CHANNEL_ID = "GatewayServiceChannel"
    private var apiKey: String? = null
    private var serverUrl: String? = null
    private val pollerTimer = Timer()
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        serverUrl = intent?.getStringExtra("SERVER_URL") ?: return START_NOT_STICKY
        apiKey = intent?.getStringExtra("API_KEY") ?: return START_NOT_STICKY

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CallFlow Gateway Active")
            .setContentText("Connected to $serverUrl")
            .setSmallIcon(android.R.drawable.stat_sys_phone_call)
            .build()

        startForeground(1, notification)
        
        // Use both Socket.io (Reactive) and HTTP Polling (Fallback/Robustness)
        connectToSocket(serverUrl!!, apiKey!!)
        startCommandPolling()

        return START_STICKY
    }

    private fun startCommandPolling() {
        pollerTimer.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                pollCommands()
            }
        }, 5000, 3000) // Poll every 3 seconds
    }

    private fun pollCommands() {
        val urlStr = "$serverUrl/api/gateway/commands?apiKey=$apiKey"
        try {
            val url = URL(urlStr)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "GET"
            conn.connectTimeout = 5000
            
            if (conn.responseCode == 200) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val response = reader.use { it.readText() }
                val json = JSONObject(response)
                
                if (json.has("action") && json.getString("action") == "CALL") {
                    mainHandler.post {
                        handleCommand(json)
                    }
                }
            }
            conn.disconnect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun connectToSocket(url: String, key: String) {
        try {
            val opts = IO.Options()
            opts.path = "/socket.io"
            socket = IO.socket(url, opts)

            socket?.on(Socket.EVENT_CONNECT) {
                val phoneNumber = getSimPhoneNumber()
                val authData = JSONObject().apply {
                    put("apiKey", key)
                    put("phoneNumber", phoneNumber)
                }
                socket?.emit("gateway:auth", authData)
                sendStatusUpdate("Status: Authenticated")
                startHealthReporting()
            }

            socket?.on("gateway:command") { args ->
                val data = args[0] as JSONObject
                mainHandler.post {
                    handleCommand(data)
                }
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }

    private fun handleCommand(data: JSONObject) {
        // Handle both Socket format ("command") and REST format ("action")
        val action = if (data.has("action")) data.getString("action") else data.optString("command", "NONE")
        
        when (action) {
            "CALL", "DIAL" -> {
                val number = data.getString("phoneNumber")
                val sessionId = data.optString("sessionId", "unknown")
                dialNumber(number, sessionId)
            }
        }
    }

    private fun dialNumber(number: String, sessionId: String) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            sendStatusUpdate("Status: Error - No Call Permission")
            return
        }

        try {
            val intent = Intent(Intent.ACTION_CALL)
            intent.data = Uri.parse("tel:$number")
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)

            reportCallStatus(sessionId, "start")
            sendStatusUpdate("Dialing: $number")
            
            // Log locally
            val prefs = getSharedPreferences("GatewayLogs", Context.MODE_PRIVATE)
            val logs = prefs.getString("history", "") ?: ""
            val timestamp = java.text.SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())
            prefs.edit().putString("history", "$number ($timestamp)|$logs").apply()
            
        } catch (e: Exception) {
            reportCallStatus(sessionId, "end", "FAILED")
            sendStatusUpdate("Status: Dialing Failed")
        }
    }

    private fun reportCallStatus(callId: String, endpoint: String, status: String? = null) {
        if (callId == "unknown") return

        Thread {
            try {
                val url = URL("$serverUrl/api/gateway/call/$endpoint")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.doOutput = true
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

    private fun startHealthReporting() {
        Timer().scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                val batteryLevel = getBatteryLevel()
                val healthData = JSONObject().apply {
                    put("battery", batteryLevel)
                    put("status", "ONLINE")
                }
                socket?.emit("gateway:health_update", healthData)
            }
        }, 0, 60000)
    }

    private fun getBatteryLevel(): Int {
        val bm = getSystemService(BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun getSimPhoneNumber(): String? {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_NUMBERS) != PackageManager.PERMISSION_GRANTED) {
            return null
        }
        return try {
            val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            tm.line1Number
        } catch (e: Exception) {
            null
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(CHANNEL_ID, "Gateway Service", NotificationManager.IMPORTANCE_LOW)
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
        socket?.disconnect()
        super.onDestroy()
    }
}
