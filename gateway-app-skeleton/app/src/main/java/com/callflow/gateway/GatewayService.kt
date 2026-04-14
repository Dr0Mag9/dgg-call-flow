package com.callflow.gateway

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
                socket?.emit("gateway:auth", key)
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

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        socket?.disconnect()
        super.onDestroy()
    }
}
