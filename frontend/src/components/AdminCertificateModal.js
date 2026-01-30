'use client';
import { useState } from 'react';
import axios from 'axios';

export default function AdminCertificateModal({ isOpen, onClose, teamId, teamName, apiUrl, onComplete }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/admin/generate-team-certificates`, { teamId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate certificates.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
      <div className="card-premium w-full max-w-md space-y-6 shadow-2xl border-blue-100">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Generate Certificates</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>
        
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-medium">
            You are about to generate certificates for <span className="font-bold text-slate-800">{teamName}</span>. 
            This will process all recorded participants for this team.
          </p>
          
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] font-bold text-rose-600 uppercase">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            disabled={isGenerating}
            onClick={onClose} 
            className="flex-1 px-6 py-3 rounded-xl border-2 border-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            Cancel
          </button>
          <button 
            disabled={isGenerating}
            onClick={handleGenerate}
            className="flex-1 btn-blue !py-3 text-xs uppercase font-bold tracking-widest disabled:opacity-50"
          >
            {isGenerating ? 'Processing...' : 'Generate Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
