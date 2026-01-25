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
  const socketRef = useRef();

  useEffect(() => {
    fetchStats();
    fetchTeams();
    fetchProblemStatements();
    fetchSubmissions();
    
    // Dynamic import to ensure client-side only
    import('socket.io-client').then(({ default: io }) => {
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
      socketRef.current = io(socketUrl);
      
      socketRef.current.on('timerUpdate', (data) => {
        setTimer(data);
      });
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const fetchStats = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTeams = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/admin/candidates`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeams(res.data.candidates || []);
    } catch (err) { console.error(err); }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm("Are you sure you want to revoke this team's credentials? All synthesis data will be purged.")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      await axios.delete(`${apiUrl}/admin/teams/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchTeams();
      fetchStats();
    } catch (err) { alert("Failed to revoke credentials."); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      await axios.post(`${apiUrl}/admin/create-team`, {
        ...newTeam,
        problemStatementId: newTeam.problemStatementId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Portal credentials generated and enrolled successfully.");
      setNewTeam({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1, problemStatementId: '' });
      fetchTeams();
      fetchStats();
    } catch (err) { alert("Error: Logic conflict or duplicate identity detected."); }
  };

  const fetchProblemStatements = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/admin/problem-statements`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProblemStatements(res.data || []);
    } catch (err) { console.error(err); }
  };

  const handleCreateStatement = async (e) => {
    e.preventDefault();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      await axios.post(`${apiUrl}/admin/problem-statements`, newStatement, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNewStatement({ questionNo: '', subDivisions: '', title: '', description: '', allottedTo: '' });
      fetchProblemStatements();
    } catch (err) { 
      const msg = err.response?.data?.error || "Failed to deploy challenge.";
      alert(msg); 
    }
  };

  const fetchSubmissions = async () => {
    setSubLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/admin/submissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(res.data || []);
    } catch (err) { console.error(err); }
    finally { setSubLoading(false); }
  };

  const toggleRegenerate = async (teamId, currentValue) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    if (!confirm(`${currentValue ? 'Lock' : 'Unlock'} regeneration for this team?`)) return;
    try {
      await axios.post(`${apiUrl}/admin/toggle-regenerate`, 
        { teamId, canRegenerate: !currentValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      fetchSubmissions();
    } catch (err) { alert(err.response?.data?.error || 'Update failed'); }
  };

  const downloadPPT = (pptUrl) => {
    window.open(pptUrl, '_blank');
  };

  const getPublicLink = (url) => {
    if (!url) return '';
    // If it's already a public railway link, don't mess with it
    if (url.includes('.up.railway.app')) return url.replace('http://', 'https://');
    
    return url
      .replace(/([a-zA-Z0-9-]+\.)+railway\.internal(:\d+)?/, (match) => {
        if (match.includes('python') || match.includes('liberation')) 
          return 'endearing-liberation-production.up.railway.app';
        return 'hackathon-production-c6be.up.railway.app';
      })
      .replace('http://', 'https://');
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (subFilter === 'ALL') return true;
    if (subFilter === 'SUBMITTED') return sub.status === 'SUBMITTED';
    if (subFilter === 'LOCKED') return sub.status === 'LOCKED';
    if (subFilter === 'PENDING') return !sub.pptUrl;
    return true;
  });

  const handleForceRegenerate = async (teamId) => {
    if (!confirm("🚨 FORCE SYSTEM RECONSTRUCTION?\nThis will bypass the lock and re-execute the synthesis engine for this team. Use only if artifact is missing from node.")) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.post(`${apiUrl}/admin/force-regenerate`, { teamId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert(res.data.message);
      fetchSubmissions();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || "Reconstruction Failed.");
    }
  };

  const handleToggleHalt = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      await axios.post(`${apiUrl}/admin/toggle-halt`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      // Allow socket to update the UI state naturally
    } catch (err) { alert("Failed to toggle system status."); }
  };

  return (
    <div className="flex min-h-screen bg-bg-light font-sans text-slate-800">
      
      {/* Logo Overlay for Mobile */}
      <div className="fixed top-6 right-6 lg:hidden z-50">
        <div className="w-12 h-12 relative">
          <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Side Navigation */}
      <aside className="w-full lg:w-80 bg-navy text-white flex flex-col relative overflow-hidden lg:sticky lg:top-0 lg:h-screen transition-all">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
        
        <div className="flex items-center gap-4 py-12 px-10 relative z-10 border-b border-white/5">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-navy font-black text-2xl shadow-2xl">H</div>
          <div>
             <span className="text-xl font-black tracking-tighter uppercase block leading-none text-white transition-opacity group-hover:opacity-80">hack@jit</span>
             <span className="text-[10px] font-bold text-teal tracking-[0.2em] uppercase leading-none mt-1">Authority</span>
          </div>
        </div>
        
        <nav className="flex-grow space-y-2 p-6 relative z-10 mt-6 overflow-y-auto">
          {['overview', 'submissions', 'problem statements', 'teams', 'configuration', 'audit logs'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-between group ${activeTab === tab ? 'bg-white text-navy shadow-2xl shadow-white/5' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            >
              {tab}
              <div className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === tab ? 'bg-teal scale-100' : 'bg-transparent scale-0 group-hover:scale-100 group-hover:bg-white/20'}`}></div>
            </button>
          ))}
        </nav>

        <div className="p-8 relative z-10">
          <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 text-center shadow-inner">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em] mb-4">Master Temporal Clock</p>
            <p className={`text-4xl font-mono leading-none font-black tabular-nums tracking-tighter ${timer.timerPaused ? 'text-amber-400' : 'text-teal animate-pulse'}`}>
              {timer.formattedTime}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-16 overflow-y-auto">
        
        <header className="mb-16 flex justify-between items-center animate-fade-in">
          <div>
            <h1 className="text-5xl font-black text-navy uppercase tracking-tighter leading-none">Command Center</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-3 italic">Autonomous Environment Management System v4.0.0A</p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('role');
                  window.location.href = '/';
                }}
                className="px-6 py-4 border border-slate-200 rounded-2xl font-black text-[9px] md:text-[10px] tracking-[0.2em] text-slate-400 hover:text-navy hover:border-navy transition-all uppercase"
              >
                Logout
              </button>
              <button 
                onClick={handleToggleHalt}
                className={`px-6 py-4 md:px-10 md:py-5 rounded-2xl font-black text-[9px] md:text-[11px] tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${timer.timerPaused ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-rose-500 text-white shadow-rose-500/20'}`}
              >
                {timer.timerPaused ? 'START HACKATHON' : 'PAUSE HACKATHON'}
              </button>
            </div>
            {/* Institutional Logo - Right Corner */}
            <div className="w-16 h-16 md:w-24 md:h-24 relative">
              <img src="/images/institution_logo.png" alt="Institutional Logo" className="w-full h-full object-contain" />
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-fade-in">
            <div className="dashboard-card !p-10 group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-royal/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
               <span className="text-[10px] font-black text-royal uppercase tracking-[0.3em] block mb-2">Total Enrollment</span>
               <div className="text-7xl font-black text-navy tabular-nums leading-none tracking-tighter mt-4">{stats.total_candidates || 0}</div>
               <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Credentials</span>
                  <span className="w-2 h-2 bg-royal rounded-full"></span>
               </div>
            </div>

            <div className="dashboard-card !p-10 group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-teal/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
               <span className="text-[10px] font-black text-teal uppercase tracking-[0.3em] block mb-2">In Synthesis</span>
               <div className="text-7xl font-black text-teal tabular-nums leading-none tracking-tighter mt-4">{stats.statuses?.in_progress || 0}</div>
               <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Data Flow</span>
                  <span className="w-2 h-2 bg-teal rounded-full animate-ping"></span>
               </div>
            </div>

            <div className="dashboard-card !p-10 group relative overflow-hidden">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-2">Challenges Defined</span>
               <div className="text-7xl font-black text-slate-300 tabular-nums leading-none tracking-tighter mt-4">{problemStatements.length}</div>
               <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master Registry</span>
                  <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-12 animate-fade-in">
            {/* Enrollment Form */}
            <section className="dashboard-card !p-12">
               <div className="flex flex-col gap-2 mb-10">
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Enrollment Pipeline</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Generate Secure Institutional Bundles</p>
               </div>
              
              <form onSubmit={handleCreateTeam} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div>
                    <label className="label-caps">Portal Identity (Unique Username)</label>
                    <input className="input-field !text-lg !font-bold" placeholder="Ex: Team_Logic_2026" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label-caps">Institutional Key (Password)</label>
                    <input className="input-field !text-lg !font-bold" placeholder="Ex: MIT_Innovation_Hub" value={newTeam.collegeName} onChange={e => setNewTeam({...newTeam, collegeName: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label-caps">Challenge Alignment (Problem Statement)</label>
                    <select 
                       className="input-field !text-base font-bold bg-white"
                       value={newTeam.problemStatementId}
                       onChange={e => setNewTeam({...newTeam, problemStatementId: e.target.value})}
                    >
                       <option value="">-- UNMATCHED --</option>
                       {problemStatements.map(ps => (
                         <option key={ps.id} value={ps.id} disabled={!!ps.allottedTo}>
                           Q.{ps.questionNo}: {ps.title} {ps.allottedTo ? '(Already Allotted)' : ''}
                         </option>
                       ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <label className="label-caps">Lead Component Designer</label>
                    <input className="input-field" placeholder="Full Legal Name" value={newTeam.member1} onChange={e => setNewTeam({...newTeam, member1: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-caps">Strategic Collaborator</label>
                    <input className="input-field" placeholder="Full Legal Name" value={newTeam.member2} onChange={e => setNewTeam({...newTeam, member2: e.target.value})} />
                  </div>
                </div>

                <div className="md:col-span-2 pt-6">
                  <button type="submit" className="w-full bg-navy text-white text-[11px] font-black py-6 rounded-[2rem] tracking-[0.4em] uppercase hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-navy/30">
                    Generate and Authenticate Portal Credentials
                  </button>
                </div>
              </form>
            </section>

            {/* Team List */}
            <section className="dashboard-card !p-10">
              <div className="flex justify-between items-end mb-8">
                 <h2 className="text-xl font-black text-navy uppercase tracking-widest">Active Credential directory</h2>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{teams.length} Enrolled Entities</span>
              </div>

              <div className="overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100">
                    <tr>
                      <th className="label-caps py-6">Operational Identity</th>
                      <th className="label-caps py-6">Institutional Key</th>
                      <th className="label-caps py-6">System Status</th>
                      <th className="label-caps py-6 text-right">Repository Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {teams.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="py-8 font-black text-navy uppercase tracking-tight text-sm">{t.teamName}</td>
                        <td className="py-8 text-xs font-bold text-slate-400 tabular-nums italic group-hover:text-navy group-hover:not-italic transition-all">••••••••••••</td>
                        <td className="py-8">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-600' : 'bg-royal/10 text-royal'}`}>
                            <span className={`w-1 h-1 rounded-full ${t.status === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-royal animate-pulse'}`}></span>
                            {t.status}
                          </div>
                        </td>
                        <td className="py-8 text-right">
                          <button 
                            onClick={() => handleDeleteTeam(t.id)}
                            className="text-[9px] font-black text-rose-400 hover:text-white uppercase tracking-[0.2em] px-6 py-2.5 border border-rose-100 rounded-xl hover:bg-rose-500 hover:border-rose-500 transition-all active:scale-95"
                          >
                            Revoke Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
        {activeTab === 'submissions' && (
          <div className="space-y-12 animate-fade-in">
             <section className="dashboard-card !p-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                   <div>
                      <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Submission Vault</h2>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1">Artifact Oversight & Resource Management</p>
                   </div>
                   <div className="flex gap-2">
                      {['ALL', 'PENDING', 'SUBMITTED', 'LOCKED'].map(f => (
                        <button 
                          key={f}
                          onClick={() => setSubFilter(f)}
                          className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${subFilter === f ? 'bg-teal text-white shadow-lg shadow-teal/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          {f}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-separate border-spacing-y-4">
                      <thead>
                         <tr className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                            <th className="px-6 pb-2">Candidate Entity</th>
                            <th className="px-6 pb-2">Network Status</th>
                            <th className="px-6 pb-2 text-center">PPT</th>
                            <th className="px-6 pb-2">Institutional Metadata</th>
                            <th className="px-6 pb-2">Lock State</th>
                            <th className="px-6 pb-2 text-right">Vault Actions</th>
                         </tr>
                      </thead>
                      <tbody>
                         {filteredSubmissions.map(sub => (
                           <tr key={sub.id} className="bg-slate-50/30 hover:bg-white hover:shadow-xl hover:shadow-navy/5 transition-all group rounded-3xl overflow-hidden">
                              <td className="py-6 px-6 first:rounded-l-3xl border-y border-transparent group-hover:border-slate-100">
                                 <p className="font-black text-navy uppercase text-sm tracking-tight">{sub.team.teamName}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{sub.team.collegeName}</p>
                              </td>
                              <td className="py-6 px-6 border-y border-transparent group-hover:border-slate-100">
                                 <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${sub.status === 'LOCKED' ? 'bg-navy text-white' : sub.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-600' : 'bg-royal/10 text-royal'}`}>
                                    <span className={`w-1 h-1 rounded-full ${sub.status === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-royal animate-pulse'}`}></span>
                                    {sub.status}
                                 </div>
                              </td>
                              <td className="py-6 px-6 text-center border-y border-transparent group-hover:border-slate-100">
                                 {sub.pptUrl ? <span className="text-emerald-500 text-lg">●</span> : <span className="text-slate-200 text-lg">○</span>}
                              </td>
                              <td className="py-6 px-6 border-y border-transparent group-hover:border-slate-100">
                                 {sub.prototypeUrl ? (
                                    <div className="max-w-[150px]">
                                       <p className="text-[9px] font-black uppercase text-navy mb-1 leading-none">Prototype Link</p>
                                       <a href={sub.prototypeUrl} target="_blank" rel="noopener noreferrer" className="text-[8px] text-teal font-bold uppercase truncate block hover:underline">{sub.prototypeUrl}</a>
                                    </div>
                                 ) : <span className="text-[9px] font-bold text-slate-300 uppercase italic">Pending Data</span>}
                              </td>
                              <td className="py-6 px-6 border-y border-transparent group-hover:border-slate-100">
                                 <div className="flex items-center gap-2">
                                    <button 
                                       onClick={() => toggleRegenerate(sub.teamId, sub.canRegenerate)}
                                       className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border transition-all ${sub.canRegenerate ? 'border-emerald-100 text-emerald-600 hover:bg-emerald-50 shadow-sm' : 'border-rose-100 text-rose-500 hover:bg-rose-50 shadow-sm'}`}
                                    >
                                       {sub.canRegenerate ? '🔓 Open' : '🔒 Locked'}
                                    </button>
                                    {sub.pptUrl && (
                                       <button 
                                          onClick={() => handleForceRegenerate(sub.teamId)}
                                          title="Force Reconstruction"
                                          className="p-2 border border-slate-100 rounded-lg hover:bg-navy hover:text-white transition-all text-xs"
                                       >
                                          🔄
                                       </button>
                                    )}
                                 </div>
                              </td>
                              <td className="py-6 px-6 text-right last:rounded-r-3xl border-y border-transparent group-hover:border-slate-100">
                                 {sub.pptUrl && (
                                    <a 
                                       href={getPublicLink(sub.pptUrl)}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       className="px-4 py-2 bg-teal text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-navy transition-all shadow-lg shadow-teal/20 flex items-center gap-2 justify-center ml-auto w-fit"
                                    >
                                       <span>Download</span>
                                       <span className="text-xs font-bold">↓</span>
                                    </a>
                                 )}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </section>
          </div>
        )}

        {activeTab === 'problem statements' && (
          <div className="space-y-12 animate-fade-in">
            <section className="dashboard-card !p-12">
               <div className="flex flex-col gap-2 mb-10">
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">Challenge Allotment</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Deploy Problem Statements to Candidates</p>
               </div>
              
              <form onSubmit={handleCreateStatement} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   <div>
                      <label className="label-caps">Question No.</label>
                      <input className="input-field !text-lg !font-bold" placeholder="Ex: 402" value={newStatement.questionNo} onChange={e => setNewStatement({...newStatement, questionNo: e.target.value})} required />
                   </div>
                   <div>
                      <label className="label-caps">Sub Divisions</label>
                      <input className="input-field !text-lg !font-bold" placeholder="Ex: IV.a" value={newStatement.subDivisions} onChange={e => setNewStatement({...newStatement, subDivisions: e.target.value})} />
                   </div>
                   <div>
                      <label className="label-caps">Allot to Team (Name/ID)</label>
                      <input className="input-field !text-lg !font-bold" placeholder="Optional" value={newStatement.allottedTo} onChange={e => setNewStatement({...newStatement, allottedTo: e.target.value})} />
                   </div>
                </div>
                <div>
                   <label className="label-caps">Challenge Title</label>
                   <input className="input-field" placeholder="Ex: Autonomous Waste Management System" value={newStatement.title} onChange={e => setNewStatement({...newStatement, title: e.target.value})} required />
                </div>
                <div>
                   <label className="label-caps">Core Description</label>
                   <textarea className="input-field min-h-[120px]" placeholder="Detailed problem summary for the team..." value={newStatement.description} onChange={e => setNewStatement({...newStatement, description: e.target.value})} required />
                </div>
                <button type="submit" className="w-full bg-teal text-white text-[11px] font-black py-6 rounded-[2rem] tracking-[0.4em] uppercase hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-teal/30">
                  Deploy Problem Statement to Registry
                </button>
              </form>
            </section>

            <section className="dashboard-card !p-10">
               <div className="flex justify-between items-end mb-8">
                  <h2 className="text-xl font-black text-navy uppercase tracking-widest">Master Registry</h2>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{problemStatements.length} Active Challenges</span>
               </div>

               <div className="space-y-6">
                  {problemStatements.map(ps => (
                    <div key={ps.id} className="p-8 border border-slate-100 rounded-3xl hover:border-teal/30 transition-all group flex justify-between items-start">
                       <div className="flex-grow max-w-4xl">
                          <div className="flex items-center gap-3 mb-3">
                             <span className="text-[10px] font-black bg-navy text-white px-3 py-1 rounded-lg tabular-nums">Q.{ps.questionNo}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ps.subDivisions || 'Main division'}</span>
                             {ps.allottedTo && <span className="text-[9px] font-black text-teal uppercase tracking-widest ml-4">Allotted: {ps.allottedTo}</span>}
                          </div>
                          <h4 className="text-xl font-black text-navy uppercase tracking-tight mb-2">{ps.title}</h4>
                          <p className="text-sm font-medium text-slate-500 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all">
                            {ps.description}
                          </p>
                       </div>
                       <button onClick={() => handleDeleteStatement(ps.id)} className="p-4 rounded-xl text-rose-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  ))}
               </div>
            </section>
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="space-y-12 animate-fade-in">
            <section className="dashboard-card !p-12">
               <div className="flex flex-col gap-2 mb-10">
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">System Infrastructure</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Temporal & Branding Configuration</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                     <div>
                        <label className="label-caps">Temporal Duration (Minutes)</label>
                        <input 
                           type="number" 
                           className="input-field !text-lg !font-bold" 
                           value={stats.test_config?.durationMinutes || 1440} 
                           onChange={async (e) => {
                              const val = parseInt(e.target.value);
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';
                              await axios.post(`${apiUrl}/admin/test-config`, { durationMinutes: val }, {
                                 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                              });
                              fetchStats();
                           }}
                        />
                     </div>
                     <div>
                        <label className="label-caps">Institutional Branding (Footer)</label>
                        <input 
                           className="input-field" 
                           placeholder="Ex: Powered by Innovation Lab v4" 
                           value={stats.test_config?.footerText || ''} 
                           onChange={async (e) => {
                              const val = e.target.value;
                              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';
                              await axios.post(`${apiUrl}/admin/test-config`, { footerText: val }, {
                                 headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                              });
                              fetchStats();
                           }}
                        />
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 italic">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-4">
                           Infrastructure Status
                        </p>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase text-navy">Synthesis Engine</span>
                              <span className="text-[9px] font-black uppercase text-emerald-500">OPERATIONAL</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase text-navy">Repository Sync</span>
                              <span className="text-[9px] font-black uppercase text-emerald-500">ACTIVE</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase text-navy">Artifact Store</span>
                              <span className="text-[9px] font-black uppercase text-amber-500">OPTIMIZING</span>
                           </div>
                        </div>
                     </div>

                     <div className="p-8 bg-navy text-white rounded-3xl shadow-xl shadow-navy/20">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-teal mb-2">Emergency Recovery</h4>
                        <p className="text-[9px] font-medium text-slate-400 leading-relaxed mb-4 uppercase">
                           If the primary database state becomes desynchronized, use the pulse-force link to reset global parameters.
                        </p>
                        <a 
                           href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || 'http://localhost:5000'}/setup-db`}
                           target="_blank" 
                           className="text-[9px] font-black uppercase tracking-[0.2em] text-white underline hover:text-teal"
                        >
                           Pulse-Force Setup Link
                        </a>
                     </div>
                  </div>
               </div>
            </section>
          </div>
        )}

        {activeTab === 'audit logs' && (
          <div className="animate-fade-in dashboard-card !p-12 text-center py-20">
              <div className="text-4xl mb-6 grayscale opacity-20">📜</div>
              <h3 className="text-xl font-black text-navy uppercase tracking-widest">Temporal Audit Logs</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time verification of all system interactions is currently active.</p>
          </div>
        )}
      </main>
    </div>
  );
}
