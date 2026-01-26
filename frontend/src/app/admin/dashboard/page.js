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
  const [mounted, setMounted] = useState(false);
  const socketRef = useRef();

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';

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
      socketRef.current.on('timerUpdate', (data) => setTimer(data));
    });
    return () => socketRef.current?.disconnect();
  }, []);

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
    } catch (err) { console.error(err); }
  }

  async function fetchSubmissions() {
    try {
      const res = await axios.get(`${getApiUrl()}/admin/submissions`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSubmissions(res.data || []);
    } catch (err) { console.error(err); }
  }

  async function handleToggleHalt() {
    try { await axios.post(`${getApiUrl()}/admin/toggle-halt`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchStats(); } catch (err) { alert("Fail"); }
  }

  async function handleToggleCertCollection() {
    try { await axios.post(`${getApiUrl()}/admin/toggle-certificate-collection`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchStats(); } catch (err) { alert("Toggle fail"); }
  }

  async function handleGenerateCerts(teamId) {
     try {
       await axios.post(`${getApiUrl()}/admin/generate-certificates`, { teamId }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
       alert("Credential Synthesis Initiated ✓");
       fetchSubmissions();
     } catch (err) { alert("Synthesis cluster timeout."); }
  }

  async function handleCreateTeam(e) {
    e.preventDefault();
    try { await axios.post(`${getApiUrl()}/admin/create-team`, newTeam, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setNewTeam({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1, problemStatementId: '' }); fetchTeams(); } catch (err) { alert("Error"); }
  }

  async function handleDeleteTeam(id) {
    if(!confirm("Purge Entity?")) return;
    try { await axios.delete(`${getApiUrl()}/admin/teams/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchTeams(); fetchStats(); } catch(e) {}
  }

  async function handleCreateStatement(e) {
    e.preventDefault();
    try {
      await axios.post(`${getApiUrl()}/admin/problem-statements`, newStatement, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setNewStatement({ questionNo: '', subDivisions: '', title: '', description: '', allottedTo: '' });
      fetchProblemStatements();
    } catch (err) { alert("Deployment failed."); }
  }

  async function handleDeleteStatement(id) {
    if (!confirm("🚨 PURGE CHALLENGE?")) return;
    try {
      await axios.delete(`${getApiUrl()}/admin/problem-statements/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchProblemStatements();
    } catch (err) { alert("Purge failed."); }
  }

  if (!mounted) return <div className="min-h-screen bg-[#f1f5f9]" />;

  const navigation = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'submissions', label: 'SUBMISSIONS' },
    { id: 'problems', label: 'PROBLEMS' },
    { id: 'teams', label: 'TEAMS' },
    { id: 'configuration', label: 'CONFIGURATION' }
  ];

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-sans text-slate-800 uppercase tracking-tight overflow-hidden">
      <aside className="w-80 bg-[#020617] text-white flex flex-col h-screen sticky top-0 p-8 space-y-10 border-r border-white/5 shadow-2xl">
        <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl border border-white/10">H</div><div><p className="font-black text-2xl tracking-tighter">HACK@JIT</p><p className="text-[10px] text-slate-500 font-bold tracking-[0.3em]">AUTHORITY</p></div></div>
        <nav className="flex-1 space-y-2">
           {navigation.map(tab => (
             <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-6 py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all flex items-center justify-between group ${activeTab === tab.id ? 'bg-white/10 text-white shadow-xl border border-white/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
               {tab.label} <div className={`w-1.5 h-1.5 rounded-full ${activeTab === tab.id ? 'bg-emerald-500 scale-100 shadow-[0_0_10px_#10b981]' : 'scale-0 group-hover:scale-100 group-hover:bg-white/20'}`}></div>
             </button>
           ))}
        </nav>
        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center space-y-2">
            <p className="text-[10px] text-slate-500 font-black tracking-[0.4em]">TEMPORAL MONITOR</p>
            <p className={`text-4xl font-mono font-black tabular-nums transition-colors ${timer.timerPaused ? 'text-amber-400' : 'text-emerald-400 animate-pulse'}`}>{timer.formattedTime}</p>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto space-y-12">
        <header className="flex justify-between items-start">
           <div className="relative"><h1 className="text-8xl font-black text-[#020617] opacity-[0.03] absolute -top-8 -left-4 pointer-events-none select-none tracking-tighter">COMMAND</h1><h1 className="text-5xl font-black text-[#0f172a] tracking-tighter relative">COMMAND CENTER</h1><p className="text-[11px] font-bold text-slate-400 tracking-[0.5em] mt-2 italic shadow-sm">SYSTEM ARCHITECT ACCESS :: PROTOCOL 5.0</p></div>
           <div className="flex gap-4">
              <button onClick={handleToggleHalt} className={`px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-2xl active:scale-95 ${timer.timerPaused ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20' : 'bg-rose-500 text-white hover:bg-rose-400 shadow-rose-500/20'}`}>{timer.timerPaused ? 'RESUME MISSION' : 'PAUSE MISSION'}</button>
              <button onClick={handleToggleCertCollection} className={`px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all shadow-2xl active:scale-95 ${stats.config?.allowCertificateDetails ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>{stats.config?.allowCertificateDetails ? 'CLOSE CERTIFICATION 🎓' : 'OPEN CERTIFICATION 🎓'}</button>
           </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-4 gap-10">
             {[
               { label: 'Master Enrollment', val: stats.total_candidates || 0, icon: '👤', color: 'text-navy' },
               { label: 'Network Synthesis', val: stats.statuses?.in_progress || 0, icon: '⚙️', color: 'text-teal-600' },
               { label: 'Artifact Vault', val: stats.statuses?.submitted || 0, icon: '📁', color: 'text-indigo-600' },
               { label: 'Award Readiness', val: stats.certificates?.collected || 0, icon: '🏅', color: 'text-rose-600' }
             ].map((c, i) => (
                <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                   <div className="flex items-center justify-between mb-8"><span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{c.label}</span><span className="text-2xl">{c.icon}</span></div>
                   <p className={`text-7xl font-black ${c.color} tracking-tighter tabular-nums`}>{c.val}</p>
                </div>
             ))}
          </div>
        )}

        {activeTab === 'submissions' && (
           <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden animate-fade-in">
              <table className="w-full text-left">
                 <thead><tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-10 py-6">ENTITY ANALYTICS</th><th className="px-10 py-6">NETWORK STATUS</th><th className="px-10 py-6">INTELLIGENCE LINKS</th><th className="px-10 py-6">CERTIFICATION STATUS</th><th className="px-10 py-6 text-right">VAULT ACTIONS</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">
                    {submissions.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-all group">
                        <td className="px-10 py-8"><p className="font-black text-lg text-[#020617] tracking-tight">{s.team?.teamName}</p><p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{s.team?.collegeName || 'JIT NODE'}</p></td>
                        <td className="px-10 py-8"><div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${s.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}><span className={`w-2 h-2 rounded-full ${s.status === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`}></span>{s.status}</div></td>
                        <td className="px-10 py-8">{s.prototypeUrl ? <a href={s.prototypeUrl} target="_blank" className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-[10px] font-black border border-teal-100 hover:bg-teal-100 transition-all uppercase tracking-widest block text-center">Open Prototype ↗</a> : <span className="text-[10px] font-bold text-slate-300 italic opacity-50 uppercase tracking-widest">Awaiting Linkage</span>}</td>
                        <td className="px-10 py-8">
                           <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.certificates?.length || 0} / 2 Participant Data</p>
                              <div className="flex flex-wrap gap-2">
                                {s.certificates?.map((c, idx) => (
                                   <div key={idx} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                      <span className="text-[9px] font-black text-slate-400 uppercase">{c.role[0]}:</span>
                                      {c.certificateUrl ? <a href={c.certificateUrl} target="_blank" className="text-indigo-600 font-black text-[9px] hover:underline">DOWN ↓</a> : <span className="text-slate-300 font-bold text-[9px] italic">VOID</span>}
                                   </div>
                                ))}
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8 text-right flex flex-col gap-3 items-end">
                           <a href={s.pptUrl} target="_blank" className="px-6 py-3 bg-[#020617] text-white rounded-xl text-[10px] font-black tracking-widest hover:bg-teal-500 transition-all w-48 text-center shadow-lg uppercase">Artifact Download ↓</a>
                           {s.certificates?.length > 0 && (
                              <button onClick={() => handleGenerateCerts(s.teamId)} className="px-6 py-3 border-2 border-indigo-600 text-indigo-700 rounded-xl text-[10px] font-black tracking-widest hover:bg-indigo-600 hover:text-white transition-all w-48 uppercase">Generate awards 🎓</button>
                           )}
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              {submissions.length === 0 && <div className="p-40 text-center opacity-20"><div className="text-7xl mb-6">📂</div><p className="text-xl font-black uppercase tracking-[0.5em]">Institutional vault empty</p></div>}
           </div>
        )}

        {activeTab === 'problems' && (
           <div className="grid grid-cols-12 gap-10 animate-fade-in">
              <div className="col-span-4 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl h-fit sticky top-12 space-y-8">
                 <div className="space-y-2"><h2 className="text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase">Initialize Challenge</h2><p className="text-xs font-medium text-slate-500 normal-case italic">Deploy a new problem statement to the master registry.</p></div>
                 <form onSubmit={handleCreateStatement} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <input className="input-field-sleek" placeholder="Q. ID (Ex: 101)" value={newStatement.questionNo} onChange={e => setNewStatement({...newStatement, questionNo: e.target.value})} required />
                       <input className="input-field-sleek" placeholder="Div (Ex: IV.A)" value={newStatement.subDivisions} onChange={e => setNewStatement({...newStatement, subDivisions: e.target.value})} />
                    </div>
                    <input className="input-field-sleek" placeholder="Operational Title" value={newStatement.title} onChange={e => setNewStatement({...newStatement, title: e.target.value})} required />
                    <textarea className="input-field-sleek min-h-[160px] py-4" placeholder="Technical Abstract & Requirements" value={newStatement.description} onChange={e => setNewStatement({...newStatement, description: e.target.value})} required />
                    <button className="w-full py-5 bg-[#020617] text-white font-black text-[11px] tracking-widest rounded-2xl hover:bg-teal-500 transition-all uppercase">Deploy Statement</button>
                 </form>
              </div>
              <div className="col-span-8 bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden h-fit">
                 <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center"><h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Master Registry</h2><span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">{problemStatements.length} ACTIVE MODULES</span></div>
                 <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto">
                    {problemStatements.map(ps => (
                      <div key={ps.id} className="p-8 hover:bg-slate-50 transition-all group flex justify-between items-center">
                         <div className="flex items-center gap-8 flex-1">
                            <div className="w-16 h-16 bg-[#020617] text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-xl">Q.{ps.questionNo}</div>
                            <div className="space-y-1 truncate max-w-xl">
                               <h4 className="text-lg font-black text-navy uppercase tracking-tight truncate">{ps.title}</h4>
                               <div className="flex gap-4 items-center">
                                  <span className="text-[10px] font-black text-slate-400 uppercase">{ps.subDivisions || 'Core'} Module</span>
                                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                  <span className={`text-[10px] font-black uppercase ${ps.allottedTo ? 'text-teal-600' : 'text-amber-500'}`}>{ps.allottedTo ? `Allotted: ${ps.allottedTo}` : 'Status: Unallotted'}</span>
                               </div>
                            </div>
                         </div>
                         <button onClick={() => handleDeleteStatement(ps.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    ))}
                    {problemStatements.length === 0 && <div className="p-40 text-center opacity-10 font-black text-2xl uppercase tracking-[0.5em]">Registry Empty</div>}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'teams' && (
           <div className="grid grid-cols-12 gap-10 animate-fade-in">
              <div className="col-span-4 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-xl h-fit sticky top-12 space-y-10">
                 <div className="space-y-2"><h2 className="text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase">Enrollment Node</h2><p className="text-xs font-medium text-slate-500 normal-case italic">Authenticate a new mission entity for institutional access.</p></div>
                 <form onSubmit={handleCreateTeam} className="space-y-6">
                    <input className="input-field-sleek" placeholder="Entity Identifier (Team Name)" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} />
                    <input className="input-field-sleek" placeholder="Auth Key (Institutional Password)" value={newTeam.collegeName} onChange={e => setNewTeam({...newTeam, collegeName: e.target.value})} />
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 pl-2 tracking-widest">Challenge Assignment</label>
                       <select className="input-field-sleek font-black cursor-pointer" value={newTeam.problemStatementId} onChange={e => setNewTeam({...newTeam, problemStatementId: e.target.value})}>
                          <option value="">-- No Assignment --</option>
                          {problemStatements.map(ps => <option key={ps.id} value={ps.id} disabled={!!ps.allottedTo}>{ps.questionNo}: {ps.title}</option>)}
                       </select>
                    </div>
                    <button className="w-full py-5 bg-[#020617] text-white font-black text-[11px] tracking-widest rounded-2xl hover:bg-teal-500 transition-all shadow-2xl active:scale-95 uppercase">Instantiate Authorization</button>
                 </form>
              </div>
              <div className="col-span-8 bg-white rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden h-fit">
                 <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center"><h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Enrollment Registry</h2><span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-4 py-1.5 rounded-full">{teams.length} NODE(S) DETECTED</span></div>
                 <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100"><tr><th className="px-10 py-6">IDENTIFIER</th><th className="px-10 py-6">AUTH KEY</th><th className="px-10 py-6 text-right">SYSTEM ACTION</th></tr></thead><tbody className="divide-y divide-slate-50">{teams.map(t => (<tr key={t.id} className="text-sm font-black text-[#020617] hover:bg-slate-50/50 transition-all"><td className="px-10 py-8 uppercase tracking-tight">{t.teamName}</td><td className="px-10 py-8 text-[11px] text-slate-400 font-bold tracking-widest uppercase">{t.collegeName}</td><td className="px-10 py-8 text-right"><button onClick={() => handleDeleteTeam(t.id)} className="text-rose-500 text-[10px] font-black tracking-widest hover:bg-rose-50 px-5 py-2.5 rounded-xl border border-rose-100 transition-all uppercase">Purge Node</button></td></tr>))}</tbody></table></div>
              </div>
           </div>
        )}

        {activeTab === 'configuration' && (
           <div className="grid grid-cols-2 gap-12 animate-fade-in">
              <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl space-y-12">
                 <div className="space-y-2"><h2 className="text-[11px] font-black tracking-[0.4em] text-slate-400 uppercase">System Parameters</h2><p className="text-xs font-medium text-slate-500 italic opacity-80 normal-case">Configure the core temporal and lifecycle infrastructure.</p></div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 tracking-widest pl-2">ACTIVE MISSION TIMER (MIN)</label>
                    <div className="relative group"><input type="number" className="w-full text-6xl font-black p-8 bg-slate-50 rounded-[2.5rem] border-4 border-slate-100 outline-none focus:border-teal-500 transition-all tabular-nums text-[#020617]" value={stats.config?.durationMinutes || 1440} onChange={async (e) => { const val = parseInt(e.target.value); await axios.post(`${getApiUrl()}/admin/test-config`, { durationMinutes: val }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchStats(); }} /><div className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl tracking-[0.5em] group-hover:text-teal-500/30 transition-all select-none">MINS</div></div>
                 </div>
                 <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-all"></div>
                    <div className="flex items-center gap-4 mb-2"><div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-xl">🎓</div><p className="text-[11px] font-black text-indigo-700 tracking-widest uppercase">Certification Lifecycle</p></div>
                    <p className="text-xs font-medium text-slate-500 normal-case leading-relaxed italic pr-12">Toggle the credential gathering phase for team members. Once active, entities can synchronize legal participant information for automated recognition synthesis.</p>
                    <button onClick={handleToggleCertCollection} className={`w-full py-5 rounded-2xl font-black text-[11px] tracking-widest transition-all shadow-xl active:scale-95 relative z-10 uppercase ${stats.config?.allowCertificateDetails ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-200' : 'bg-white text-slate-400 border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 shadow-slate-100 hover:shadow-indigo-50'}`}>{stats.config?.allowCertificateDetails ? 'Terminate Certification Phase' : 'Initialize Certification Phase'}</button>
                    <div className="flex items-center justify-between px-4 pt-2"><span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Status:</span><span className={`text-[11px] font-black uppercase ${stats.config?.allowCertificateDetails ? 'text-indigo-600 animate-pulse' : 'text-slate-300'}`}>{stats.config?.allowCertificateDetails ? '● Active Data Acquisition' : 'Inactive'}</span></div>
                 </div>
              </div>
              <div className="bg-[#020617] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl flex flex-col justify-between group overflow-hidden relative">
                 <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] -mr-48 -mb-48 group-hover:bg-teal-500/10 transition-all"></div>
                 <div className="space-y-6 relative z-10"><h3 className="text-teal-400 font-black text-[12px] tracking-[0.5em] uppercase flex items-center gap-3"><span className="w-2 h-2 bg-teal-500 rounded-full animate-ping"></span> Pulse Recovery Node</h3><p className="text-sm font-medium text-slate-400 normal-case leading-relaxed italic opacity-80 backdrop-blur-sm bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner">In the event of total mission state corruption or unrecoverable synchronization failure across the node cluster, instantiate the pulse-force recovery link. This operation will restructure the entire institutional registry from the master blueprint.</p></div>
                 <a href={`${getApiUrl().replace('/v1', '')}/setup-db`} target="_blank" className="w-full py-6 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[11px] font-black tracking-widest uppercase rounded-[2rem] hover:bg-teal-500 hover:text-white transition-all text-center group-hover:scale-[1.02] shadow-2xl relative z-10">Instantiate Master Force Recovery</a>
              </div>
           </div>
        )}
      </main>

      <style jsx global>{`
        .input-field-sleek {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          padding: 1rem 1.5rem;
          font-weight: 800;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }
        .input-field-sleek:focus {
          border-color: #0d9488;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
