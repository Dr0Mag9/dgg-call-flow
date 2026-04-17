import React from 'react';
import { motion } from 'framer-motion';

export default function LuxuryBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Deep Base */}
      <div className="absolute inset-0 bg-[#060B14]" />
      
      {/* Heavenly Light Beams */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-gold via-transparent to-transparent -rotate-[15deg] blur-[80px] w-40" />
        <div className="absolute top-0 right-1/3 w-[1px] h-full bg-gradient-to-b from-gold-light via-transparent to-transparent rotate-[20deg] blur-[100px] w-60" />
      </div>

      {/* Layered Floating Clouds */}
      <div className="absolute inset-0">
        {/* Cloud 1 */}
        <motion.div
          animate={{ 
            x: [-100, 100, -100],
            y: [-50, 50, -50],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[10%] -left-[10%] w-[800px] h-[600px] bg-gold/10 blur-[180px] rounded-full"
        />
        
        {/* Cloud 2 */}
        <motion.div
          animate={{ 
            x: [100, -100, 100],
            y: [50, -50, 50],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[5%] -right-[15%] w-[900px] h-[700px] bg-gold-light/10 blur-[200px] rounded-full"
        />

        {/* Cloud 3 (Deep Gold) */}
        <motion.div
          animate={{ 
            x: [0, 150, 0],
            y: [0, 80, 0],
          }}
          transition={{
            duration: 50,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[500px] bg-gold-deep/5 blur-[220px] rounded-[100%]"
        />
      </div>

      {/* Waterfall of Gold Shimmer & Sparkles */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ 
              y: '100%', 
              opacity: [0, 0.3, 0] 
            }}
            transition={{
              duration: 10 + Math.random() * 8,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "linear"
            }}
            style={{
              left: `${i * 15}%`,
              width: '1px',
              height: '400px',
              background: 'linear-gradient(to bottom, transparent, #D4AF37, transparent)'
            }}
            className="absolute"
          />
        ))}

        {/* Small Sparkling Dust */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ y: -20, opacity: 0 }}
            animate={{ 
              y: ['0vh', '100vh'],
              opacity: [0, 0.8, 0],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              width: '2px',
              height: '2px',
              boxShadow: '0 0 10px #F5D77A'
            }}
            className="absolute bg-gold-light rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
