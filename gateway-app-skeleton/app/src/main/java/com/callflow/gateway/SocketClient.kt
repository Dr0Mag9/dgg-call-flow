package com.callflow.gateway

import org.json.JSONObject
import java.net.URI

class SocketClient(private val endpoint: String, private val apiKey: String) {

    // Pseudo-code for WebSocket connection
    fun connect() {
        println("Connecting to WS: $endpoint with API Key: $apiKey")
        
        // In a real app, use okhttp3 WebSocket
        // val client = OkHttpClient()
        // val request = Request.Builder().url(endpoint).addHeader("Authorization", apiKey).build()
        // val ws = client.newWebSocket(request, object : WebSocketListener() {
        //     override fun onMessage(webSocket: WebSocket, text: String) {
        //         val msg = JSONObject(text)
        //         handleCommand(msg)
        //     }
        // })
    }

    private fun handleCommand(msg: JSONObject) {
        when(msg.getString("command")) {
            "DIAL" -> {
                val phoneNumber = msg.getString("phoneNumber")
                val callId = msg.getString("callId")
                CallController.dial(phoneNumber, callId)
            }
            "END" -> CallController.endCall()
            "ANSWER" -> CallController.answerCall()
        }
    }
}
