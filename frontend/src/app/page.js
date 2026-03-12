'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card3D from '@/components/Card3D';
import Button3D from '@/components/Button3D';
import FloatingOrbs from '@/components/FloatingOrbs';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-innovation relative overflow-hidden" style={{ perspective: '1200px' }}>
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <FloatingOrbs />

      {/* Navigation - 3D depth */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-white/30 px-6 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.04)]"
      >
        <div className="flex items-center gap-2 group cursor-pointer">
          <motion.div
            className="w-10 h-10 bg-gradient-to-br from-[var(--primary-green)] to-[var(--secondary-blue)] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
            whileHover={{ scale: 1.05, rotate: 6 }}
          >
            H
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900 tracking-tight leading-none uppercase">HACKATHON</span>
            <span className="text-[10px] font-bold text-[var(--accent-orange)] tracking-widest uppercase leading-none">PORTAL</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/login')} className="text-sm font-semibold text-slate-500 hover:text-[var(--secondary-blue)] transition-colors">Support</button>
          <Button3D variant="blue" className="py-2.5 px-6 text-sm" onClick={() => router.push('/login')}>Login</Button3D>
          <div className="w-10 h-10 relative hidden sm:block grayscale hover:grayscale-0 transition-all">
            <Image src="/images/institution_logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>
      </motion.nav>

      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur-sm text-[var(--primary-green)] rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-green-100 shadow-sm"
            >
              🚀 Elevate Your Vision
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-8">
              Engineer Your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--secondary-blue)] to-[var(--primary-green)]">Ultimate</span> Pitch
            </h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              Transform raw innovation into professional artifacts in minutes.
              The most advanced synthesis engine for institutional hackathons.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <Button3D variant="green" className="!py-4 !px-10 text-base flex items-center gap-2" onClick={() => router.push('/login')}>
                <span>Get Started</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </Button3D>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex items-center gap-2 text-slate-800 uppercase tracking-tighter">
                  <svg className="w-5 h-5 text-[var(--primary-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="text-xl font-bold">SYNTHESIS HUB</span>
                </div>
                <span className="text-sm font-semibold text-slate-400">AI-Powered Flow</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
            style={{ perspective: '1000px' }}
          >
            <motion.div
              className="relative aspect-[4/3] rounded-3xl overflow-hidden border-8 border-white bg-slate-100"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.5)',
                transformStyle: 'preserve-3d',
              }}
              whileHover={{ rotateY: -3, rotateX: 2, scale: 1.02, transition: { duration: 0.3 } }}
            >
              <Image
                src="/images/hero_engine.png"
                alt="Synthesis Engine"
                fill
                className="object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-2xl">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-xs font-bold text-slate-800 uppercase">System Synthesis</span>
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase px-3 py-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full shadow-sm">Active Engine</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[var(--secondary-blue)] to-[var(--primary-green)] h-full w-[85%] animate-pulse" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-40">
          {[
            { icon: '/images/feature_flow.png', title: 'Seamless Flow', desc: 'Watch your mission data transform into structured artifacts in real-time.', glow: 'rgba(59, 130, 246, 0.2)' },
            { icon: '/images/feature_logic.png', title: 'Asset Logic', desc: 'Intelligent persistence ensures your vision is never lost during the mission.', glow: 'rgba(34, 197, 94, 0.2)' },
            { icon: '/images/feature_delivery.png', title: 'Final Delivery', desc: 'Expert-grade PPTX synthesized with precise institutional formatting.', glow: 'rgba(249, 115, 22, 0.2)' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card3D className="p-8 h-full" glowColor={feature.glow}>
                <div className="w-20 h-20 mb-8 rounded-2xl overflow-hidden shadow-inner bg-slate-50 border border-slate-100 relative min-h-[5rem]">
                  <Image src={feature.icon} alt="Icon" fill className="object-cover" sizes="80px" />
                </div>
                <h3 className="font-extrabold text-2xl text-slate-900 mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
              </Card3D>
            </motion.div>
          ))}
        </div>
      </main>

      <footer className="relative px-6 py-20 border-t border-slate-200/50 text-center z-10 bg-white/20 backdrop-blur-md">
        <p className="text-sm font-bold text-slate-400 tracking-widest">HACKATHON PORTAL <span className="text-[var(--primary-green)] mx-2">//</span> 2026 INSTITUTIONAL EDITION</p>
      </footer>
    </div>
  );
}