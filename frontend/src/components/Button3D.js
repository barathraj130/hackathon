'use client';

import { motion } from 'framer-motion';

const variants = {
  green: 'bg-[var(--primary-green)] shadow-[0_6px_0_#16a34a] hover:shadow-[0_4px_0_#16a34a] active:shadow-[0_0_0_#16a34a] active:translate-y-[6px]',
  blue: 'bg-[var(--secondary-blue)] shadow-[0_6px_0_#2563eb] hover:shadow-[0_4px_0_#2563eb] active:shadow-[0_0_0_#2563eb] active:translate-y-[6px]',
  orange: 'bg-[var(--accent-orange)] shadow-[0_6px_0_#ea580c] hover:shadow-[0_4px_0_#ea580c] active:shadow-[0_0_0_#ea580c] active:translate-y-[6px]',
};

export default function Button3D({ children, variant = 'green', className = '', ...props }) {
  return (
    <motion.button
      className={`relative px-6 py-3 rounded-xl font-semibold text-white transition-all duration-150 ${variants[variant] || variants.green} ${className}`}
      whileHover={{ y: 2 }}
      whileTap={{ y: 6, transition: { duration: 0.1 } }}
      style={{ transformStyle: 'preserve-3d' }}
      {...props}
    >
      <span className="relative" style={{ transform: 'translateZ(4px)' }}>{children}</span>
    </motion.button>
  );
}
