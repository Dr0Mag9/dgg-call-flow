package com.callflow.gateway

import android.Manifest
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.telecom.PhoneAccountHandle
import android.telecom.TelecomManager
import android.telephony.SubscriptionManager
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

object CallController {

    private var telecomManager: TelecomManager? = null
    private var subscriptionManager: SubscriptionManager? = null
    private var context: Context? = null

    fun init(ctx: Context) {
        context = ctx
        telecomManager = ctx.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
        subscriptionManager = ctx.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
    }

    /**
     * Place a phone call using TelecomManager.placeCall.
     * This bypasses the SIM selection dialog by targeting a specific PhoneAccountHandle.
     */
    fun dial(phoneNumber: String, callId: String, simSlot: Int = -1): Boolean {
        val ctx = context ?: return false
        val tm = telecomManager ?: return false

        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            println("[CallController] ERROR: Missing CALL_PHONE or READ_PHONE_STATE permissions")
            return false
        }

        return try {
            val uri = Uri.fromParts("tel", phoneNumber, null)
            val extras = Bundle().apply {
                putString("com.callflow.gateway.CALL_ID", callId)
                if (simSlot >= 0) {
                    val handle = getPhoneAccountHandleForSlot(simSlot)
                    if (handle != null) {
                        putParcelable(TelecomManager.EXTRA_PHONE_ACCOUNT_HANDLE, handle)
                        println("[CallController] Forcing PhoneAccountHandle for Slot $simSlot: ${handle.id}")
                    } else {
                        println("[CallController] WARNING: Could not find handle for slot $simSlot, falling back to default")
                    }
                }
            }

            tm.placeCall(uri, extras)
            println("[CallController] placeCall triggered for $phoneNumber")
            true
        } catch (e: Exception) {
            println("[CallController] placeCall failed: ${e.message}")
            // Fallback to standard intent if placeCall fails
            fallbackDial(ctx, phoneNumber, simSlot)
        }
    }

    private fun getPhoneAccountHandleForSlot(slotIndex: Int): PhoneAccountHandle? {
        val ctx = context ?: return null
        val sm = subscriptionManager ?: return null
        val tm = telecomManager ?: return null

        try {
            val subscriptions = sm.activeSubscriptionInfoList ?: return null
            val subInfo = subscriptions.find { it.simSlotIndex == slotIndex } ?: return null
            
            val accounts = tm.getCallCapablePhoneAccounts()
            // Match the ID or label of the account to the subscription identity
            return accounts.find { it.id.contains(subInfo.subscriptionId.toString()) } 
                   ?: accounts.find { it.id.contains(subInfo.iccId ?: "___") }
                   ?: if (accounts.isNotEmpty() && slotIndex < accounts.size) accounts[slotIndex] else null
        } catch (e: Exception) {
            println("[CallController] Error resolving account handle: ${e.message}")
        }
        return null
    }

    private fun fallbackDial(ctx: Context, phoneNumber: String, simSlot: Int): Boolean {
        return try {
            val intent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                if (simSlot >= 0) {
                    putExtra("com.android.phone.extra.slot", simSlot)
                    putExtra("phone_subscription", simSlot)
                    putExtra("sim_slot", simSlot)
                }
            }
            ctx.startActivity(intent)
            true
        } catch (e: Exception) { false }
    }

    @Suppress("DEPRECATION")
    fun endCall(): Boolean {
        val ctx = context ?: return false
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return false
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.ANSWER_PHONE_CALLS) != PackageManager.PERMISSION_GRANTED) return false

        return try {
            telecomManager?.endCall() ?: false
        } catch (e: Exception) { false }
    }

    @Suppress("DEPRECATION")
    fun answerCall(): Boolean {
        val ctx = context ?: return false
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.ANSWER_PHONE_CALLS) != PackageManager.PERMISSION_GRANTED) return false

        return try {
            telecomManager?.acceptRingingCall()
            true
        } catch (e: Exception) { false }
    }
}
