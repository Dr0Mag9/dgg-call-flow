package com.callflow.gateway

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || 
            intent.action == Intent.ACTION_LOCKED_BOOT_COMPLETED) {
            
            val prefs = context.getSharedPreferences("GatewayPrefs", Context.MODE_PRIVATE)
            val serverUrl = prefs.getString("server_url", "")
            val apiKey = prefs.getString("api_key", "")

            if (!serverUrl.isNullOrEmpty() && !apiKey.isNullOrEmpty()) {
                val serviceIntent = Intent(context, GatewayService::class.java)
                serviceIntent.putExtra("SERVER_URL", serverUrl)
                serviceIntent.putExtra("API_KEY", apiKey)
                
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            }
        }
    }
}
