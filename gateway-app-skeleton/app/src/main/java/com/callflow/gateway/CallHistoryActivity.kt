package com.callflow.gateway

import android.content.Context
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

class CallHistoryActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_call_history)

        val prefs = getSharedPreferences("GatewayLogs", Context.MODE_PRIVATE)
        val historyStr = prefs.getString("history", "") ?: ""
        
        val logs = historyStr.split("|")
            .filter { it.isNotEmpty() }
            .map { 
                val parts = it.split(" (")
                val number = parts[0]
                val time = if (parts.size > 1) parts[1].removeSuffix(")") else "Unknown"
                CallRecord(number, time)
            }

        val rv = findViewById<RecyclerView>(R.id.rvCallHistory)
        rv.layoutManager = LinearLayoutManager(this)
        rv.adapter = CallLogAdapter(logs)

        findViewById<Button>(R.id.btnClose).setOnClickListener {
            finish()
        }
    }
}
