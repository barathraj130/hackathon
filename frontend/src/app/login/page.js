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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';
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
    <div className="min-h-screen bg-bg-light p-10 font-sans">
      <Link href="/" className="fixed top-10 left-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-navy transition-colors">
        <span>←</span> Sequential Return
      </Link>
      
      <div className="flex flex-col items-center justify-center h-full pt-20">
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🏢</div>
          <h1 className="text-3xl font-extrabold text-brand-navy tracking-tight">System Synthesis</h1>
          <p className="text-[11px] font-extrabold text-brand-blue uppercase tracking-widest mt-1">Institutional Access Portal</p>
        </div>

        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="label-caps">Team Identity</label>
              <input 
                type="text" 
                className="input-field"
                placeholder="Assigned Team Name" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                required 
              />
            </div>

            <div>
              <label className="label-caps">Institutional Key</label>
              <input 
                type="password" 
                className="input-field"
                placeholder="Registration Password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-navy w-full text-sm py-4 rounded-lg flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  VERIFYING...
                </span>
              ) : 'Establish Connection'}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
          Restricted Access. All synthesis activities <br /> are monitored and systematically logged.
        </div>
      </div>
    </div>
  );
}