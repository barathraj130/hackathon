'use client';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ReviewerDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Score Form
  const [scores, setScores] = useState({
     innovation: 0, feasibility: 0, techStack: 0, presentation: 0, impact: 0, comments: ''
  });

  useEffect(() => {
     const role = localStorage.getItem('role');
     if (role !== 'REVIEWER' && role !== 'ADMIN') {
         router.push('/login');
         return;
     }
     fetchData();
  }, []);

  const fetchData = async () => {
     const token = localStorage.getItem('token');
     const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
     try {
        const res = await axios.get(`${apiUrl}/reviewer/dashboard`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
            setTeams(res.data.teams);
        }
     } catch (e) {
        console.error(e);
        if (e.response?.status === 403 || e.response?.status === 401) router.push('/login');
     } finally {
        setLoading(false);
     }
  };

  const openEvaluation = (team) => {
     setSelectedTeam(team);
     if (team.myScore) {
        setScores({
            innovation: team.myScore.innovation,
            feasibility: team.myScore.feasibility,
            techStack: team.myScore.techStack,
            presentation: team.myScore.presentation,
            impact: team.myScore.impact,
            comments: team.myScore.comments || ''
        });
     } else {
        setScores({ innovation: 0, feasibility: 0, techStack: 0, presentation: 0, impact: 0, comments: '' });
     }
  };

  const handleScoreChange = (field, value) => {
      // Clamp 0-20 (assuming total 100) or 0-10. Let's assume 20 per text field for 100 total.
      let v = parseInt(value) || 0;
      if (v < 0) v = 0;
      if (v > 20) v = 20; // 5 fields * 20 = 100 total
      setScores(prev => ({ ...prev, [field]: v }));
  };

  const submitScore = async () => {
     const token = localStorage.getItem('token');
     const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
     try {
        await axios.post(`${apiUrl}/reviewer/score`, {
            teamId: selectedTeam.id,
            ...scores
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Evaluation Saved Successfully!");
        setSelectedTeam(null);
        fetchData();
     } catch (e) {
        alert("Error saving score: " + (e.response?.data?.error || e.message));
     }
  };

  const filteredTeams = teams.filter(t => 
      t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.collegeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">R</div>
            <div>
                <h1 className="font-bold text-lg leading-none">Reviewer Portal</h1>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaluation Console</p>
            </div>
        </div>
        <div>
            <button onClick={() => { localStorage.clear(); router.push('/login'); }} className="text-xs font-bold text-slate-500 hover:text-red-500 uppercase tracking-widest transition-colors">Logout</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Team Submissions ({filteredTeams.length})</h2>
            <input 
                type="text" 
                placeholder="Search teams..." 
                className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>

        {loading ? (
            <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase tracking-widest">Syncing Data...</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeams.map(team => (
                    <div key={team.id} className={`bg-white rounded-2xl border ${team.isEvaluated ? 'border-green-200 shadow-green-100/50' : 'border-slate-200'} p-6 shadow-sm hover:shadow-lg transition-all group relative`}>
                        {team.isEvaluated && (
                            <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                                Scored: {team.totalScore}
                            </div>
                        )}
                        <div className="mb-4">
                            <h3 className="font-bold text-lg text-slate-800 mb-1">{team.teamName}</h3>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{team.collegeName}</p>
                        </div>
                        
                        <div className="flex gap-2 mb-6">
                             {team.pptUrl ? (
                                 <a href={team.pptUrl} target="_blank" className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-wider text-center hover:bg-blue-100 transition-colors">View Deck</a>
                             ) : (
                                 <span className="flex-1 py-2 bg-slate-50 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-center cursor-not-allowed">No Deck</span>
                             )}
                             {team.prototypeUrl ? (
                                 <a href={team.prototypeUrl} target="_blank" className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold uppercase tracking-wider text-center hover:bg-purple-100 transition-colors">Prototype</a>
                             ) : (
                                 <span className="flex-1 py-2 bg-slate-50 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-center cursor-not-allowed">No Proto</span>
                             )}
                        </div>

                        <button 
                            onClick={() => openEvaluation(team)}
                            className={`w-full py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all ${team.isEvaluated ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:translate-y-[-2px] shadow-lg shadow-indigo-200'}`}
                        >
                            {team.isEvaluated ? 'Edit Evaluation' : 'Evaluate Team'}
                        </button>
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* EVALUATION MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Evaluating {selectedTeam.teamName}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Max 20 points per category</p>
                    </div>
                    <button onClick={() => setSelectedTeam(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 font-bold hover:bg-red-100 hover:text-red-500 transition-colors">✕</button>
                </div>
                
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {['Innovation', 'Feasibility', 'TechStack', 'Presentation', 'Impact'].map((cat) => (
                            <div key={cat}>
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{cat}</label>
                                    <span className="text-xs font-bold text-indigo-600">{scores[cat.toLowerCase()] || 0}/20</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="20" 
                                    className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    value={scores[cat.toLowerCase()]}
                                    onChange={(e) => handleScoreChange(cat.toLowerCase(), e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Reviewer Comments</label>
                        <textarea 
                            className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm font-medium h-32 resize-none"
                            placeholder="Optional feedback..."
                            value={scores.comments}
                            onChange={(e) => setScores(p => ({...p, comments: e.target.value}))}
                        ></textarea>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                         <div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Score</p>
                            <p className="text-3xl font-black text-indigo-600">
                                {Object.keys(scores).filter(k => k!=='comments').reduce((a,b) => a + (parseInt(scores[b])||0), 0)}
                                <span className="text-sm text-slate-300 ml-1">/100</span>
                            </p>
                         </div>
                         <div className="flex gap-4">
                             <button onClick={() => setSelectedTeam(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase text-xs tracking-wider">Cancel</button>
                             <button onClick={submitScore} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold uppercase text-xs tracking-wider shadow-lg shadow-indigo-200 hover:-translate-y-1 transition-transform">Submit Evaluation</button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
