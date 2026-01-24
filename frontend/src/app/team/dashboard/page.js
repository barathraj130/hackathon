'use client';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export default function TeamDashboard() {
  const [timeLeft, setTimeLeft] = useState(86400);
  const [isPaused, setIsPaused] = useState(true);
  const [formattedTime, setFormattedTime] = useState('24:00:00');
  const [saveStatus, setSaveStatus] = useState('IDLE'); 
  const [isGenerating, setIsGenerating] = useState(false);
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
  const socketRef = useRef(null);

  useEffect(() => {
    fetchInitialData();

    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('timerUpdate', (data) => {
      setTimeLeft(data.timeRemaining);
      setIsPaused(data.timerPaused);
      setFormattedTime(data.formattedTime);
    });

    socketRef.current.on('test_ended', () => {
      setIsPaused(true);
      autoSaveSubmission();
    });

    // Auto-save every 30 seconds
    const autoSaveInterval = setInterval(() => {
      if (!isPaused) autoSaveSubmission();
    }, 30000);

    return () => {
      socketRef.current?.disconnect();
      clearInterval(autoSaveInterval);
    };
  }, [isPaused]);

  const fetchInitialData = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/team/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.submission) {
        setFormData(res.data.submission.content || formData);
        setSubmission(res.data.submission);
        lastSavedData.current = JSON.stringify(res.data.submission.content);
      }
    } catch (err) { console.error(err); }
  };

  const autoSaveSubmission = async (isManual = false) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    setSaveStatus('SAVING');
    
    // Manual sync skips the equality check to be absolutely sure
    if (!isManual && JSON.stringify(formData) === lastSavedData.current) {
      setTimeout(() => {
        setSaveStatus('SAVED');
        setTimeout(() => setSaveStatus('IDLE'), 3000);
      }, 500);
      return;
    }

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

  const handleGenerateStandardPPT = async () => {
    setIsGenerating(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
       const res = await axios.post(`${apiUrl}/team/generate-ppt`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Professional Deck synthesized successfully. Check Artifacts section.");
      fetchInitialData();
    } catch (err) {
      const msg = err.response?.data?.error || "Synthesis Engine failure. Ensure all logic modules are populated.";
      alert(`Synthesis Error: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-bg-light font-sans text-slate-800">
      {/* Premium Header */}
      <nav className="sticky top-0 z-50 glass-pane border-b border-gray-100 flex justify-between items-center px-10 py-5">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-navy rounded-xl flex items-center justify-center text-white font-black shadow-xl shadow-navy/20">H</div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black uppercase tracking-widest text-navy leading-none">hack@jit</h1>
            <p className="text-[9px] font-bold text-teal uppercase tracking-[0.2em] mt-1">Institutional Access: JIT</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="text-right hidden xs:block">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Temporal sync</p>
            <p className={`text-xl md:text-2xl font-mono font-black tabular-nums transition-colors ${timeLeft < 3600 ? 'text-rose-500 animate-pulse' : 'text-navy'}`}>
              {formattedTime}
            </p>
          </div>

          <div className="h-10 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex flex-col items-center hidden sm:flex">
            {saveStatus === 'SAVING' && <span className="text-[10px] font-black text-teal animate-pulse uppercase tracking-widest">Saving...</span>}
            {saveStatus === 'SAVED' && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Secured ✓</span>}
            {saveStatus === 'ERROR' && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Sync Error</span>}
            {saveStatus === 'IDLE' && <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sync Idle</span>}
          </div>

          <div className="w-10 h-10 md:w-12 md:h-12 relative">
            <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              window.location.href = '/';
            }}
            className="btn-ghost !px-4 !py-2 md:!px-6 md:!py-2.5 rounded-lg border-slate-200 text-[9px] md:text-[10px]"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 md:py-12 px-6 md:px-10 gap-10 grid grid-cols-1 lg:grid-cols-12 items-start">
        
        {/* Left Column: Input Form */}
        <div className="lg:col-span-8 space-y-8 animate-fade-in">
          {isPaused && (
            <div className="bg-amber-500 text-white p-6 rounded-[2rem] shadow-2xl shadow-amber-500/20 flex items-center gap-6">
              <span className="text-4xl text-white/50">⚡</span>
              <div>
                <h3 className="font-black uppercase text-sm tracking-widest">Environment Locked</h3>
                <p className="text-xs font-medium text-white/80 mt-0.5 uppercase tracking-wide">Infrastructure is currently under administrative maintenance.</p>
              </div>
            </div>
          )}

          <div className={`glass-pane p-12 rounded-[2.5rem] transition-all duration-500 ${isPaused ? 'opacity-30 pointer-events-none grayscale blur-sm scale-[0.98]' : ''}`}>
            <div className="flex flex-col gap-2 mb-12">
               <h2 className="text-4xl font-black text-navy tracking-tighter uppercase leading-none">Architecture Synthesis</h2>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Module Configuration System v4.0</p>
            </div>

            <div className="space-y-12">
              <div className="group">
                <label className="label-caps !text-teal">01. Central Logic Identity</label>
                <input 
                  className="w-full text-3xl font-black text-navy border-b-4 border-slate-100 focus:border-teal bg-transparent outline-none transition-all py-2 placeholder:text-slate-200" 
                  placeholder="System Official Name" 
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="label-caps">02. Abstract (Internal Flow)</label>
                  <textarea 
                    className="input-field min-h-[160px] !bg-slate-50/50 !border-slate-100 focus:!bg-white" 
                    placeholder="Provide detailed project summary..."
                    value={formData.abstract}
                    onChange={e => handleInputChange('abstract', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-caps">03. Target Inefficiency</label>
                  <textarea 
                    className="input-field min-h-[160px] !bg-slate-50/50 !border-slate-100 focus:!bg-white" 
                    placeholder="What problem does the system resolve?"
                    value={formData.problem}
                    onChange={e => handleInputChange('problem', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <label className="label-caps">04. Strategic Solution</label>
                  <textarea 
                    className="input-field min-h-[160px] !bg-slate-50/50 !border-slate-100 focus:!bg-white" 
                    placeholder="Deployment methodology..."
                    value={formData.solution}
                    onChange={e => handleInputChange('solution', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-caps">05. Data Hierarchies</label>
                  <textarea 
                    className="input-field min-h-[160px] !bg-slate-50/50 !border-slate-100 focus:!bg-white" 
                    placeholder="System architecture and protocols..."
                    value={formData.architecture}
                    onChange={e => handleInputChange('architecture', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-pane !p-6 !bg-white/40 !rounded-3xl border-slate-100">
                  <label className="label-caps">06. Tech Stack</label>
                  <input className="input-field !bg-white border-none shadow-sm" placeholder="Component comma list" value={formData.technologies} onChange={e => handleInputChange('technologies', e.target.value)} />
                </div>
                <div className="glass-pane !p-6 !bg-white/40 !rounded-3xl border-slate-100">
                  <label className="label-caps">07. System Impact</label>
                  <input className="input-field !bg-white border-none shadow-sm" placeholder="Global influence" value={formData.impact} onChange={e => handleInputChange('impact', e.target.value)} />
                </div>
                <div className="glass-pane !p-6 !bg-white/40 !rounded-3xl border-slate-100">
                  <label className="label-caps">08. Final Metric</label>
                  <input className="input-field !bg-white border-none shadow-sm" placeholder="Quantifiable result" value={formData.outcome} onChange={e => handleInputChange('outcome', e.target.value)} />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => autoSaveSubmission(true)}
                  disabled={saveStatus === 'SAVING'}
                  className="w-full bg-navy text-white text-[11px] font-black py-6 rounded-[2rem] tracking-[0.4em] uppercase hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-navy/30 flex items-center justify-center gap-4 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saveStatus === 'SAVING' ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-teal" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Synchronizing State...
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-teal rounded-full animate-ping"></span>
                      Manual Pulse Force Sync
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Control & Artifacts */}
        <div className="lg:col-span-4 space-y-8 sticky top-32 animate-fade-in delay-200">
          
          {/* Synthesis Trigger */}
          <div className="dashboard-card !bg-navy !border-none text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-teal mb-4">Synthesis Engine</h3>
              <p className="text-sm font-medium text-slate-300 leading-relaxed mb-8">
                Convert live logic parameters into professional artifacts. Ensure all data modules are synchronized before initializing.
              </p>
              
              <div className="space-y-4">
                <button 
                  onClick={handleGenerateStandardPPT}
                  disabled={isGenerating || isPaused}
                  className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${isGenerating ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-teal text-white hover:bg-white hover:text-navy group'}`}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Synthesizing...
                    </span>
                  ) : 'Generate Professional Deck'}
                </button>

                <Link 
                  href="/team/pitch-generator"
                  className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/20 text-white hover:bg-white/10 transition-all flex items-center justify-center"
                >
                  Expert Pitch Synthesis ↗
                </Link>
              </div>
            </div>
          </div>

          {/* Artifact Repository */}
          <div className="glass-pane p-8 rounded-[2rem]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6">Generated Artifacts</h3>
            
            {submission?.pptUrl ? (
              <div className="space-y-4">
                <a 
                  href={`${process.env.NEXT_PUBLIC_PPT_URL || 'http://localhost:8000'}/outputs/${submission.pptUrl.split('/').pop()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-5 bg-emerald-50 border border-emerald-100 rounded-2xl transition-all hover:bg-emerald-100"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white text-xl">📄</div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Project_Artifact.pptx</p>
                      <p className="text-[9px] font-bold text-emerald-600/60 uppercase mt-0.5">Application/VND.PowerPoint</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 group-hover:translate-y-1 transition-transform">↓</span>
                </a>
              </div>
            ) : (
              <div className="text-center py-10 opacity-30">
                <div className="text-3xl mb-3">📁</div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]">No artifacts found in repository</p>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="p-8 border border-white rounded-[2rem] bg-white/40">
             <h4 className="text-[9px] font-black uppercase tracking-widest text-navy mb-4 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-teal rounded-full"></span> 
               Synthesis Protocols
             </h4>
             <ul className="space-y-3">
               {['Minimum 8 Technical Modules', 'Verified System Architecture', 'Synchronized Infrastructure'].map((rule, i) => (
                 <li key={i} className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                   <div className="w-1 h-1 bg-slate-200 rounded-full"></div> {rule}
                 </li>
               ))}
             </ul>
          </div>

        </div>
      </main>
    </div>
  );
}