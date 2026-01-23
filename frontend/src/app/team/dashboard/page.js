'use client';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000');

export default function TeamDashboard() {
  const [timeLeft, setTimeLeft] = useState(86400);
  const [isPaused, setIsPaused] = useState(true);
  const [formattedTime, setFormattedTime] = useState('24:00:00');
  const [saveStatus, setSaveStatus] = useState('IDLE'); // IDLE, SAVING, SAVED, ERROR
  const [submission, setSubmission] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', 
    abstract: '', 
    problem: '', 
    solution: '', 
    architecture: '', 
    technologies: '', 
    impact: '', 
    outcome: ''
  });

  const lastSavedData = useRef(null);

  useEffect(() => {
    // Fetch initial profile/submission data
    fetchInitialData();

    socket.on('timerUpdate', (data) => {
      setTimeLeft(data.timeRemaining);
      setIsPaused(data.timerPaused);
      setFormattedTime(data.formattedTime);
    });

    socket.on('test_ended', () => {
      setIsPaused(true);
      autoSaveSubmission();
    });

    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (!isPaused) autoSaveSubmission();
    }, 30000);

    return () => {
      socket.off('timerUpdate');
      socket.off('test_ended');
      clearInterval(autoSaveInterval);
    };
  }, [isPaused]);

  const fetchInitialData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';
    try {
      const res = await axios.get(`${apiUrl}/team/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.submission) {
        setFormData(res.data.submission.content);
        setSubmission(res.data.submission);
        lastSavedData.current = JSON.stringify(res.data.submission.content);
      }
    } catch (err) { console.error(err); }
  };

  const autoSaveSubmission = async () => {
    if (JSON.stringify(formData) === lastSavedData.current) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';
    setSaveStatus('SAVING');
    try {
      await axios.post(`${apiUrl}/team/submission`, { content: formData }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSaveStatus('SAVED');
      lastSavedData.current = JSON.stringify(formData);
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    } catch (err) {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 5000);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-bg-light font-sans text-text-main">
      {/* System Status Header */}
      <nav className="bg-brand-navy text-white px-10 py-5 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-teal rounded flex items-center justify-center text-white font-bold">S</div>
          <span className="text-xl font-bold tracking-tight uppercase">Synthesis Portal</span>
        </div>
        
        <div className="flex items-center gap-10">
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              window.location.href = '/';
            }}
            className="text-[10px] font-black border border-white/20 px-4 py-2 rounded uppercase tracking-[2px] hover:bg-white/10 transition-all text-white/60 hover:text-white"
          >
            Institutional Logout
          </button>
          
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Temporal Sync</p>
            <p className={`text-2xl font-mono font-black ${timeLeft < 3600 ? 'text-rose-400' : 'text-brand-teal'}`}>
              {formattedTime}
            </p>
          </div>
          
          <div className="text-[10px] font-bold">
            {saveStatus === 'SAVING' && <span className="text-brand-teal animate-pulse">SYNCHRONIZING...</span>}
            {saveStatus === 'SAVED' && <span className="text-emerald-400">STATE SECURED ✓</span>}
            {saveStatus === 'ERROR' && <span className="text-rose-400">DATA CONFLICT!</span>}
            {saveStatus === 'IDLE' && <span className="text-gray-500">ENGINE IDLE</span>}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-12 px-6">
        {isPaused && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl mb-10 shadow-sm">
            <h3 className="font-bold text-amber-800 uppercase text-sm tracking-widest">Administrative Halt Active</h3>
            <p className="text-amber-700 text-sm mt-1">System inputs are currently locked by environment control. Please coordinate with the administration.</p>
          </div>
        )}

        <div className={`bg-white p-12 rounded-3xl shadow-sm border border-gray-100 ${isPaused ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
          <div className="flex justify-between items-end mb-12 border-b border-gray-100 pb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-brand-navy tracking-tighter uppercase">Project Synthesis</h2>
              <p className="text-gray-500 font-medium italic mt-1">Populate technical parameters to generate the professional deck.</p>
            </div>
            <div className="text-right flex items-center gap-4">
              {submission?.pptUrl && (
                <a 
                  href={`${process.env.NEXT_PUBLIC_PPT_URL || 'http://localhost:8000'}/outputs/${submission.pptUrl.split('/').pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black bg-emerald-500 text-white px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-2"
                >
                  Download Professional Deck ↓
                </a>
              )}
              <Link href="/team/pitch-generator" className="text-[10px] font-black bg-brand-teal text-white px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-brand-navy transition-all shadow-sm">
                Expert Pitch Generator ↗
              </Link>
              <span className="text-[10px] font-black bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full uppercase tracking-tighter">8 Modules Required</span>
            </div>
          </div>
          
          <div className="space-y-12">
            <div>
              <label className="label-caps">1. Synthesis Title</label>
              <input 
                className="input-field text-xl font-bold !border-0 !border-b-2 focus:!border-brand-teal rounded-none px-0" 
                placeholder="Formal Project Identification Name" 
                value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="label-caps">2. Abstract / Logic Summary</label>
                <textarea 
                  className="input-field min-h-[120px]" 
                  placeholder="Concise technical overview of the system..."
                  value={formData.abstract}
                  onChange={e => handleInputChange('abstract', e.target.value)}
                />
              </div>
              <div>
                <label className="label-caps">3. Problem Statement</label>
                <textarea 
                  className="input-field min-h-[120px]" 
                  placeholder="Identify the core inefficiency being addressed..."
                  value={formData.problem}
                  onChange={e => handleInputChange('problem', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="label-caps">4. Proposed Infrastructure (Solution)</label>
                <textarea 
                  className="input-field min-h-[120px]" 
                  placeholder="Architecture of the proposed intervention..."
                  value={formData.solution}
                  onChange={e => handleInputChange('solution', e.target.value)}
                />
              </div>
              <div>
                <label className="label-caps">5. System Architecture (Technical)</label>
                <textarea 
                  className="input-field min-h-[120px]" 
                  placeholder="Describe data flows, protocols, and hierarchies..."
                  value={formData.architecture}
                  onChange={e => handleInputChange('architecture', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <label className="label-caps font-black">6. Component Stack</label>
                <input 
                  className="input-field" 
                  placeholder="Tech used (comma separated)"
                  value={formData.technologies}
                  onChange={e => handleInputChange('technologies', e.target.value)}
                />
              </div>
              <div>
                <label className="label-caps font-black">7. Operational Impact</label>
                <input 
                  className="input-field" 
                  placeholder="Real-world system influence"
                  value={formData.impact}
                  onChange={e => handleInputChange('impact', e.target.value)}
                />
              </div>
              <div>
                <label className="label-caps font-black">8. Expected Output</label>
                <input 
                  className="input-field" 
                  placeholder="Final quantifiable metrics"
                  value={formData.outcome}
                  onChange={e => handleInputChange('outcome', e.target.value)}
                />
              </div>
            </div>

            <div className="pt-10">
              <button 
                onClick={autoSaveSubmission}
                className="w-full bg-brand-navy text-white font-extrabold py-5 rounded-xl hover:bg-brand-blue transition-all uppercase tracking-[4px] shadow-lg shadow-brand-navy/20"
              >
                Manual State Synchronization
              </button>
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase mt-4 tracking-widest">
                Engine auto-secures progress every 30 seconds.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}