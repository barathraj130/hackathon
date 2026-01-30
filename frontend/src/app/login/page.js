'use client';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
      const res = await axios.post(`${apiUrl}/auth/login`, { username, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      if (res.data.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/team/dashboard');
      }
    } catch (err) {
      alert("Login Failed: Wrong username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-innovation flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/5 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-400/5 blur-[120px] rounded-full animate-pulse"></div>

      <Link href="/" className="fixed top-8 left-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[var(--secondary-blue)] transition-all group z-50 uppercase tracking-widest">
         ← Go Back
      </Link>

      <div className="fixed top-8 right-8 z-50">
        <div className="w-12 h-12 relative grayscale opacity-50">
          <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-6 animate-fade">
         <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--primary-green)] to-[var(--secondary-blue)] rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl mx-auto mb-6 transform hover:rotate-6 transition-transform">H</div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">HACKATHON</h1>
            <p className="text-[11px] font-black text-[var(--accent-orange)] uppercase tracking-[0.3em] mt-3 bg-orange-50 inline-block px-3 py-1 rounded-full">Institutional Portal</p>
         </div>

        <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white text-left overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent -mr-8 -mt-8 rounded-full"></div>
          
          <form onSubmit={handleLogin} className="relative z-10 space-y-8">
            <div>
              <label className="label-premium">Identity Identifier</label>
              <input 
                type="text" 
                className="input-premium font-bold placeholder:font-normal"
                placeholder="Ex: Team Alpha or Admin" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>

            <div>
              <label className="label-premium">Access Key</label>
              <input 
                type="password" 
                className="input-premium font-bold placeholder:font-normal"
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-blue !py-5 rounded-2xl text-base font-black uppercase tracking-widest shadow-2xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              {loading ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Validating...</span>
              ) : (
                <span>Authenticate</span>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
           2026 Innovation Cycle
        </div>
      </div>
    </div>
  );
}