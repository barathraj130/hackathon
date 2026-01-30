'use client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[var(--primary-green)] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">H</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-900 tracking-tight leading-none uppercase">HACKATHON</span>
            <span className="text-[10px] font-bold text-[var(--accent-orange)] tracking-widest uppercase leading-none">PORTAL</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/login')} className="text-sm font-semibold text-slate-500 hover:text-[var(--secondary-blue)] transition-colors">Support</button>
          <button onClick={() => router.push('/login')} className="btn-blue py-2.5 px-6 !rounded-xl text-sm">Login</button>
          <div className="w-10 h-10 relative hidden sm:block">
            <Image src="/images/institution_logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-block px-4 py-1.5 bg-green-50 text-[var(--primary-green)] rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-green-100">
              Simplify Your Pitch
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-8">
              Build Your <br/> 
              <span className="text-[var(--secondary-blue)]">Winning</span> Pitch
            </h1>
            
            <p className="text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
              Create professional presentations for your hackathon projects in minutes. 
              Our tool helps teams organize ideas and generate ready-to-use decks.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
              <button 
                onClick={() => router.push('/login')} 
                className="w-full sm:w-auto btn-green !py-4 !px-10 !rounded-2xl text-base shadow-xl shadow-green-200"
              >
                Get Started
              </button>
              <div className="flex flex-col items-center lg:items-start">
                <span className="text-xl font-bold text-slate-800 uppercase">Universal System</span>
                <span className="text-sm font-semibold text-slate-400">All Project Categories</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-50">
              <Image 
                src="/images/hero_bg.png" 
                alt="Interface Preview" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-white/50 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase">Project Status</span>
                  <span className="text-[10px] font-bold text-white uppercase px-2 py-0.5 bg-[var(--primary-green)] rounded">In Progress</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--primary-green)] h-full w-[65%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-40">
          {[
            { icon: '📝', title: 'Easy Formatting', desc: 'Automatically organizes your technical details into beautiful slides.' },
            { icon: '☁️', title: 'Real-time Saving', desc: 'Your progress is saved as you type, so you never lose your work.' },
            { icon: '🎬', title: 'Professional Design', desc: 'Expertly designed layouts that impress judges and mentors.' }
          ].map((feature, i) => (
            <div key={i} className="card-premium hover:-translate-y-2 transition-transform duration-300">
              <div className="text-4xl mb-6">{feature.icon}</div>
              <h3 className="font-bold text-xl text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 py-16 border-t border-slate-100 text-center">
        <p className="text-sm font-semibold text-slate-400">HACKATHON PORTAL // 2026 Edition</p>
      </footer>
    </div>
  );
}