package com.callflow.gateway

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.telecom.TelecomManager
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

object CallController {

    private var telecomManager: TelecomManager? = null
    private var context: Context? = null

    fun init(ctx: Context) {
        context = ctx
        telecomManager = ctx.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
    }

    /**
     * Place a phone call using ACTION_CALL intent.
     * Requires CALL_PHONE permission.
     */
    fun dial(phoneNumber: String, callId: String): Boolean {
        val ctx = context ?: return false

        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CALL_PHONE) 
            != PackageManager.PERMISSION_GRANTED) {
            println("[CallController] ERROR: CALL_PHONE permission not granted")
            return false
        }

        return try {
            val intent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            ctx.startActivity(intent)
            println("[CallController] Dialing $phoneNumber (callId=$callId)")
            true
        } catch (e: Exception) {
            println("[CallController] Dial failed: ${e.message}")
            false
        }
    }

    /**
     * End the current active call.
     * Uses TelecomManager.endCall() on API 28+ (Android 9+).
     * Requires ANSWER_PHONE_CALLS permission.
     */
    @Suppress("DEPRECATION")
    fun endCall(): Boolean {
        val ctx = context ?: return false

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
            println("[CallController] endCall requires API 28+")
            return false
        }

        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.ANSWER_PHONE_CALLS)
            != PackageManager.PERMISSION_GRANTED) {
            println("[CallController] ERROR: ANSWER_PHONE_CALLS permission not granted")
            return false
        }

        return try {
            val tm = telecomManager ?: return false
            val ended = tm.endCall()
            println("[CallController] endCall() returned: $ended")
            ended
        } catch (e: Exception) {
            println("[CallController] endCall failed: ${e.message}")
            false
        }
    }

    /**
     * Answer an incoming call.
     * Uses TelecomManager.acceptRingingCall() on API 26+ (Android 8+).
     * Requires ANSWER_PHONE_CALLS permission.
     */
    @Suppress("DEPRECATION")
    fun answerCall(): Boolean {
        val ctx = context ?: return false

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            println("[CallController] answerCall requires API 26+")
            return false
        }

        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.ANSWER_PHONE_CALLS)
            != PackageManager.PERMISSION_GRANTED) {
            println("[CallController] ERROR: ANSWER_PHONE_CALLS permission not granted")
            return false
        }

        return try {
            val tm = telecomManager ?: return false
            tm.acceptRingingCall()
            println("[CallController] Answered ringing call")
            true
        } catch (e: Exception) {
            println("[CallController] answerCall failed: ${e.message}")
            false
        }
    }
}
