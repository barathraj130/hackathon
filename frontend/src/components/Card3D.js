'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

export default function Card3D({ children, className = '', glowColor = 'rgba(59, 130, 246, 0.2)', ...props }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const maskImage = useMotionTemplate`radial-gradient(350px circle at ${x}px ${y}px, ${glowColor}, transparent 45%)`;

  return (
    <motion.div
      className={`relative rounded-3xl border border-white/50 bg-white/80 backdrop-blur-xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] ${className}`}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - rect.left);
        y.set(e.clientY - rect.top);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={{ y: -10, scale: 1.02, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-blue-400/30 to-green-400/30"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
