import React from 'react';
import { motion } from 'motion/react';

export default function LuxuryBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Deep Base */}
      <div className="absolute inset-0 bg-navy" />
      
      {/* Heavenly Glows */}
      <div 
        className="heavenly-glow bg-gold w-[600px] h-[600px] -top-40 -left-40 opacity-10" 
      />
      <div 
        className="heavenly-glow bg-gold-light w-[500px] h-[500px] top-1/2 -right-20 opacity-5" 
      />
      
      {/* Waterfall of Gold Shimmer */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ 
              y: '100%', 
              opacity: [0, 0.2, 0] 
            }}
            transition={{
              duration: 8 + Math.random() * 5,
              repeat: Infinity,
              delay: i * 2,
              ease: "linear"
            }}
            style={{
              left: `${i * 25}%`,
              width: '1px',
              height: '300px',
              background: 'linear-gradient(to bottom, transparent, #D4AF37, transparent)'
            }}
            className="absolute"
          />
        ))}
      </div>

      {/* Soft Cloud Shapes */}
      <motion.div
        animate={{ 
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 blur-[150px] rounded-full"
      />
      <motion.div
        animate={{ 
          x: [0, -40, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-light/5 blur-[120px] rounded-full"
      />
    </div>
  );
}
