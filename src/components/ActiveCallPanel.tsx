import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PhoneOff, MicOff, Mic, Pause, Play, User, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ActiveCallPanel() {
  const { activeCall, token, setSelectedClient, setClientDrawerOpen } = useAppStore();
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall && activeCall.status === 'CONNECTED') {
      const start = new Date(activeCall.startedAt).getTime();
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  if (!activeCall) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleHangup = async () => {
    try {
      await fetch(`/api/calls/${activeCall.id}/hangup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenProfile = () => {
    if (activeCall.client) {
      setSelectedClient(activeCall.client);
      setClientDrawerOpen(true);
    }
  };

  return (
    <div className="absolute bottom-6 right-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col z-50">
      <div className={cn(
        "px-4 py-3 text-white flex justify-between items-center",
        activeCall.status === 'CONNECTED' ? "bg-green-600" : "bg-blue-600"
      )}>
        <div className="font-medium">
          {activeCall.status === 'DIALING' && 'Dialing...'}
          {activeCall.status === 'RINGING' && 'Ringing...'}
          {activeCall.status === 'CONNECTED' && 'Connected'}
          {activeCall.status === 'ON_HOLD' && 'On Hold'}
        </div>
        <div className="font-mono text-sm">
          {activeCall.status === 'CONNECTED' ? formatTime(duration) : '00:00'}
        </div>
      </div>
      
      <div className="p-6 flex flex-col items-center text-center relative">
        {activeCall.client && (
          <button 
            onClick={handleOpenProfile}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Open Client Profile"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        )}
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          {activeCall.client?.name || 'Unknown Caller'}
        </h3>
        <p className="text-gray-500">{activeCall.phoneNumber}</p>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
          {activeCall.direction} CALL
        </p>
      </div>

      <div className="px-6 pb-6 flex justify-center gap-4">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            isMuted ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        
        <button 
          onClick={handleHangup}
          className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
        >
          <PhoneOff className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setIsOnHold(!isOnHold)}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
            isOnHold ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {isOnHold ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
