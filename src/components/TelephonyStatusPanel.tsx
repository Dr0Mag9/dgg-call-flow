import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PhoneCall, Activity, Signal, Smartphone } from 'lucide-react';

export default function TelephonyStatusPanel() {
  const { user, token } = useAppStore();
  const [lineInfo, setLineInfo] = useState<any>(null);

  useEffect(() => {
    // Determine assigned line. This would ideally be fetched from /api/agents/me/line.
    // For this implementation, we will assume we have an endpoint that returns line details.
    
    // Simulate fetching assigned line data
    fetch('/api/auth/me', {
       headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.agent?.telephonyLine) {
         setLineInfo(data.agent.telephonyLine);
      }
    });

  }, [token]);

  return (
    <div className="bg-white shadow rounded-lg border border-gray-100 p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <PhoneCall className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Assigned Inbound/Outbound Line</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-gray-900">
               {lineInfo ? lineInfo.number : 'Unassigned'}
            </span>
            {lineInfo && (
              <span className={`text-xs px-2 py-0.5 rounded-full border ${lineInfo.providerType === 'SIP' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-orange-50 text-orange-700 border-orange-200'} font-medium flex items-center gap-1`}>
                {lineInfo.providerType === 'SIP' ? <Activity className="w-3 h-3"/> : <Smartphone className="w-3 h-3"/>}
                {lineInfo.providerType}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Telephony Link</p>
          <p className={`text-sm ${lineInfo ? 'text-green-600' : 'text-gray-500'}`}>
            {lineInfo ? 'Registered' : 'Disconnected'}
          </p>
        </div>
        <Signal className={`w-6 h-6 ${lineInfo ? 'text-green-500' : 'text-gray-300'}`} />
      </div>
    </div>
  );
}
