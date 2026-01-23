'use client';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-10 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#001F3F] rounded flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold text-[#001F3F] tracking-tight">System Synthesis</span>
        </div>
        <button onClick={() => router.push('/login')} className="btn-navy">Team Login</button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto pt-24 pb-20 px-6">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold text-[#001F3F] mb-6">
            The Smart Presentation Engine <br/> for Technical Innovation.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Convert your project milestones into structured, professional decks. 
            A high-precision processing platform for the 24-hour innovation cycle.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <button onClick={() => router.push('/login')} className="btn-navy text-lg px-12">
              Launch Dashboard
            </button>
          </div>
        </div>

        {/* Technical Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="dashboard-card p-8 text-center">
            <div className="text-[#39CCCC] text-3xl mb-4">⚙️</div>
            <h3 className="font-bold text-lg mb-2">Automated Mapping</h3>
            <p className="text-gray-500 text-sm">Translates complex system logic into standardized slide hierarchies.</p>
          </div>
          <div className="dashboard-card p-8 text-center">
            <div className="text-[#39CCCC] text-3xl mb-4">⏱️</div>
            <h3 className="font-bold text-lg mb-2">Temporal Sync</h3>
            <p className="text-gray-500 text-sm">Unified server-side timer ensures synchronized submission for all teams.</p>
          </div>
          <div className="dashboard-card p-8 text-center">
            <div className="text-[#39CCCC] text-3xl mb-4">📄</div>
            <h3 className="font-bold text-lg mb-2">Verified Artifacts</h3>
            <p className="text-gray-500 text-sm">Instant generation of merit documentation and professional deck outputs.</p>
          </div>
        </div>
      </main>
    </div>
  );
}