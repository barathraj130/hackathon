'use client';
import AdminCertificateModal from '@/components/AdminCertificateModal';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});
  const [teams, setTeams] = useState([]);
  const [timer, setTimer] = useState({ timeLeft: 0, formattedTime: '24:00:00', timerPaused: true });
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
     } catch (err) { alert("Error creating documents."); }
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

      {/* SIDEBAR */}
      <aside className="w-64 bg-white/70 backdrop-blur-xl flex flex-col h-screen sticky top-0 p-6 space-y-8 border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[var(--secondary-blue)] to-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-200">C</div>
          <div><p className="font-extrabold text-lg text-slate-800 leading-none tracking-tight">COMMAND</p><p className="text-[9px] text-[var(--primary-green)] font-black uppercase tracking-[0.2em] mt-1">CENTER</p></div>
        </div>
        <nav className="flex-1 space-y-2">
           {['STATS', 'WORK', 'TASKS', 'GROUPS', 'SETUP'].map(tab => {
             const tabKey = tab === 'STATS' ? 'overview' : tab === 'WORK' ? 'submissions' : tab === 'TASKS' ? 'problems' : tab === 'GROUPS' ? 'teams' : 'configuration';
             const isActive = activeTab === tabKey;
             return (
               <button key={tab} onClick={() => setActiveTab(tabKey)} 
                 className={`w-full text-left px-5 py-3.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-between group
                 ${isActive ? 'bg-gradient-to-r from-blue-50 to-white text-[var(--secondary-blue)] shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-white/50 hover:text-slate-700'}`}>
                 {tab}
                 {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-blue)] shadow-sm"></div>}
               </button>
             )
           })}
        </nav>
        <div className="p-5 bg-white/50 rounded-2xl border border-white/60 text-center shadow-inner">
            <p className="text-[9px] text-slate-400 font-black mb-2 tracking-[0.2em] uppercase">MISSION TIMER</p>
            <p className={`text-2xl font-black tabular-nums tracking-tight ${timer.timerPaused ? 'text-[var(--accent-orange)]' : 'text-[var(--primary-green)]'}`}>
              {timer.formattedTime || '24:00:00'}
            </p>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto space-y-10 relative z-10 scroll-smooth">
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
           <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Main Control</h1><p className="text-xs font-semibold text-slate-400">System Tools</p></div>
           <div className="flex gap-4">
             <button onClick={handleToggleHalt} className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all ${timer.timerPaused ? 'btn-green' : 'bg-rose-500 text-white'}`}>{timer.timerPaused ? 'Start Timer' : 'Stop Timer'}</button>
             <button onClick={handleResetTimer} className="btn-orange px-6 py-2.5 rounded-xl text-xs font-bold">Reset</button>
             <button onClick={handleToggleCertCollection} className={`px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${stats.config?.allowCertificateDetails ? 'btn-blue' : 'bg-slate-100 text-slate-500'}`}>{stats.config?.allowCertificateDetails ? 'Stop Registration' : 'Allow Registration'}</button>
           </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-5 gap-6">
             {[
               { label: 'Groups', val: stats.total_candidates || 0, color: 'text-slate-800' },
               { label: 'Pending Task', val: stats.statuses?.pending_selection || 0, color: 'text-rose-500' },
               { label: 'In Progress', val: stats.statuses?.in_progress || 0, color: 'text-[var(--primary-green)]' },
               { label: 'Completed', val: stats.statuses?.submitted || 0, color: 'text-[var(--secondary-blue)]' },
               { label: 'Names Added', val: stats.certificates?.collected || 0, color: 'text-[var(--accent-orange)]' }
             ].map((c, i) => (<div key={i} className="card-premium"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">{c.label}</span><p className={`text-4xl font-bold ${c.color} tracking-tight`}>{c.val}</p></div>))}
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
                                  // Construct full URL assuming backend serves static files from root
                                  const downloadUrl = `${getApiUrl().replace('/v1', '')}${filePath}`;
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
                              <button onClick={() => handleUnlockTeam(s.teamId || s.team?.id)} className="text-[10px] font-bold text-orange-500 uppercase px-2 py-1 rounded bg-orange-50 border border-orange-100 hover:bg-orange-500 hover:text-white transition-all">Unlock</button>
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
                 <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Add Group</h2>
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
                           {problemStatements.map(ps => <option key={ps.id} value={ps.id} disabled={!!ps.allottedTo || ps.id === newTeam.problemStatementIds[1]}>{ps.questionNo}</option>)}
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
                           {problemStatements.map(ps => <option key={ps.id} value={ps.id} disabled={!!ps.allottedTo || ps.id === newTeam.problemStatementIds[0]}>{ps.questionNo}</option>)}
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
                                            {ps.questionNo}
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
                                            {ps.questionNo}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                 </div>
                                 <div className="flex flex-col gap-0.5">
                                   <div className="flex items-center gap-2">
                                     <span className="font-bold text-slate-800">{t.teamName}</span>
                                     {t.selectedQuestion && (
                                       <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest border border-blue-200">Picked {t.selectedQuestion}</span>
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
