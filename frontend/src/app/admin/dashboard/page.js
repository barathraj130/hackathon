'use client';
import AdminCertificateModal from '@/components/AdminCertificateModal';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [teams, setTeams] = useState([]);
  const [timer, setTimer] = useState({ timeLeft: 0, formattedTime: '24:00:00', timerPaused: true, registrationOpen: false });
  const [newTeam, setNewTeam] = useState({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1, problemStatementIds: ['', ''] });
  const [problemStatements, setProblemStatements] = useState([]);
  const [newStatement, setNewStatement] = useState({ questionNo: '', subDivisions: '', title: '', description: '', allottedTo: '' });
  const [submissions, setSubmissions] = useState([]);
  const [subFilter, setSubFilter] = useState('ALL');
  const [mounted, setMounted] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const socketRef = useRef();

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';

  useEffect(() => {
    const checkSession = () => {
      const storedRole = localStorage.getItem('role');
      const token = localStorage.getItem('token');
      if (!token || storedRole !== 'ADMIN') {
        window.location.href = '/login?error=SessionExpired';
        return false;
      }
      return true;
    };

    if (!checkSession()) return;
    fetchStats();
    fetchTeams();
    fetchProblemStatements();
    fetchSubmissions();
    
    let socketInstance = null;
    const initSocket = async () => {
      try {
        const { io } = await import('socket.io-client');
        const apiUrl = getApiUrl();
        const socketUrl = apiUrl.replace('/v1', '') || window.location.origin;
        socketInstance = io(socketUrl, { transports: ['websocket'], reconnection: true });
        socketRef.current = socketInstance;
        socketInstance.on('timerUpdate', (data) => setTimer(prev => ({ ...prev, ...data })));
      } catch (err) {
        console.error("Socket failed:", err);
      }
    };
    initSocket();
    
    return () => {
      if (socketInstance) socketInstance.disconnect();
    };
  }, []);

  const handleAuthError = (err) => {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
        window.location.href = '/login';
    } else {
        alert("Error: " + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => { setMounted(true); }, []);

  async function fetchStats() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/dashboard`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setStats(res.data);
    } catch (err) { console.error(err); }
  }

  async function fetchTeams() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/candidates`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setTeams(res.data.candidates || []);
    } catch (err) { console.error(err); }
  }

  async function fetchProblemStatements() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/problem-statements`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setProblemStatements(res.data || []);
      console.log('[FetchPS] Problem statements:', res.data?.map(ps => ({ id: ps.id, no: ps.questionNo, allottedTo: ps.allottedTo })));
    } catch (err) { console.error(err); }
  }

  async function fetchSubmissions() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/submissions`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSubmissions(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function handleToggleHalt() {
    try { 
      const res = await axios.post(`${getApiUrl()}/admin/toggle-halt`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      fetchStats(); 
      if (res.data.success) {
        setTimer(prev => ({ ...prev, timerPaused: res.data.isPaused }));
      }
    } catch (err) { handleAuthError(err); }
  }

  async function handleToggleCertCollection() {
    try { await axios.post(`${getApiUrl()}/admin/toggle-certificate-collection`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchStats(); } catch (err) { handleAuthError(err); }
  }

  async function handleResetTimer() {
    if (!confirm("Reset timer to 24 hours?")) return;
    try {
      const res = await axios.post(`${getApiUrl()}/admin/reset-timer`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data.success) {
        alert("Reset successful.");
        fetchStats();
      }
    } catch (err) { handleAuthError(err); }
  }

  async function handleGenerateCerts(teamId) {
     try {
       const res = await axios.post(`${getApiUrl()}/admin/generate-certificates`, { teamId }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
       if (res.data.success) alert("Documents created.");
       fetchSubmissions();
     } catch (err) { 
        console.error(err);
        alert(err.response?.data?.error || "Error creating documents."); 
     }
  }

  async function handleReallot(teamName, ids) {
    try {
      await axios.post(`${getApiUrl()}/admin/reallot-team`, { teamName, newProblemStatementIds: ids }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchTeams();
      fetchProblemStatements();
    } catch (err) { alert("Failed to reassign."); }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    try { 
      await axios.post(`${getApiUrl()}/admin/create-team`, {
        ...newTeam,
        problemStatementIds: newTeam.problemStatementIds.filter(id => id !== '')
      }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); 
      setNewTeam({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1, problemStatementIds: ['', ''] }); 
      fetchTeams(); 
      fetchProblemStatements(); 
    } catch (err) { alert("Error adding group."); }
  }

  async function handleDeleteTeam(id) {
    if(!confirm("Remove this group?")) return;
    try { 
      const res = await axios.delete(`${getApiUrl()}/admin/teams/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      console.log('[DeleteTeam] Response:', res.data);
      
      // Sequential refresh to ensure DB changes propagate
      await fetchTeams(); 
      
      // Small delay to ensure backend has completed the question reset
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await fetchProblemStatements(); // Refresh questions to show freed-up assignments
      console.log('[DeleteTeam] Problem statements refreshed');
      
      await fetchStats(); 
      
      alert(res.data.message || 'Team deleted successfully');
    } catch(e) {
      console.error('[DeleteTeam] Error:', e);
      alert("Failed to delete team: " + (e.response?.data?.error || e.message));
    }
  }

  async function handleResetSelection(teamId) {
    if (!confirm("Reset selection for this team? They will be allowed to choose their task again.")) return;
    try {
      const res = await axios.post(`${getApiUrl()}/admin/reset-team-selection/${teamId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(res.data.message);
      fetchTeams();
    } catch (err) {
      alert("Reset failed: " + (err.response?.data?.error || err.message));
    }
  }

  async function handleForceRegenerate(teamId) {
    if(!confirm("Recreate file for this group?")) return;
    try {
      await axios.post(`${getApiUrl()}/admin/force-regenerate`, { teamId }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      alert("Success.");
      fetchSubmissions();
    } catch (err) { alert("Failed to recreate file."); }
  }
  
  async function handleUnlockTeam(id) {
    if(!confirm("Unlock this group to allow edits?")) return;
    try {
      await axios.post(`${getApiUrl()}/admin/unlock-team`, { teamId: id }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchSubmissions();
      alert("Unlocked.");
      fetchStats();
    } catch (err) { handleAuthError(err); }
  }

  async function handleCreateStatement(e) {
    e.preventDefault();
    try {
      await axios.post(`${getApiUrl()}/admin/problem-statements`, newStatement, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setNewStatement({ questionNo: '', subDivisions: '', title: '', description: '', allottedTo: '' });
      fetchProblemStatements();
    } catch (err) { alert("Failed to add task."); }
  }

  async function handleDeleteStatement(id) {
    if (!confirm("Delete this task?")) return;
    try {
      await axios.delete(`${getApiUrl()}/admin/problem-statements/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchProblemStatements();
    } catch (err) { alert("Failed to delete."); }
  }

  async function handleResetAllQuestions() {
    if (!confirm("EMERGENCY: Reset ALL question allotments? This will make all questions available again. Only use if current allotments appear incorrect.")) return;
    try {
      const res = await axios.post(`${getApiUrl()}/admin/reset-all-questions`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (res.data.success) {
        alert(res.data.message);
        fetchProblemStatements();
        fetchTeams();
      }
    } catch (err) { alert("Reset failed."); }
  }

  if (!mounted) return <div className="min-h-screen bg-innovation relative overflow-hidden" />;

  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(sub => {
    if (subFilter === 'ALL') return true;
    if (subFilter === 'SUBMITTED') return sub.status === 'SUBMITTED' || sub.status === 'LOCKED';
    if (subFilter === 'PENDING') return !sub.pptUrl;
    return true;
  }) : [];

  return (
    <div className="flex min-h-screen bg-innovation relative overflow-hidden font-sans tracking-tight">
      {/* Background Decor */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none fixed"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/5 blur-[150px] rounded-full animate-pulse fixed pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-400/5 blur-[150px] rounded-full animate-pulse fixed pointer-events-none"></div>

      {/* SIDEBAR - 3D HIGH READABILITY PANEL (ROYAL INTELLIGENCE) */}
      <aside className="w-72 bg-gradient-to-b from-[#1e3a8a] to-[#172554] flex flex-col h-screen sticky top-0 p-6 space-y-8 border-r border-blue-400/20 shadow-[10px_0_30px_rgba(30,58,138,0.5)] z-20">
        
        {/* Brand Identity Card */}
        <div className="bg-[#1d4ed8] p-4 rounded-2xl border border-blue-400/30 shadow-[0_4px_10px_rgba(0,0,0,0.3)] flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-[0_4px_15px_rgba(251,191,36,0.4)]">C</div>
          <div>
            <p className="font-black text-xl text-white leading-none tracking-tight">COMMAND</p>
            <p className="text-[10px] text-amber-400 font-black uppercase tracking-[0.2em] mt-1">HACKATHON OS</p>
          </div>
        </div>

        {/* Navigation Layers */}
        <nav className="flex-1 space-y-3">
           {[
             { name: 'STATS', key: 'overview', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
             { name: 'WORK', key: 'submissions', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1m-6 10l3 3m0 0l3-3m-3 3V10" /></svg> },
             { name: 'TASKS', key: 'problems', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
             { name: 'GROUPS', key: 'teams', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
             { name: 'SETUP', key: 'configuration', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
           ].map(item => {
             const isActive = activeTab === item.key;
             return (
               <button 
                 key={item.name} 
                 onClick={() => setActiveTab(item.key)} 
                 className={`w-full px-6 py-4 rounded-2xl text-xs font-black tracking-widest uppercase transition-all duration-300 flex items-center gap-4 border-b-4
                 ${isActive 
                   ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-[0_8px_20px_rgba(34,211,238,0.3)] translate-x-2 border-blue-700' 
                   : 'bg-[#1e40af] text-blue-100 hover:bg-[#2563eb] hover:text-white hover:translate-x-1 border-[#172554] shadow-[0_4px_0_rgba(0,0,0,0.2)]'}`}
               >
                 <span className={`${isActive ? 'text-white' : 'text-cyan-300 group-hover:text-white'}`}>{item.icon}</span>
                 <span>{item.name}</span>
                 {isActive && <div className="ml-auto w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"></div>}
               </button>
             )
           })}
        </nav>

        {/* 3D Mission Clock Card */}
        <div className="p-6 bg-[#1e3a8a] rounded-[2rem] border-2 border-blue-400/30 shadow-[0_8px_25px_rgba(30,58,138,0.4)] text-center relative overflow-hidden group/timer">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-400"></div>
            <p className="text-[10px] text-blue-200 font-black mb-3 tracking-[0.2em] uppercase">SYSTEM MISSION CLOCK</p>
            <div className="bg-[#172554]/60 py-3 rounded-xl border border-blue-400/20">
              <p className={`text-3xl font-black tabular-nums tracking-tighter ${timer.timerPaused ? 'text-rose-400' : 'text-cyan-400'} drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]`}>
                {timer.formattedTime || '24:00:00'}
              </p>
            </div>
        </div>
        
        <button onClick={() => { localStorage.clear(); window.location.href='/'; }} className="w-full py-4 bg-white/10 text-xs font-black text-blue-100 hover:bg-white/20 hover:text-white rounded-2xl border-2 border-blue-400/20 transition-all uppercase tracking-widest">
          Terminate Session
        </button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto space-y-10 relative z-10 scroll-smooth">
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <div>
             <div className="flex items-center gap-3">
               <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Main Control</h1>
               <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                 DATABASE LIVE
               </span>
             </div>
             <p className="text-xs font-semibold text-slate-400">System Tools</p>
           </div>
           <div className="flex gap-4">
             <button onClick={handleToggleHalt} className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${timer.timerPaused ? 'btn-green' : 'bg-rose-500 text-white'}`}>{timer.timerPaused ? 'Start Timer' : 'Stop Timer'}</button>
             <button onClick={handleResetTimer} className="btn-orange px-6 py-2.5 rounded-xl text-xs font-bold">Reset</button>
             <button onClick={handleToggleCertCollection} className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${stats.config?.allowCertificateDetails ? 'btn-blue' : 'bg-slate-100 text-slate-500'}`}>{stats.config?.allowCertificateDetails ? 'Stop Registration' : 'Allow Registration'}</button>
           </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-5 gap-6">
             {[
               { label: 'Groups', val: stats.total_candidates || 0, color: 'text-slate-800', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
               { label: 'Pending Task', val: stats.statuses?.pending_selection || 0, color: 'text-rose-500', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
               { label: 'In Progress', val: stats.statuses?.in_progress || 0, color: 'text-emerald-500', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
               { label: 'Completed', val: stats.statuses?.submitted || 0, color: 'text-blue-500', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
               { label: 'Names Added', val: stats.certificates?.collected || 0, color: 'text-orange-500', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> }
             ].map((c, i) => (
               <div key={i} className="card-premium group hover:border-slate-300 transition-all">
                 <div className="flex justify-between items-start mb-4">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.label}</span>
                   <div className={`${c.color} bg-slate-50 p-2 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity`}>{c.icon}</div>
                 </div>
                 <p className={`text-4xl font-bold ${c.color} tracking-tight`}>{c.val}</p>
               </div>
             ))}
          </div>
        )}

        {/* WORK tab */}
        {activeTab === 'submissions' && (
           <div className="card-premium overflow-hidden !p-0">
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">All Work</h2><div className="flex gap-2">{['ALL', 'PENDING', 'SUBMITTED'].map(f => (<button key={f} onClick={() => setSubFilter(f)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold ${subFilter === f ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>{f}</button>))}</div></div>
              <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase"><tr><th className="px-6 py-4">Group / Task</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Files</th><th className="px-6 py-4">Names</th><th className="px-6 py-4 text-right">Edit</th></tr></thead>
                 <tbody className="divide-y divide-slate-100">
                    {filteredSubmissions.map(s => (
                       <tr key={s.id} className="text-sm hover:bg-slate-50 transition-all font-medium">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${s.isPicked ? 'bg-indigo-100 text-indigo-600 border border-indigo-200' : 'bg-blue-100 text-blue-600'}`}>
                                {s.allottedQuestion}
                              </span>
                              {s.isPicked && <span className="text-[8px] font-black uppercase text-indigo-400 tracking-tighter">Selected ✓</span>}
                              <div>
                                <p className="font-bold text-slate-800">{s.team?.teamName}</p>
                                <p className="text-[10px] text-slate-400 uppercase">{s.team?.collegeName}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'SUBMITTED' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>{s.status}</span></td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {s.pptUrl && <a href={s.pptUrl} target="_blank" className="text-blue-500 font-bold hover:underline text-[10px] uppercase">PPT Artifact</a>}
                            
                            {s.prototypeUrl && s.prototypeUrl.split('|').map((part, idx) => {
                                const trimmed = part.trim();
                                if (trimmed.startsWith('FILE:')) {
                                  const filePath = trimmed.replace('FILE:', '').trim();
                                  // If the path is already a full URL (Supabase), use it directly
                                  const downloadUrl = filePath.startsWith('http') 
                                    ? filePath 
                                    : `${getApiUrl().replace('/v1', '')}${filePath}`;
                                  return (
                                    <a key={`proto-file-${idx}`} href={downloadUrl} target="_blank" className="text-orange-500 font-bold hover:underline text-[10px] uppercase">
                                      Prototype File
                                    </a>
                                  );
                                } else {
                                  return (
                                    <a key={`proto-link-${idx}`} href={trimmed} target="_blank" className="text-orange-500 font-bold hover:underline text-[10px] uppercase">
                                      Prototype Link
                                    </a>
                                  );
                                }
                            })}

                            {s.certificates?.map(c => c.certificateUrl && (
                               <a key={c.id} href={c.certificateUrl} target="_blank" className="text-indigo-500 font-bold hover:underline text-[10px] uppercase">Cert: {c.name.split(' ')[0]}</a>
                            ))}
                            {!s.pptUrl && !s.prototypeUrl && !s.certificates?.some(c => c.certificateUrl) && <span className="text-[10px] text-slate-300 font-bold uppercase italic tracking-tighter">No files yet</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-2">
                              <button onClick={() => { setSelectedTeam(s); setShowCertModal(true); }} className="text-[10px] font-bold text-blue-500 uppercase px-2 py-1 rounded bg-blue-50 border border-blue-100 hover:bg-blue-500 hover:text-white transition-all">Edit Names</button>
                              <button onClick={() => handleUnlockTeam(s.teamId || s.team?.id)} className={`text-[10px] font-bold uppercase px-2 py-1 rounded border transition-all ${s.status === 'LOCKED' || s.status === 'SUBMITTED' ? 'text-orange-500 bg-orange-50 border-orange-100 hover:bg-orange-500 hover:text-white' : 'text-slate-400 bg-slate-50 border-slate-100 cursor-not-allowed'}`}>
                                {s.status === 'LOCKED' || s.status === 'SUBMITTED' ? 'Unlock' : 'Open'}
                              </button>
                              <button onClick={() => handleGenerateCerts(s.teamId || s.team?.id)} className="text-[10px] font-bold text-green-500 uppercase px-2 py-1 rounded bg-green-50 border border-green-100 hover:bg-green-500 hover:text-white transition-all">Finish all</button>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button onClick={() => handleForceRegenerate(s.teamId || s.team?.id)} className="text-slate-400 hover:text-slate-800 transition-colors">Re-run</button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              </div>
           </div>
        )}

        {activeTab === 'problems' && (
           <div className="grid grid-cols-12 gap-8">
              <div className="col-span-4 card-premium h-fit space-y-6">
                 <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add Task</h2>
                 <form onSubmit={handleCreateStatement} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4"><input className="input-premium py-2" placeholder="ID" value={newStatement.questionNo} onChange={e => setNewStatement({...newStatement, questionNo: e.target.value})} required /><input className="input-premium py-2" placeholder="Div" value={newStatement.subDivisions} onChange={e => setNewStatement({...newStatement, subDivisions: e.target.value})} /></div>
                    <input className="input-premium py-2" placeholder="Task Title" value={newStatement.title} onChange={e => setNewStatement({...newStatement, title: e.target.value})} required />
                    <textarea className="input-premium min-h-[100px]" placeholder="Details..." value={newStatement.description} onChange={e => setNewStatement({...newStatement, description: e.target.value})} required />
                    <button className="w-full btn-green !py-3 text-xs uppercase font-bold tracking-widest">Add Task</button>
                 </form>
              </div>
              <div className="col-span-8 card-premium !p-0 overflow-hidden h-fit">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50"><h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">All Tasks</h2></div>
                 <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                    {problemStatements.map(ps => (
                      <div key={ps.id} className="p-4 hover:bg-slate-50 transition-all flex justify-between items-center group">
                         <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-slate-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-sm"># {ps.questionNo}</div>
                            <div className="truncate"><h4 className="text-sm font-bold text-slate-800 truncate">{ps.title}</h4><p className="text-[10px] font-bold text-slate-400">{ps.allottedTo ? `Group: ${ps.allottedTo}` : 'Available'}</p></div>
                         </div>
                         <button onClick={() => handleDeleteStatement(ps.id)} className="text-rose-500 text-xs font-bold hover:underline opacity-0 group-hover:opacity-100 transition-all px-4">Delete</button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'teams' && (
           <div className="grid grid-cols-12 gap-8">
              <div className="col-span-4 card-premium h-fit space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add Group</h2>
                    <button 
                      onClick={handleResetAllQuestions}
                      className="text-[8px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md border border-rose-100 transition-colors"
                    >
                      Emergency Reset
                    </button>
                  </div>
                 <form onSubmit={handleCreateTeam} className="space-y-4">
                    <input className="input-premium py-2" placeholder="Group Name" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} />
                    <input className="input-premium py-2" placeholder="Auth Key" value={newTeam.collegeName} onChange={e => setNewTeam({...newTeam, collegeName: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Q1 Allotment</label>
                         <select className="input-premium py-2 text-[10px] font-bold" value={newTeam.problemStatementIds[0]} onChange={e => {
                           let ids = [...newTeam.problemStatementIds];
                           ids[0] = e.target.value;
                           setNewTeam({...newTeam, problemStatementIds: ids});
                         }}>
                           <option value="">None</option>
                           {problemStatements.map(ps => <option key={ps.id} value={ps.id} disabled={!!ps.allottedTo || ps.id === newTeam.problemStatementIds[1]}>{ps.questionNo} - {ps.subDivisions}</option>)}
                         </select>
                       </div>
                       <div className="space-y-1">
                         <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Q2 Allotment</label>
                         <select className="input-premium py-2 text-[10px] font-bold" value={newTeam.problemStatementIds[1]} onChange={e => {
                           let ids = [...newTeam.problemStatementIds];
                           ids[1] = e.target.value;
                           setNewTeam({...newTeam, problemStatementIds: ids});
                         }}>
                           <option value="">None</option>
                           {problemStatements.map(ps => <option key={ps.id} value={ps.id} disabled={!!ps.allottedTo || ps.id === newTeam.problemStatementIds[0]}>{ps.questionNo} - {ps.subDivisions}</option>)}
                         </select>
                       </div>
                    </div>
                    <button className="w-full btn-blue !py-3 text-xs uppercase font-bold tracking-widest">Add Group</button>
                 </form>
              </div>
              <div className="col-span-8 card-premium !p-0 overflow-hidden h-fit">
                 <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"><h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">All Groups</h2><span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">{teams.length} ACTIVE</span></div>
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100"><tr><th className="px-6 py-4">Group Name / Assign Task</th><th className="px-6 py-4">Auth Key</th><th className="px-6 py-4 text-right">Delete</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                       {teams.map(t => (
                         <tr key={t.id} className="text-sm hover:bg-slate-50 transition-all font-medium">
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-6">
                                 <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase w-4">Q1</span>
                                      <select 
                                        className="bg-slate-50 text-slate-500 rounded-lg px-2 py-1 text-[10px] font-bold border border-slate-200"
                                        value={t.allottedIds?.[0] || ""}
                                        onChange={(e) => {
                                          const otherId = t.allottedIds?.[1] || "";
                                          handleReallot(t.teamName, [e.target.value, otherId].filter(id => id !== ""));
                                        }}
                                      >
                                        <option value="">NONE</option>
                                        {problemStatements.map(ps => (
                                          <option key={ps.id} value={ps.id} disabled={ps.allottedTo && ps.allottedTo !== t.teamName}>
                                            {ps.questionNo} - {ps.subDivisions}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase w-4">Q2</span>
                                      <select 
                                        className="bg-slate-50 text-slate-500 rounded-lg px-2 py-1 text-[10px] font-bold border border-slate-200"
                                        value={t.allottedIds?.[1] || ""}
                                        onChange={(e) => {
                                          const firstId = t.allottedIds?.[0] || "";
                                          handleReallot(t.teamName, [firstId, e.target.value].filter(id => id !== ""));
                                        }}
                                      >
                                        <option value="">NONE</option>
                                        {problemStatements.map(ps => (
                                          <option key={ps.id} value={ps.id} disabled={ps.allottedTo && ps.allottedTo !== t.teamName}>
                                            {ps.questionNo} - {ps.subDivisions}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                   <div className="flex items-center gap-2">
                                     <span className="font-bold text-slate-800">{t.teamName}</span>
                                     {t.selectedQuestion && (
                                       <div className="flex items-center gap-1.5">
                                         <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest border border-blue-200">Picked {t.selectedQuestion}</span>
                                         <button 
                                           onClick={() => handleResetSelection(t.id)}
                                           className="text-[8px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 transition-colors"
                                           title="Reset team's question selection"
                                         >
                                           Reset Choice
                                         </button>
                                       </div>
                                     )}
                                   </div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-3 text-slate-400 uppercase text-xs">{t.collegeName}</td>
                           <td className="px-6 py-3 text-right"><button onClick={() => handleDeleteTeam(t.id)} className="text-rose-500 text-xs font-bold hover:underline">Remove</button></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'configuration' && (
           <div className="grid grid-cols-2 gap-8">
              <div className="card-premium space-y-8 text-center sm:text-left">
                 <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Setup</h2>
                 <div className="space-y-2"><label className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Timer (Minutes)</label><input type="number" className="w-full text-5xl font-bold p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 outline-none text-center sm:text-left" value={stats.config?.durationMinutes || 1440} onChange={async (e) => { const val = parseInt(e.target.value); await axios.post(`${getApiUrl()}/admin/test-config`, { durationMinutes: val }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchStats(); }} /></div>
                 <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4"><h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Allow Name Entry</h3><p className="text-xs font-medium text-slate-500">Enable this when you want groups to provide participant names for documents.</p><button onClick={handleToggleCertCollection} className={`w-full py-4 rounded-xl font-bold text-xs transition-all uppercase ${stats.config?.allowCertificateDetails ? 'btn-blue' : 'bg-white text-slate-400 border border-slate-200'}`}>{stats.config?.allowCertificateDetails ? 'Stop Now' : 'Start Now'}</button></div>
              </div>
              <div className="card-premium flex flex-col justify-between bg-slate-50">
                <div className="space-y-4">
                  <h3 className="text-rose-600 font-bold text-xs tracking-widest uppercase">Wipe Data</h3>
                  <p className="text-sm font-medium text-slate-500">Clear everything and start fresh. Warning: This cannot be undone.</p>
                </div>
                <a 
                  href={`${getApiUrl().replace('/v1', '')}/setup-db`} 
                  target="_blank" 
                  className="w-full py-5 bg-rose-500 text-white text-xs font-bold uppercase rounded-2xl hover:bg-rose-600 transition-all text-center shadow-lg shadow-rose-100"
                >
                  Reset System
                </a>
              </div>
           </div>
        )}
      </main>

      {showCertModal && (
        <AdminCertificateModal 
          isOpen={showCertModal} 
          onClose={() => setShowCertModal(false)} 
          teamId={selectedTeam?.teamId || selectedTeam?.team?.id} 
          teamName={selectedTeam?.team?.teamName} 
          certificates={selectedTeam?.certificates}
          apiUrl={getApiUrl()} 
          onComplete={fetchSubmissions} 
        />
      )}
    </div>
  );
}
