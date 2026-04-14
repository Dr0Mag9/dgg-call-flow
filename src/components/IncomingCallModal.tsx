import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, PhoneOff, User } from 'lucide-react';

export default function IncomingCallModal() {
  const { incomingCall, token } = useAppStore();

  if (!incomingCall) return null;

  const handleAnswer = async () => {
    try {
      await fetch(`/api/calls/${incomingCall.id}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async () => {
    try {
      await fetch(`/api/calls/${incomingCall.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
          {/* Ringing animation rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border-4 border-white/20 animate-ping" />
          </div>
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-4 backdrop-blur-md">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {incomingCall.client?.name || 'Unknown Caller'}
            </h2>
            <p className="text-blue-100 text-lg">{incomingCall.phoneNumber}</p>
            <p className="text-blue-200 text-sm mt-2 uppercase tracking-widest font-semibold animate-pulse">
              Incoming Call...
            </p>
          </div>
        </div>
        
        <div className="p-8 flex justify-center gap-8 bg-gray-50">
          <button 
            onClick={handleReject}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
              <PhoneOff className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-600">Decline</span>
          </button>
          
          <button 
            onClick={handleAnswer}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center group-hover:bg-green-600 transition-all shadow-lg shadow-green-500/40 animate-bounce">
              <Phone className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-gray-600">Answer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
