package com.callflow.gateway

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

data class CallRecord(
    val phoneNumber: String,
    val timestamp: String,
    val direction: String = "OUTBOUND"
)

class CallLogAdapter(private val logs: List<CallRecord>) : RecyclerView.Adapter<CallLogAdapter.ViewHolder>() {

    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvNumber: TextView = view.findViewById(android.R.id.text1)
        val tvSub: TextView = view.findViewById(android.R.id.text2)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(android.R.layout.simple_list_item_2, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val log = logs[position]
        holder.tvNumber.text = log.phoneNumber
        holder.tvSub.text = log.timestamp
    }

    override fun getItemCount() = logs.size
}
