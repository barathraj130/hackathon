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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-c6be.up.railway.app/v1';
      const res = await axios.post(`${apiUrl}/auth/login`, { username, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      
      if (res.data.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/team/dashboard');
      }
    } catch (err) {
      alert("Verification Failed: Authentication parameters incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-light p-10 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-royal/5 blur-[120px] rounded-full z-0"></div>
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-teal/5 blur-[100px] rounded-full z-0"></div>

      <Link href="/" className="fixed top-8 md:top-12 left-8 md:left-12 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-navy transition-all group z-50">
        <span className="w-8 h-px bg-slate-200 group-hover:w-12 transition-all"></span> Sequential Return
      </Link>

      <div className="fixed top-8 md:top-12 right-8 md:right-12 z-50">
        <div className="w-16 h-16 md:w-24 md:h-24 relative">
          <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in text-center">
        <div className="mb-12">
           <div className="w-16 h-16 bg-navy rounded-[1.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl mx-auto mb-6">H</div>
           <h1 className="text-4xl font-black text-navy tracking-tighter uppercase leading-none">hack@jit</h1>
           <p className="text-[10px] font-bold text-teal uppercase tracking-[0.3em] mt-3">JIT IDENTITY VERIFICATION SYSTEM</p>
        </div>

        <div className="glass-pane p-12 rounded-[2.5rem] text-left">
          <form onSubmit={handleLogin} className="space-y-10">
            <div>
              <label className="label-caps">Portal Identity (Team Name)</label>
              <input 
                type="text" 
                className="input-field !text-lg !font-bold"
                placeholder="Institutional ID" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>

            <div>
              <label className="label-caps">Institutional Key (Password)</label>
              <input 
                type="password" 
                className="input-field !text-lg !font-bold"
                placeholder="Secure Access Token" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-navy text-white text-[11px] font-black py-6 rounded-[2rem] tracking-[0.4em] uppercase hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-navy/30 flex items-center justify-center gap-4 group"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Authenticating...
                </span>
              ) : (
                <>
                  <span className="w-2 h-2 bg-teal rounded-full group-hover:animate-ping"></span>
                  Establish Connection
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] leading-relaxed">
          Restricted Institutional Property <br /> All synthesis activities are systematically logged.
        </div>
      </div>
    </div>
  );
}