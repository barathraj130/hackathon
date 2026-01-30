'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function AdminCertificateModal({ isOpen, onClose, teamId, teamName, certificates, apiUrl, onComplete }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (certificates && certificates.length > 0) {
      setParticipants(certificates);
    } else {
      setParticipants([
        { name: '', role: 'LEADER', college: '', year: '1', dept: '' },
        { name: '', role: 'MEMBER', college: '', year: '1', dept: '' }
      ]);
    }
  }, [certificates, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/admin/update-certificates`, { 
        teamId, 
        participants: participants.filter(p => p.name.trim() !== '') 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Participant details updated.");
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/admin/generate-team-certificates`, { teamId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Certificates generated successfully.");
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate certificates.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade">
      <div className="card-premium w-full max-w-2xl space-y-6 shadow-2xl border-white/60 !bg-white/90 !backdrop-blur-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Team Participants & Certificates</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Edit details for {teamName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-xl font-bold">✕</button>
        </div>
        
        <div className="space-y-6">
          {participants.map((p, idx) => (
            <div key={idx} className="p-4 bg-white/50 rounded-2xl border border-slate-200/50 space-y-4 shadow-sm">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-blue-100/80 text-blue-600 px-2 py-0.5 rounded uppercase tracking-tighter backdrop-blur-sm">{p.role}</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                    <input 
                      className="input-premium py-2 !text-xs !bg-white/80" 
                      value={p.name} 
                      onChange={e => { let u = [...participants]; u[idx].name = e.target.value; setParticipants(u); }}
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Year</label>
                    <input 
                      className="input-premium py-2 !text-xs !bg-white/80" 
                      value={p.year} 
                      onChange={e => { let u = [...participants]; u[idx].year = e.target.value; setParticipants(u); }}
                    />
                  </div>
               </div>
            </div>
          ))}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 uppercase animate-shake">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2 border-t border-slate-200/50 pt-6">
          <button 
            disabled={isSaving || isGenerating}
            onClick={onClose} 
            className="px-6 py-3 rounded-xl border-2 border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            Close
          </button>
          <button 
            disabled={isSaving || isGenerating}
            onClick={handleSave}
            className="flex-1 bg-white/80 border-2 border-[var(--secondary-blue)] text-[var(--secondary-blue)] px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-50 transition-all backdrop-blur-sm"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            disabled={isSaving || isGenerating}
            onClick={handleGenerate}
            className="flex-1 btn-blue !py-3 text-xs uppercase font-bold tracking-widest shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            {isGenerating ? 'Processing...' : 'Generate Certificates'}
          </button>
        </div>
      </div>
    </div>
  );
}
