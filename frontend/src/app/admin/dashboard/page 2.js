'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000');

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({ total_teams: 0, statuses: {} });
  const [teams, setTeams] = useState([]);
  const [timer, setTimer] = useState({ formattedTime: '24:00:00', timerPaused: true });
  
  // Form States
  const [newTeam, setNewTeam] = useState({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1 });
  
  useEffect(() => {
    fetchStats();
    fetchTeams();
    
    socket.on('timerUpdate', (data) => {
      setTimer(data);
    });

    return () => socket.off('timerUpdate');
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/v1/admin/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTeams = async () => {
    try {
      const res = await axios.get('http://localhost:5000/v1/admin/candidates', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeams(res.data.candidates);
    } catch (err) { console.error(err); }
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm("Are you sure you want to revoke this team's credentials? All synthesis data will be purged.")) return;
    try {
      await axios.delete(`http://localhost:5000/v1/admin/teams/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchTeams();
      fetchStats();
    } catch (err) { alert("Failed to revoke credentials."); }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/v1/admin/create-team', newTeam, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Portal credentials generated and enrolled successfully.");
      setNewTeam({ teamName: '', collegeName: '', member1: '', member2: '', dept: '', year: 1 });
      fetchTeams();
      fetchStats();
    } catch (err) { alert("Error: Logic conflict or duplicate identity detected."); }
  };

  const sendCommand = (action) => socket.emit('adminCommand', { action });

  return (
    <div className="flex min-h-screen bg-bg-light font-sans text-text-main">
      {/* Side Navigation */}
      <aside className="w-64 bg-brand-navy text-white flex flex-col pt-10 px-4">
        <div className="flex items-center gap-2 mb-10 px-4">
          <div className="w-8 h-8 bg-brand-teal rounded flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold tracking-tight">Synthesis</span>
        </div>
        
        <nav className="flex-grow space-y-2">
          {['overview', 'teams', 'configuration', 'verification'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'bg-brand-blue text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="p-4 mb-8 bg-white/5 rounded-xl border border-white/10 text-center">
          <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">System Clock</p>
          <p className={`text-2xl font-mono ${timer.timerPaused ? 'text-amber-400' : 'text-brand-teal'}`}>
            {timer.formattedTime}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-brand-navy uppercase tracking-tighter">Command Center</h1>
            <p className="text-gray-500 font-medium italic mt-1 text-sm">Synchronized presentation infrastructure management.</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                window.location.href = '/';
              }}
              className="px-6 py-3 border border-gray-200 rounded-lg font-bold text-[10px] tracking-widest text-gray-400 hover:text-brand-navy hover:border-brand-navy transition-all uppercase"
            >
              Authority Exit
            </button>
            <button 
              onClick={() => sendCommand(timer.timerPaused ? 'start' : 'pause')}
              className={`px-8 py-3 rounded-lg font-bold text-sm tracking-widest transition-all ${timer.timerPaused ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'bg-rose-600 text-white shadow-lg shadow-rose-900/20'}`}
            >
              {timer.timerPaused ? 'RESUME SYNTHESIS' : 'HALT ENVIRONMENT'}
            </button>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="dashboard-card p-8 group hover:border-brand-blue transition-colors">
              <p className="label-caps">Total Enrollment</p>
              <div className="text-5xl font-black text-brand-navy mt-2">{stats.total_candidates || 0}</div>
              <p className="text-xs text-brand-blue font-bold mt-2 italic shadow-blue-500">Verified Teams</p>
            </div>
            <div className="dashboard-card p-8 group hover:border-brand-teal transition-colors">
              <p className="label-caps">In Synthesis</p>
              <div className="text-5xl font-black text-brand-teal mt-2">{stats.statuses?.in_progress || 0}</div>
              <p className="text-xs text-brand-teal font-bold mt-2 italic">Active Progress</p>
            </div>
            <div className="dashboard-card p-8 group hover:border-brand-navy transition-colors">
              <p className="label-caps">Final Submissions</p>
              <div className="text-5xl font-black text-gray-400 mt-2">{stats.statuses?.submitted || 0}</div>
              <p className="text-xs text-gray-400 font-bold mt-2 italic">Awaiting Review</p>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-10">
            {/* Enrollment Form */}
            <section className="bg-white p-10 rounded-2xl border border-gray-100">
              <h2 className="text-xl font-extrabold text-brand-navy mb-2 border-b pb-4">New Team Enrollment</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-8">Admin Generated Credentials for Institutional Access</p>
              
              <form onSubmit={handleCreateTeam} className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-caps text-[10px]">Portal Identity (Team Name)</label>
                  <input className="input-field" placeholder="Ex: Team Logic" value={newTeam.teamName} onChange={e => setNewTeam({...newTeam, teamName: e.target.value})} required />
                </div>
                <div>
                  <label className="label-caps text-[10px]">Institutional Key (College Name)</label>
                  <input className="input-field" placeholder="Ex: MIT Engineering" value={newTeam.collegeName} onChange={e => setNewTeam({...newTeam, collegeName: e.target.value})} required />
                </div>
                <div>
                  <label className="label-caps text-[10px]">Lead Researcher / Member 1</label>
                  <input className="input-field" placeholder="Full Name" value={newTeam.member1} onChange={e => setNewTeam({...newTeam, member1: e.target.value})} />
                </div>
                <div>
                  <label className="label-caps text-[10px]">Collaborator / Member 2</label>
                  <input className="input-field" placeholder="Full Name" value={newTeam.member2} onChange={e => setNewTeam({...newTeam, member2: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <button type="submit" className="btn-navy w-full text-xs tracking-widest uppercase py-4">Generate and Authenticate Bundle</button>
                </div>
              </form>
            </section>

            {/* Team List */}
            <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-lg font-bold text-brand-navy mb-6">Active Credential Directory</h2>
              <table className="w-full text-left">
                <thead className="border-b">
                  <tr>
                    <th className="label-caps py-4">Identity</th>
                    <th className="label-caps py-4">Institutional Key</th>
                    <th className="label-caps py-4">Status</th>
                    <th className="label-caps py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teams.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-5 font-bold text-sm text-brand-navy">{t.teamName}</td>
                      <td className="py-5 text-sm text-gray-500">{t.collegeName}</td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${t.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-blue/10 text-brand-blue'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-5 text-right">
                        <button 
                          onClick={() => handleDeleteTeam(t.id)}
                          className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest px-4 py-2 border border-rose-100 rounded-lg hover:bg-rose-50 transition-all"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        )}

        {activeTab === 'configuration' && (
          <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm max-w-4xl">
            <h2 className="text-xl font-extrabold text-brand-navy mb-8 border-b pb-4 uppercase tracking-tighter">Event Infrastructure Parameters</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const formData = new FormData(e.target);
                const data = {
                  durationMinutes: parseInt(formData.get('duration')),
                  pptConfig: { titles: formData.get('titles').split(',').map(s => s.trim()) },
                  footerText: formData.get('footer')
                };
                await axios.post('http://localhost:5000/v1/admin/test-config', data, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                alert("Infrastructure parameters synchronized successfully.");
              } catch (err) { alert("Failed to update configuration."); }
            }} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="label-caps font-black">Sync Duration (Minutes)</label>
                  <input name="duration" type="number" className="input-field" defaultValue="1440" required />
                  <p className="text-[10px] text-gray-400 mt-2 font-bold italic">Default: 1440 (24 Hours)</p>
                </div>
                <div>
                  <label className="label-caps font-black">Institutional Footer</label>
                  <input name="footer" className="input-field" placeholder="Ex: Hackathon 2026 | Technical Division" />
                </div>
              </div>
              <div>
                <label className="label-caps font-black">Presentation Hierarchy (Slide Titles)</label>
                <textarea name="titles" className="input-field min-h-[100px]" placeholder="Title, Abstract, Problem, Solution, Architecture, Technologies, Impact, Outcome" defaultValue="Title, Abstract, Problem, Solution, Architecture, Technologies, Impact, Outcome" required />
                <p className="text-[10px] text-gray-400 mt-2 font-bold italic">Separate titles with commas. The engine will synthesize slides based on this order.</p>
              </div>
              <button type="submit" className="btn-navy w-full py-4 text-xs tracking-[2px]">Synchronize System Parameters</button>
            </form>
          </div>
        )}

        {/* Verification Tab Placeholder */}
        {activeTab === 'verification' && (
          <div className="dashboard-card p-12 text-center flex flex-col items-center justify-center border-dashed border-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">📋</div>
            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-widest">Awaiting Active Submissions</h3>
            <p className="text-gray-400 text-[10px] mt-2 max-w-xs mx-auto italic font-medium">Evaluation modules will activate once teams begin finalizing their project synthesis.</p>
          </div>
        )}
      </main>
    </div>
  );
}