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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      
      <Link href="/" className="fixed top-8 left-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[var(--secondary-blue)] transition-all group z-50 uppercase tracking-widest">
         ← Go Back
      </Link>

      <div className="fixed top-8 right-8 z-50">
        <div className="w-12 h-12 relative">
          <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>
      
      <div className="relative z-10 w-full max-w-md px-6 animate-fade text-center">
         <div className="mb-10">
            <div className="w-16 h-16 bg-[var(--primary-green)] rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl mx-auto mb-6">H</div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">HACKATHON</h1>
            <p className="text-[10px] font-bold text-[var(--accent-orange)] uppercase tracking-widest mt-2">LOGIN PORTAL</p>
         </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-left">
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="label-premium">Team Name</label>
              <input 
                type="text" 
                className="input-premium font-bold"
                placeholder="Ex: Team Alpha" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>

            <div>
              <label className="label-premium">Password</label>
              <input 
                type="password" 
                className="input-premium font-bold"
                placeholder="Enter password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-green !py-4 rounded-2xl text-sm font-bold shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center text-xs font-semibold text-slate-400">
          2026 Hackathon Edition
        </div>
      </div>
    </div>
  );
}