'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function PostHackathonCertificateModal({ isOpen, onClose, teamData, apiUrl }) {
  const [participants, setParticipants] = useState([
    { name: '', role: 'Leader', college: '', year: '', dept: '' },
    { name: '', role: 'Member', college: '', year: '', dept: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let initialParticipants = [];
    if (teamData?.submission?.certificates && teamData.submission.certificates.length > 0) {
      initialParticipants = teamData.submission.certificates.map(c => ({
        ...c,
        year: c.year || '1'
      }));
    } else {
        initialParticipants = [
            { name: '', role: 'Leader', college: teamData?.collegeName || '', year: '1', dept: 'N/A' },
            { name: '', role: 'Member', college: teamData?.collegeName || '', year: '1', dept: 'N/A' }
        ];
    }

    // Force at least 2 slots
    if (initialParticipants.length < 2) {
      initialParticipants.push({ name: '', role: 'Member', college: teamData?.collegeName || '', year: '1', dept: 'N/A' });
    }

    setParticipants(initialParticipants);
  }, [teamData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setStatus(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/team/certificate-details`, {
        participants
      }, { headers: { Authorization: `Bearer ${token}` } });
      setStatus({ type: 'success', message: 'Names saved successfully!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Failed to save names.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus(null);
    try {
      const token = localStorage.getItem('token');
      // Save names first to ensure latest are used
      await axios.post(`${apiUrl}/team/certificate-details`, { participants }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const res = await axios.post(`${apiUrl}/team/generate-certificates`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setStatus({ type: 'success', message: res.data.message || 'Certificates generated!' });
      
      // Update local state with new URLs so buttons appear immediately
      if (res.data.success) {
         // Refresh data to get URLs
         const refreshed = await axios.get(`${apiUrl}/team/profile`, { headers: { Authorization: `Bearer ${token}` } });
         if (refreshed.data.submission?.certificates) {
             const newCerts = refreshed.data.submission.certificates;
             setParticipants(prev => prev.map(p => {
                 const match = newCerts.find(c => c.role === p.role);
                 return match ? { ...p, certificateUrl: match.certificateUrl } : p;
             }));
         }
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.error || 'Generation failed.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade">
      <div className="card-premium w-full max-w-2xl space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] overflow-y-auto max-h-[90vh] !bg-white/90 !backdrop-blur-2xl !border-white/60">
        <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Certificate Details</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Verify names for final generation</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors font-bold text-xl">✕</button>
        </div>

        <div className="space-y-6">
          {participants.map((p, idx) => (
            <div key={idx} className="p-5 bg-white/50 rounded-2xl border border-slate-200/50 space-y-4 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold bg-blue-100/80 text-blue-600 px-3 py-1 rounded-full backdrop-blur-sm">{p.role === 'Leader' || p.role === 'LEADER' ? '01' : '02'}</span>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{p.role} Details</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                    <input 
                      className="input-premium py-2 !text-xs !bg-white/80" 
                      value={p.name} 
                      onChange={e => { let u = [...participants]; u[idx].name = e.target.value; setParticipants(u); }}
                      placeholder="As it should appear on certificate"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Institution</label>
                    <input 
                      className="input-premium py-2 !text-xs !bg-white/80" 
                      value={p.college} 
                      onChange={e => { let u = [...participants]; u[idx].college = e.target.value; setParticipants(u); }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Department</label>
                    <input 
                      className="input-premium py-2 !text-xs !bg-white/80" 
                      value={p.dept} 
                      onChange={e => { let u = [...participants]; u[idx].dept = e.target.value; setParticipants(u); }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Year of Study</label>
                    <select 
                      className="input-premium py-2 !text-xs !bg-white/80 font-bold" 
                      value={p.year} 
                      onChange={e => { let u = [...participants]; u[idx].year = e.target.value; setParticipants(u); }}
                    >
                      {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} Year</option>)}
                    </select>
                  </div>
                   </div>
                {p.certificateUrl && (
                    <div className="pt-2 border-t border-slate-200/50 flex justify-end">
                        <a 
                          href={p.certificateUrl} 
                          target="_blank" 
                          className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors uppercase tracking-wider"
                        >
                          <span>Download Certificate</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                    </div>
                )}
             </div>
           ))}
         </div>
 
         {status && (
           <div className={`p-4 rounded-xl text-xs font-bold uppercase text-center ${status.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-rose-50 text-rose-600 border border-rose-100'} animate-pulse`}>
             {status.message}
           </div>
         )}
 
         <div className="flex gap-4 border-t border-slate-200/50 pt-6">
           <button 
             onClick={onClose} 
             className="px-6 py-4 rounded-2xl border-2 border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
           >
             Close
           </button>
           <button 
             disabled={isSubmitting || isGenerating}
             onClick={handleSubmit}
             className="flex-1 bg-white/80 border-2 border-[var(--secondary-blue)] text-[var(--secondary-blue)] px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-blue-50 transition-all backdrop-blur-sm"
           >
             {isSubmitting ? 'Syncing...' : 'Save Details'}
           </button>
           <button 
             disabled={isSubmitting || isGenerating}
             onClick={handleGenerate}
             className="flex-1 btn-blue !py-4 text-xs uppercase font-bold tracking-widest shadow-lg shadow-blue-100 disabled:opacity-50"
           >
             {isGenerating ? 'Processing...' : 'Generate Certificates'}
           </button>
        </div>
      </div>
    </div>
  );
}
