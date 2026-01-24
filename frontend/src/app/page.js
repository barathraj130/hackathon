'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-bg-light overflow-x-hidden">
      {/* Dynamic Background Ornament */}
      <div className="fixed top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal/5 blur-[120px] rounded-full z-0"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-royal/5 blur-[100px] rounded-full z-0"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-pane border-b border-gray-100 px-10 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-navy/20">S</div>
          <div>
            <span className="text-xl font-black text-navy tracking-tighter uppercase leading-none block">System</span>
            <span className="text-[10px] font-bold text-teal tracking-[0.2em] uppercase leading-none">Synthesis</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden sm:flex items-center gap-6">
            <button onClick={() => router.push('/login')} className="text-xs font-bold text-slate-500 hover:text-navy transition-colors uppercase tracking-widest">Support</button>
            <button onClick={() => router.push('/login')} className="btn-primary !py-3">Launch Interface</button>
          </div>
          {/* Institutional Logo - Right Corner */}
          <div className="w-12 h-12 md:w-16 md:h-16 relative">
            <Image src="/images/institution_logo.png" alt="Institutional Logo" fill className="object-contain" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto pt-32 md:pt-48 pb-20 md:pb-32 px-6 md:px-10">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="animate-fade-in text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-royal/5 border border-royal/10 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-royal"></span>
              </span>
              <span className="text-[10px] font-extrabold text-royal uppercase tracking-widest">JIT Institutional Standard v4.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-navy leading-[0.95] tracking-tighter mb-8">
              Intelligence <br className="hidden md:block"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal to-teal">Driven Synthesis</span>
            </h1>
            
            <p className="text-base md:text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 leading-relaxed mb-12">
              Transform architectural logic and technical identifiers into professional-grade artifacts. 
              The official JIT high-fidelity innovation engine for rapid deployment cycles.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <button 
                onClick={() => router.push('/login')} 
                className="w-full sm:w-auto bg-navy text-white px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-navy/30"
              >
                Start Processing
              </button>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-2xl font-black text-navy leading-none">JIT-HACK</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Portal</span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in delay-200">
            <div className="relative aspect-square rounded-[40px] overflow-hidden shadow-2xl shadow-navy/20 border-8 border-white">
              <Image 
                src="/images/hero_bg.png" 
                alt="Synthesis Engine" 
                fill 
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent"></div>
              
              {/* Floating Status UI */}
              <div className="absolute bottom-8 left-8 right-8 glass-pane p-6 rounded-2xl border-white/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Synthesis Pipeline</span>
                  <span className="text-[10px] font-black text-teal uppercase px-2 py-1 bg-teal/20 rounded">Active</span>
                </div>
                <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-teal h-full w-[75%] animate-pulse"></div>
                </div>
              </div>
            </div>
            
            {/* Background elements for depth */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-royal/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Technical Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-40">
          {[
            { icon: '💎', title: 'Logic Automation', desc: 'Standardizes complex technical project flows into structured slide hierarchies.' },
            { icon: '⚡', title: 'Stateless Sync', desc: 'Unified server-side timestamps for synchronized team submissions.' },
            { icon: '🏆', title: 'Expert Pitch', desc: 'Auto-generation of comparative market analytics and system architecture visuals.' }
          ].map((feature, i) => (
            <div key={i} className="dashboard-card group">
              <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-110 origin-left">{feature.icon}</div>
              <h3 className="font-extrabold text-xl text-navy mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer-ish */}
      <footer className="px-10 py-20 border-t border-gray-100 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Restricted Institutional Property // System Synthesis 2026</p>
      </footer>
    </div>
  );
}