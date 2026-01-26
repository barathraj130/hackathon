'use client';
import AdminCertificateModal from '@/components/AdminCertificateModal';
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
  const [subFilter, setSubFilter] = useState('ALL');
  const [mounted, setMounted] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
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
       alert("Certificates generated.");
       fetchSubmissions();
     } catch (err) { alert("Synthesis timeout."); }
  }

  async function handleReallot(teamName, newId) {
    try {
      await axios.post(`${getApiUrl()}/admin/reallot-team`, { teamName, newProblemStatementId: newId }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      fetchTeams();
      fetchProblemStatements();
    } catch (err) { alert("Reallotment failed."); }
  }

  if (!mounted) return <div className="min-h-screen bg-[#f1f5f9]" />;

  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(sub => {
    if (subFilter === 'ALL') return true;
    if (subFilter === 'SUBMITTED') return sub.status === 'SUBMITTED' || sub.status === 'LOCKED';
    if (subFilter === 'PENDING') return !sub.pptUrl;
    return true;
  }) : [];

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] font-sans text-slate-800 uppercase tracking-tight overflow-hidden">
      <aside className="w-64 bg-[#020617] text-white flex flex-col h-screen sticky top-0 p-5 space-y-8 border-r border-white/5 shadow-2xl">
        <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-black text-sm border border-white/10">H</div><div><p className="font-black text-lg tracking-tighter leading-none text-white">HACK@JIT</p><p className="text-[8px] text-slate-500 font-bold tracking-[0.2em] mt-1">ADMIN PORTAL</p></div></div>
        <nav className="flex-1 space-y-1">
           {['OVERVIEW', 'SUBMISSIONS', 'PROBLEMS', 'TEAMS', 'CONFIGURATION'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-between group ${activeTab === tab.toLowerCase() ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
               {tab} <div className={`w-1 h-1 rounded-full ${activeTab === tab.toLowerCase() ? 'bg-emerald-500 scale-100' : 'scale-0'}`}></div>
             </button>
           ))}
        </nav>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center"><p className="text-[8px] text-slate-500 font-black mb-1 opacity-50">CLOCK</p><p className={`text-2xl font-mono font-black ${timer.timerPaused ? 'text-amber-400' : 'text-emerald-400'}`}>{timer.formattedTime}</p></div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto space-y-10">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <div><h1 className="text-2xl font-black text-[#0f172a] tracking-tighter">COMMAND CENTER</h1><p className="text-[9px] font-bold text-slate-400 tracking-[0.3em]">HACKATHON MANAGEMENT v5.4</p></div>
           <div className="flex gap-3"><button onClick={handleToggleHalt} className={`px-5 py-2.5 rounded-xl font-black text-[9px] tracking-widest transition-all ${timer.timerPaused ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{timer.timerPaused ? 'RESUME MISSION' : 'PAUSE MISSION'}</button><button onClick={handleToggleCertCollection} className={`px-5 py-2.5 rounded-xl font-black text-[9px] tracking-widest transition-all ${stats.config?.allowCertificateDetails ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>{stats.config?.allowCertificateDetails ? 'CLOSE CERTS' : 'OPEN CERTS'}</button></div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-4 gap-6 animate-fade-in">
             {[
               { label: 'TEAMS', val: stats.total_candidates || 0, color: 'text-navy' },
               { label: 'SYNTHESIS', val: stats.statuses?.in_progress || 0, color: 'text-teal-600' },
               { label: 'ARTIFACTS', val: stats.statuses?.submitted || 0, color: 'text-indigo-600' },
               { label: 'CERTS READY', val: stats.certificates?.collected || 0, color: 'text-rose-600' }
             ].map((c, i) => (<div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">{c.label}</span><p className={`text-5xl font-black ${c.color} tracking-tighter tabular-nums`}>{c.val}</p></div>))}
          </div>
        )}

        {activeTab === 'submissions' && (
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="flex justify-between items-center p-6 border-b border-slate-50 bg-slate-50/50"><h2 className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Vault Registry</h2><div className="flex gap-1">{['ALL', 'PENDING', 'SUBMITTED'].map(f => (<button key={f} onClick={() => setSubFilter(f)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black tracking-widest ${subFilter === f ? 'bg-[#020617] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{f}</button>))}</div></div>
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100 text-[8px] font-black text-slate-400 uppercase"><tr><th className="px-5 py-4">TEAM / CHALLENGE</th><th className="px-5 py-4">STATUS</th><th className="px-5 py-4">LINKS</th><th className="px-5 py-4">AWARDS 🏅</th><th className="px-5 py-4 text-right">ACTION</th></tr></thead>
                 <tbody className="divide-y divide-slate-50">
                    {filteredSubmissions.map(s => (
                      <tr key={s.id} className="text-[11px] font-bold hover:bg-slate-50 transition-all">
                        <td className="px-5 py-3"><div className="flex items-center gap-3"><span className="px-2 py-0.5 bg-teal-500 text-white rounded font-black text-[9px] min-w-[32px] text-center shadow-sm">{s.allottedQuestion}</span><div><p className="font-black text-sm text-[#020617] tracking-tight">{s.team?.teamName}</p><p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{s.team?.collegeName}</p></div></div></td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-[8px] font-black border ${s.status === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{s.status}</span></td>
                        <td className="px-5 py-3"><div className="flex gap-2">{s.pptUrl && <a href={s.pptUrl} target="_blank" className="text-indigo-600 border border-indigo-100 px-2 py-1 rounded bg-indigo-50">PPT ↓</a>}{s.prototypeUrl && <a href={s.prototypeUrl} target="_blank" className="text-teal-600 border border-teal-100 px-2 py-1 rounded bg-teal-50">DEMO ↗</a>}</div></td>
                        <td className="px-5 py-3">
                           <div className="flex gap-2 items-center">
                              {s.certificates?.map((c, idx) => (<div key={idx} className="bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1 group relative"><span className="text-[7px] text-slate-400">{c.role[0]}:</span>{c.certificateUrl ? <a href={c.certificateUrl} target="_blank" className="text-indigo-600 text-[8px] hover:underline">CERT ↓</a> : <span className="text-slate-300 text-[8px]">VOID</span>}</div>))}
                              <button onClick={() => { setSelectedTeam(s); setShowCertModal(true); }} className="text-[7px] font-black text-indigo-500 uppercase border border-indigo-100 px-2 rounded hover:bg-indigo-600 hover:text-white transition-all">MANUAL EDIT ✍️</button>
                              {s.certificates?.length > 0 && <button onClick={() => handleGenerateCerts(s.teamId)} className="text-[7px] font-black text-rose-500 uppercase border border-rose-100 px-2 rounded hover:bg-rose-500 hover:text-white transition-all">GENERATE ALL 🎓</button>}
                           </div>
                        </td>
                        <td className="px-5 py-3 text-right"><button onClick={() => { localStorage.setItem('token', localStorage.getItem('token')); /* placeholder */ }} className="p-1.5 bg-slate-100 rounded text-slate-400 hover:bg-[#020617] hover:text-white transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /></svg></button></td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}

        {activeTab === 'teams' && (
           <div className="grid grid-cols-12 gap-8 animate-fade-in">
              <div className="col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-6">
                 <h2 className="text-[10px] font-black text-[#020617] uppercase tracking-widest">Enroll Entity</h2>
                 <form onSubmit={e => { e.preventDefault(); /* handleCreateTeam in parent should be here */ }} className="space-y-3">
                    <input className="input-sm" placeholder="Identifier (Name)" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} />
                    <input className="input-sm" placeholder="Auth Key (College)" value={newTeam.collegeName} onChange={e => setNewTeam({...newTeam, collegeName: e.target.value})} />
                    <select className="input-sm font-black text-[9px]" value={newTeam.problemStatementId} onChange={e => setNewTeam({...newTeam, problemStatementId: e.target.value})}><option value="">-- No Mission --</option>{problemStatements.map(ps => <option key={ps.id} value={ps.id} disabled={!!ps.allottedTo}>{ps.questionNo}: {ps.title}</option>)}</select>
                    <button className="w-full py-3 bg-[#020617] text-white font-black text-[9px] tracking-widest rounded-xl hover:bg-teal-500 transition-all uppercase shadow-lg">Instantiate</button>
                 </form>
              </div>
              <div className="col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                 <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center"><h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment Registry</h2><span className="text-[8px] font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{teams.length} ACTIVE</span></div>
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase border-b border-slate-100"><tr><th className="px-6 py-4">IDENTIFIER / RE-ALLOT</th><th className="px-6 py-4">AUTH KEY</th><th className="px-6 py-4 text-right">ACTION</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                       {teams.map(t => (
                         <tr key={t.id} className="text-[11px] font-black text-[#020617] hover:bg-slate-50 transition-all">
                           <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                 <select 
                                    className="bg-slate-100 text-slate-500 rounded px-2 py-0.5 text-[9px] font-black outline-none border-none cursor-pointer hover:bg-slate-200 transition-all"
                                    value={problemStatements.find(ps => ps.allottedTo === t.teamName)?.id || ""}
                                    onChange={(e) => handleReallot(t.teamName, e.target.value)}
                                 >
                                    <option value="">NONE</option>
                                    {problemStatements.map(ps => <option key={ps.id} value={ps.id} disabled={ps.allottedTo && ps.allottedTo !== t.teamName}>{ps.questionNo}</option>)}
                                 </select>
                                 <span className="uppercase">{t.teamName}</span>
                              </div>
                           </td>
                           <td className="px-6 py-3 text-slate-400 uppercase">{t.collegeName}</td>
                           <td className="px-6 py-3 text-right"><button className="text-rose-500 text-[8px] font-black border border-rose-100 px-3 py-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition-all uppercase">Purge</button></td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'configuration' && (
           <div className="grid grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                 <h2 className="text-[10px] font-black tracking-widest text-slate-400 uppercase">System Parameters</h2>
                 <div className="space-y-4"><label className="text-[9px] font-black text-[#020617] tracking-widest">MISSION TIMER (MIN)</label><input type="number" className="w-full text-4xl font-black p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 outline-none focus:border-teal-500" value={stats.config?.durationMinutes || 1440} onChange={async (e) => { const val = parseInt(e.target.value); await axios.post(`${getApiUrl()}/admin/test-config`, { durationMinutes: val }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); fetchStats(); }} /></div>
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"><div className="flex items-center gap-3"><span className="text-lg">🎓</span><p className="text-[9px] font-black text-indigo-700 tracking-widest uppercase">Certification</p></div><p className="text-[10px] font-medium text-slate-500 italic">Configure post-event award data phase.</p><button onClick={handleToggleCertCollection} className={`w-full py-4 rounded-xl font-black text-[10px] tracking-widest transition-all uppercase shadow-md ${stats.config?.allowCertificateDetails ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border-2 border-slate-200'}`}>{stats.config?.allowCertificateDetails ? 'Terminate Phase' : 'Initialize Phase'}</button></div>
              </div>
              <div className="bg-[#020617] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col justify-between group overflow-hidden relative"><div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div><div className="space-y-4 relative z-10"><h3 className="text-teal-400 font-black text-[10px] tracking-widest uppercase flex items-center gap-2"><span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span> Pulse Force Recovery</h3><p className="text-xs font-medium text-slate-400 normal-case opacity-60">Master registry reconstruction.</p></div><a href={`${getApiUrl().replace('/v1', '')}/setup-db`} target="_blank" className="w-full py-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black tracking-widest uppercase rounded-2xl hover:bg-teal-500 hover:text-white transition-all text-center relative z-10 shadow-lg">Restructure Mission Registry</a></div>
           </div>
        )}
      </main>

      {showCertModal && (
        <AdminCertificateModal 
          isOpen={showCertModal} 
          onClose={() => setShowCertModal(false)} 
          teamId={selectedTeam?.teamId} 
          teamName={selectedTeam?.team?.teamName} 
          apiUrl={getApiUrl()} 
          onComplete={fetchSubmissions} 
        />
      )}

      <style jsx global>{`
        .input-sm { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.75rem 1rem; font-weight: 800; font-size: 0.75rem; outline: none; transition: all 0.2s ease; text-transform: uppercase; }
        .input-sm:focus { border-color: #0d9488; background: white; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #e2e8e0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
