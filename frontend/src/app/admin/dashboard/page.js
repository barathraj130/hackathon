'use client';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [teams, setTeams] = useState([]);
  const [timer, setTimer] = useState({ timeLeft: 0, formattedTime: '24:00:00', timerPaused: true });
  const [newTeam, setNewTeam] = useState({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1, problemStatementId: '' });
  const [problemStatements, setProblemStatements] = useState([]);
  const [newStatement, setNewStatement] = useState({ questionNo: '', subDivisions: '', title: '', description: '', allottedTo: '' });
  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subFilter, setSubFilter] = useState('ALL');
  const [mounted, setMounted] = useState(false);
  const socketRef = useRef();

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
  };

  useEffect(() => {
    fetchStats();
    fetchTeams();
    fetchProblemStatements();
    fetchSubmissions();
    
    import('socket.io-client').then((module) => {
      const socketIO = module.default || module.io;
      if (!socketIO) return;
      
      const socketUrl = getApiUrl().replace('/v1', '') || process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
      socketRef.current = socketIO(socketUrl);
      
      socketRef.current.on('timerUpdate', (data) => {
        setTimer(data);
      });
    });

    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-[#f1f5f9]" />;

  async function fetchStats() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (err) { console.error("Stats fail", err); }
  }

  async function fetchTeams() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/candidates`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeams(res.data.candidates || []);
    } catch (err) { console.error("Teams fail", err); }
  }

  async function handleDeleteTeam(id) {
    if (!confirm("🚨 REVOke ACCESS?\nThis will purge all data for this team.")) return;
    try {
      await axios.delete(`${getApiUrl()}/admin/teams/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchTeams();
      fetchStats();
    } catch (err) { alert("Revocation failed."); }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    try {
      await axios.post(`${getApiUrl()}/admin/create-team`, newTeam, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Team enrolled.");
      setNewTeam({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1, problemStatementId: '' });
      fetchTeams();
    } catch (err) { alert("Creation failed."); }
  }

  async function fetchProblemStatements() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/problem-statements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProblemStatements(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function handleCreateStatement(e) {
    e.preventDefault();
    try {
      await axios.post(`${getApiUrl()}/admin/problem-statements`, newStatement, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewStatement({ questionNo: '', subDivisions: '', title: '', description: '', allottedTo: '' });
      fetchProblemStatements();
    } catch (err) { alert("Deployment failed."); }
  }

  async function fetchSubmissions() {
    setSubLoading(true);
    try {
      const res = await axios.get(`${getApiUrl()}/admin/submissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(res.data || []);
    } catch (err) { console.error(err); }
    finally { setSubLoading(false); }
  }

  async function toggleRegenerate(teamId, currentValue) {
    if (!confirm(`${currentValue ? 'Lock' : 'Unlock'} regeneration for this team?`)) return;
    try {
      const res = await axios.post(`${getApiUrl()}/admin/toggle-regenerate`, 
        { teamId, canRegenerate: !currentValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      if (res.data.success) {
        fetchSubmissions();
      } else {
        alert(res.data.error || "Update unsuccessful.");
      }
    } catch (err) { 
      const errorMsg = err.response?.data?.error || err.message || "Network Error";
      alert(`Update failed: ${errorMsg}`);
      console.error("Toggle Regenerate Error:", err);
    }
  }

  async function handleForceRegenerate(teamId) {
    if (!confirm("🚨 FORCE SYSTEM RECONSTRUCTION?")) return;
    try {
      const res = await axios.post(`${getApiUrl()}/admin/force-regenerate`, { teamId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(res.data.message);
      fetchSubmissions();
    } catch (err) { alert("Reconstruction failed."); }
  }

  async function handleToggleHalt() {
    try {
      await axios.post(`${getApiUrl()}/admin/toggle-halt`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) { alert("System halt toggle failed."); }
  }

  function getPublicLink(url) {
    if (!url) return '';
    if (url.includes('.up.railway.app')) return url.replace('http://', 'https://');
    return url;
  }

  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(sub => {
    if (subFilter === 'ALL') return true;
    if (subFilter === 'SUBMITTED') return sub.status === 'SUBMITTED';
    if (subFilter === 'LOCKED') return sub.status === 'LOCKED';
    if (subFilter === 'PENDING') return !sub.pptUrl;
    return true;
  }) : [];

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-sans text-slate-800">
      
      {/* Sidebar - Precise Match */}
      <aside className="w-72 bg-[#020617] text-white flex flex-col sticky top-0 h-screen border-r border-white/5 shadow-2xl z-50 transition-all">
        <div className="flex items-center gap-4 py-8 px-6 border-b border-white/5">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-xl border border-white/10 shadow-lg">H</div>
          <div>
             <span className="text-lg font-black tracking-widest uppercase block leading-none">HACK@JIT</span>
             <span className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase leading-none mt-1">AUTHORITY</span>
          </div>
        </div>
        
        <nav className="flex-grow space-y-1 p-4 mt-6">
          {[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'submissions', label: 'SUBMISSIONS' },
            { id: 'problem statements', label: 'PROBLEM STATEMENTS' },
            { id: 'teams', label: 'TEAMS' },
            { id: 'configuration', label: 'CONFIGURATION' },
            { id: 'audit logs', label: 'AUDIT LOGS' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-5 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-between group ${activeTab === tab.id ? 'bg-white/10 text-white shadow-inner border border-white/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              {tab.label}
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === tab.id ? 'bg-emerald-500 scale-100 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-transparent scale-0 group-hover:scale-100 group-hover:bg-white/10'}`}></div>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-4 opacity-50 relative z-10">MASTER TEMPORAL CLOCK</p>
            <p className={`text-4xl font-mono leading-none font-black tabular-nums tracking-tighter relative z-10 ${timer.timerPaused ? 'text-amber-400' : 'text-emerald-400 animate-pulse'}`}>
              {timer.formattedTime}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-grow p-8 overflow-y-auto">
        {/* Module Header - High Contrast */}
        <header className="flex justify-between items-start mb-12">
           <div>
              <h1 className="text-6xl font-black text-[#0f172a] uppercase tracking-tighter leading-none mb-2 opacity-[0.03] absolute -mt-4 -ml-2 pointer-events-none select-none">COMMAND</h1>
              <h1 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter leading-none mb-3 relative">COMMAND CENTER</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.5em]">AUTONOMOUS GOVERNANCE PROTOCOL v4.1</p>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={handleToggleHalt} 
                className={`px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-3 ${timer.timerPaused ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}
              >
                {timer.timerPaused ? 'RESUME HACKATHON' : 'PAUSE HACKATHON'}
              </button>
              <div className="w-12 h-12 relative grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-crosshair">
                <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
           </div>
        </header>

        {activeTab === 'submissions' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-end mb-4">
                <div>
                   <h2 className="text-5xl font-black text-[#0f172a] uppercase tracking-tighter">SUBMISSION VAULT</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">ARTIFACT OVERSIGHT & RESOURCE MANAGEMENT</p>
                </div>
                <div className="flex bg-white p-2 rounded-2xl border border-slate-200 shadow-sm gap-1">
                   {['ALL', 'PENDING', 'SUBMITTED', 'LOCKED'].map(f => (
                     <button 
                        key={f} 
                        onClick={() => setSubFilter(f)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subFilter === f ? 'bg-[#020617] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                     >
                        {f}
                     </button>
                   ))}
                </div>
             </div>

             <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                         <th className="px-8 py-5">CANDIDATE ENTITY</th>
                         <th className="px-8 py-5">NETWORK STATUS</th>
                         <th className="px-8 py-5 text-center">PPT</th>
                         <th className="px-8 py-5">INSTITUTIONAL METADATA</th>
                         <th className="px-8 py-5 text-center">LOCK STATE</th>
                         <th className="px-8 py-5 text-right">VAULT ACTIONS</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                       {filteredSubmissions.map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/30 transition-all group">
                           <td className="px-8 py-6">
                              <p className="font-black text-[#020617] uppercase text-sm tracking-tight">{sub.team?.teamName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sub.team?.collegeName || 'JIT'}</p>
                           </td>
                           <td className="px-8 py-6">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${sub.status === 'LOCKED' ? 'bg-[#020617] text-white' : sub.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}></span>
                                 {sub.status}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              {sub.pptUrl ? <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] mx-auto animate-pulse"></div> : <div className="w-3 h-3 rounded-full border-2 border-slate-200 mx-auto"></div>}
                           </td>
                           <td className="px-8 py-6">
                              {sub.prototypeUrl ? (
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">PROTOTYPE LINK</p>
                                    <a href={sub.prototypeUrl} target="_blank" className="text-[10px] text-teal-600 font-bold uppercase truncate block max-w-xs hover:underline">{sub.prototypeUrl}</a>
                                 </div>
                              ) : <span className="text-[8px] font-black text-slate-300 uppercase italic">PENDING LINKAGE</span>}
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center justify-center gap-2">
                                 <button 
                                    onClick={() => toggleRegenerate(sub.teamId, sub.canRegenerate)}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${sub.canRegenerate ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                                 >
                                    {sub.canRegenerate ? '🔓 OPEN' : '🔒 LOCKED'}
                                 </button>
                                 <button onClick={() => handleForceRegenerate(sub.teamId)} className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-[#020617] hover:text-white transition-all opacity-40 hover:opacity-100">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /></svg>
                                 </button>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                              {sub.pptUrl && (
                                 <a 
                                    href={getPublicLink(sub.pptUrl)} 
                                    target="_blank" 
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#020617] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 transition-all shadow-xl shadow-slate-200"
                                 >
                                    DOWNLOAD ↓
                                 </a>
                              )}
                           </td>
                        </tr>
                       ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 animate-fade-in">
             {[
               { label: 'MASTER ENROLLMENT', val: stats.total_candidates || 0, color: 'text-[#020617]', bg: 'bg-white' },
               { label: 'ACTIVE SYNTHESIS', val: stats.statuses?.in_progress || 0, color: 'text-teal-600', bg: 'bg-white' },
               { label: 'REGISTRY ENTRIES', val: (problemStatements || []).length, color: 'text-indigo-600', bg: 'bg-white' },
               { label: 'ARTIFACT VAULT', val: (submissions || []).filter(s => s.pptUrl).length, color: 'text-white', bg: 'bg-[#020617]' }
             ].map((card, i) => (
                <div key={i} className={`${card.bg} p-8 rounded-[2.5rem] border border-slate-200 shadow-lg relative overflow-hidden group`}>
                   <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-6">{card.label}</span>
                   <div className={`text-6xl font-black ${card.color} tabular-nums tracking-tighter leading-none`}>{card.val}</div>
                </div>
             ))}
          </div>
        )}

        {/* Other tabs remain modular... */}
        {(activeTab === 'teams' || activeTab === 'problem statements' || activeTab === 'configuration') && (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm text-center py-32 opacity-40 grayscale italic">
             <div className="text-4xl mb-6">🛠️</div>
             <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Administrative Module Synchronizing...</h3>
             <p className="text-[10px] text-slate-400 uppercase mt-4 font-bold">Access restricted to master node during temporal sync.</p>
             <button onClick={() => setActiveTab('submissions')} className="mt-8 px-6 py-2 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#020617]">Return to Vault</button>
          </div>
        )}

      </main>
    </div>
  );
}
