'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-innovation relative overflow-hidden">
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none"></div>

      {/* Floating Innovation Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-green-400/10 blur-[120px] rounded-full animate-pulse"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--primary-green)] to-[var(--secondary-blue)] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg transform group-hover:rotate-12 transition-transform">H</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900 tracking-tight leading-none uppercase">HACKATHON</span>
            <span className="text-[10px] font-bold text-[var(--accent-orange)] tracking-widest uppercase leading-none">PORTAL</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/login')} className="text-sm font-semibold text-slate-500 hover:text-[var(--secondary-blue)] transition-colors">Support</button>
          <button onClick={() => router.push('/login')} className="btn-blue py-2.5 px-6 !rounded-xl text-sm shadow-lg shadow-blue-200 hover:-translate-y-0.5 transition-transform">Login</button>
          <div className="w-10 h-10 relative hidden sm:block grayscale hover:grayscale-0 transition-all">
            <Image src="/images/institution_logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-block px-4 py-1.5 bg-white/80 backdrop-blur-sm text-[var(--primary-green)] rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-green-100 shadow-sm">
              🚀 Elevate Your Vision
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-8">
              Engineer Your <br/> 
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--secondary-blue)] to-[var(--primary-green)]">Ultimate</span> Pitch
            </h1>
            
            <p className="text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              Transform raw innovation into professional artifacts in minutes. 
              The most advanced synthesis engine for institutional hackathons.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <button 
                onClick={() => router.push('/login')} 
                className="w-full sm:w-auto btn-green !py-4 !px-10 !rounded-2xl text-base shadow-2xl shadow-green-200 hover:-translate-y-1 transition-transform"
              >
                Get Started
              </button>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-xl font-bold text-slate-800 uppercase tracking-tighter">SYNTHESIS HUB</span>
                <span className="text-sm font-semibold text-slate-400">AI-Powered Flow</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-8 border-white bg-slate-100 group">
              <Image 
                src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbm95Zm55bm95Zm55bm95Zm55bm95Zm55bm95Zm55bm95Zm55bm95Zm55/L1R1TVThqWgtW/giphy.gif"
                alt="Innovation GIF" 
                fill 
                className="object-cover transition-scale duration-700 group-hover:scale-105 opacity-90"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-2xl transform hover:translate-y-[-5px] transition-transform">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    <span className="text-xs font-bold text-slate-800 uppercase">System Synthesis</span>
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase px-3 py-1 bg-gradient-to-r from-green-500 to-teal-500 rounded-full shadow-sm">Active Engine</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[var(--secondary-blue)] to-[var(--primary-green)] h-full w-[85%] animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-40">
          {[
            { icon: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3V5M3V5M3V5M3V5M3V5M3V5M3V5M3V5M3V5M3V5M3V5/3o7TKSjRrfIPjeiB5C/giphy.gif', title: 'Seamless Flow', desc: 'Watch your mission data transform into structured artifacts in real-time.' },
            { icon: 'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5/3oKIPEqDGUULpEU0aQ/giphy.gif', title: 'Asset Logic', desc: 'Intelligent persistence ensures your vision is never lost during the mission.' },
            { icon: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5bDV5/xT1R9T8c5gJ0F00K6A/giphy.gif', title: 'Final Delivery', desc: 'Expert-grade PPTX synthesized with precise institutional formatting.' }
          ].map((feature, i) => (
            <div key={i} className="bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white hover:-translate-y-2 transition-all duration-300 group cursor-default">
              <div className="w-20 h-20 mb-8 rounded-2xl overflow-hidden shadow-inner bg-slate-50 border border-slate-100 relative">
                <Image src={feature.icon} alt="Icon" fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
              </div>
              <h3 className="font-extrabold text-2xl text-slate-900 mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative px-6 py-20 border-t border-slate-200/50 text-center z-10 bg-white/20 backdrop-blur-md">
        <p className="text-sm font-bold text-slate-400 tracking-widest">HACKATHON PORTAL <span className="text-[var(--primary-green)] mx-2">//</span> 2026 INSTITUTIONAL EDITION</p>
      </footer>
    </div>
  );
}