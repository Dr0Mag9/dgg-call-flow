import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { PhoneCall, Lock, Mail, ArrowRight } from 'lucide-react';
import LuxuryBackground from '../components/LuxuryBackground';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.token, data.user);
      
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/agent');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-navy">
      <LuxuryBackground />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [Math.random() * 1000, -100],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute w-1 h-1 bg-gold rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: '100%' }}
          />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-gold-light via-gold to-gold-deep shadow-2xl shadow-gold/20 mb-6"
          >
            <PhoneCall className="w-10 h-10 text-navy" />
          </motion.div>
          <h2 className="text-4xl font-black text-pearl tracking-tight mb-2">
            Welcome to <span className="gold-text-gradient">CallFlow</span>
          </h2>
          <p className="text-gold-light/60 font-medium tracking-wide uppercase text-xs">
            Unlock Your Prosperity Today
          </p>
        </div>

        <div className="luxury-card p-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gold-light/60 uppercase tracking-widest pl-1">
                Executive ID (Email)
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gold/40 group-focus-within/input:text-gold transition-colors" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-navy/50 border border-gold/10 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 text-pearl transition-all outline-none"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gold-light/60 uppercase tracking-widest pl-1">
                Secure Key (Password)
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gold/40 group-focus-within/input:text-gold transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 bg-navy/50 border border-gold/10 rounded-xl focus:ring-2 focus:ring-gold/20 focus:border-gold/30 text-pearl transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <label className="flex items-center gap-3 cursor-pointer group/check">
                <input
                  type="checkbox"
                  className="hidden"
                />
                <div className="w-5 h-5 rounded-md border border-gold/20 flex items-center justify-center group-hover/check:border-gold/40 transition-colors">
                  <div className="w-2.5 h-2.5 bg-gold rounded-sm opacity-0" />
                </div>
                <span className="text-sm text-pearl/40 group-hover:text-pearl/60 transition-colors">Remember my account</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="luxury-button w-full flex items-center justify-center gap-2 group/btn"
            >
              <span className="relative z-10">{loading ? 'Initiating...' : 'Secure Access'}</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-sm text-gold-light/30">
          Powered by <span className="text-gold-light/60 font-bold">CallFlow Wealth System</span>
        </p>
      </motion.div>
    </div>
  );
}
