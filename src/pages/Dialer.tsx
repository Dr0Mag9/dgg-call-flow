import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Phone, Delete } from 'lucide-react';

export default function Dialer({ embedded = false }: { embedded?: boolean }) {
  const [number, setNumber] = useState('');
  const { token, activeCall } = useAppStore();

  const handleDial = async () => {
    if (!number) return;
    try {
      await fetch('/api/calls/outbound', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: number })
      });
      setNumber('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeypadClick = (digit: string) => {
    setNumber(prev => prev + digit);
  };

  return (
    <div className={`${embedded ? 'w-full' : 'max-w-md mx-auto mt-10'}`}>
      <div className="bg-white shadow-xl rounded-3xl overflow-hidden border border-gray-100">
        <div className="p-8 bg-slate-900 text-white text-center">
          <h2 className="text-xl font-medium opacity-80 mb-2">Make a Call</h2>
          <div className="h-12 flex items-center justify-center">
            <span className="text-4xl font-mono tracking-wider">{number || '...'}</span>
          </div>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeypadClick(digit)}
                className="h-16 rounded-full bg-gray-50 text-2xl font-medium text-gray-800 hover:bg-gray-200 transition-colors active:bg-gray-300"
              >
                {digit}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-6">
            <button
              onClick={handleDial}
              disabled={!number || !!activeCall}
              className="w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone className="w-8 h-8" />
            </button>
            <button
              onClick={() => setNumber(prev => prev.slice(0, -1))}
              disabled={!number}
              className="w-20 h-20 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Delete className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
