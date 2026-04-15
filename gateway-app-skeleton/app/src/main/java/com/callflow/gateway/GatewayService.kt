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
import android.telephony.SignalStrength
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager


class GatewayService : Service() {

    private var socket: Socket? = null
    private val CHANNEL_ID = "GatewayServiceChannel"

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val serverUrl = intent?.getStringExtra("SERVER_URL") ?: return START_NOT_STICKY
        val apiKey = intent?.getStringExtra("API_KEY") ?: return START_NOT_STICKY

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("CallFlow Gateway Active")
            .setContentText("Connected to $serverUrl")
            .setSmallIcon(android.R.drawable.stat_sys_phone_call)
            .build()

        startForeground(1, notification)
        connectToSocket(serverUrl, apiKey)

        return START_STICKY
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
                sendStatusUpdate("Status: Authenticating...")
                startHealthReporting()
            }

            socket?.on("gateway:ready") {
                sendStatusUpdate("Status: Connected")
            }

            socket?.on(Socket.EVENT_CONNECT_ERROR) {
                sendStatusUpdate("Status: Connection Error")
            }

            socket?.on("gateway:error") { args ->
                val data = args[0] as JSONObject
                sendStatusUpdate("Status: ${data.optString("message", "Error")}")
            }

            socket?.on("gateway:command") { args ->

                val data = args[0] as JSONObject
                handleCommand(data)
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }

    private fun startHealthReporting() {
        Timer().scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                val batteryLevel = getBatteryLevel()
                val signalLevel = getSignalStrength()
                val healthData = JSONObject().apply {
                    put("battery", batteryLevel)
                    put("signal", signalLevel)
                    put("status", "ONLINE")
                }
                socket?.emit("gateway:health_update", healthData)

            }
        }, 0, 60000) // Every 1 minute
    }

    private fun getBatteryLevel(): Int {
        val bm = getSystemService(BATTERY_SERVICE) as BatteryManager
        return bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
    }

    private fun getSignalStrength(): Int {
        return try {
            val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val signal = tm.signalStrength
                signal?.level ?: 0 // Returns value from 0 to 4
            } else {
                0
            }
        } catch (e: Exception) {
            0
        }
    }

    private fun getSimPhoneNumber(): String? {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_NUMBERS) != PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return null
        }

        return try {
            val tm = getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            var number = tm.line1Number
            
            if (number.isNullOrEmpty() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                val subscriptionManager = getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
                val activeSubscriptionInfoList = subscriptionManager.activeSubscriptionInfoList
                if (!activeSubscriptionInfoList.isNullOrEmpty()) {
                    // Try to get number from first active SIM
                    number = activeSubscriptionInfoList[0].number
                }
            }
            
            if (number.isNullOrEmpty()) null else number
        } catch (e: Exception) {
            null
        }
    }


    private fun handleCommand(data: JSONObject) {
        val command = data.getString("command")
        when (command) {
            "DIAL" -> {
                val number = data.getString("phoneNumber")
                dialNumber(number)
            }
            "HANGUP" -> {
                // Implementation for hanging up varies by Android version
                // Usually requires AccessibilityService or root for automated hangup
            }
        }
    }

    private fun dialNumber(number: String) {
        val intent = Intent(Intent.ACTION_CALL)
        intent.data = Uri.parse("tel:$number")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)

        // Log the call locally for history view
        val prefs = getSharedPreferences("GatewayLogs", Context.MODE_PRIVATE)
        val logs = prefs.getString("history", "") ?: ""
        val timestamp = java.text.SimpleDateFormat("dd/MM HH:mm", java.util.Locale.getDefault()).format(java.util.Date())
        val newLogs = "$number ($timestamp)|$logs"
        prefs.edit().putString("history", newLogs).apply()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID, "Gateway Service Channel",
                NotificationManager.IMPORTANCE_DEFAULT
            )
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
        sendStatusUpdate("Status: Disconnected")
        socket?.disconnect()
        super.onDestroy()
    }

}
