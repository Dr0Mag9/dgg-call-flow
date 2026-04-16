package com.callflow.gateway

import android.Manifest
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager

import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    private lateinit var etServerUrl: EditText
    private lateinit var etApiKey: EditText
    private lateinit var btnStart: Button
    private lateinit var btnStop: Button
    private lateinit var tvStatus: TextView

    private val statusReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            intent?.getStringExtra("status")?.let {
                tvStatus.text = it
            }
        }
    }


    private val PERMISSIONS = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        arrayOf(
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.READ_PHONE_NUMBERS,
            Manifest.permission.ANSWER_PHONE_CALLS,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.POST_NOTIFICATIONS
        )
    } else {
        arrayOf(
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.READ_PHONE_NUMBERS,
            Manifest.permission.ANSWER_PHONE_CALLS,
            Manifest.permission.READ_CALL_LOG,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
    }


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        etServerUrl = findViewById(R.id.etServerUrl)
        etApiKey = findViewById(R.id.etApiKey)
        btnStart = findViewById(R.id.btnStart)
        btnStop = findViewById(R.id.btnStop)
        tvStatus = findViewById(R.id.tvStatus)
        val btnHistory: Button = findViewById(R.id.btnHistory)

        val prefs = getSharedPreferences("GatewayPrefs", Context.MODE_PRIVATE)
        etServerUrl.setText(prefs.getString("server_url", ""))
        etApiKey.setText(prefs.getString("api_key", ""))

        btnStart.setOnClickListener {
            if (checkPermissions()) {
                saveAndStartService()
            } else {
                requestPermissions()
            }
        }

        btnStop.setOnClickListener {
            stopService(Intent(this, GatewayService::class.java))
            tvStatus.text = "Status: Disconnected"
            Toast.makeText(this, "Gateway Stopped", Toast.LENGTH_SHORT).show()
        }

        btnHistory.setOnClickListener {
            startActivity(Intent(this, CallHistoryActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        registerReceiver(statusReceiver, IntentFilter("com.callflow.gateway.STATUS_UPDATE"))
    }

    override fun onPause() {
        super.onPause()
        unregisterReceiver(statusReceiver)
    }


    private fun saveAndStartService() {
        val url = etServerUrl.text.toString().trim()
        val key = etApiKey.text.toString().trim()

        if (url.isEmpty() || key.isEmpty()) {
            Toast.makeText(this, "Please enter all details", Toast.LENGTH_SHORT).show()
            return
        }

        val prefs = getSharedPreferences("GatewayPrefs", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putString("server_url", url)
            putString("api_key", key)
            apply()
        }

        val intent = Intent(this, GatewayService::class.java)
        intent.putExtra("SERVER_URL", url)
        intent.putExtra("API_KEY", key)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }

        tvStatus.text = "Status: Connecting..."
        Toast.makeText(this, "Gateway Starting...", Toast.LENGTH_SHORT).show()
    }

    private fun checkPermissions(): Boolean {
        return PERMISSIONS.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
    }

    private fun requestPermissions() {
        ActivityCompat.requestPermissions(this, PERMISSIONS, 101)
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 101 && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
            saveAndStartService()
        } else {
            Toast.makeText(this, "Permissions required for Gateway operation", Toast.LENGTH_LONG).show()
        }
    }
}
