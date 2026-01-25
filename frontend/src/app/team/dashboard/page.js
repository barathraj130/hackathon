'use client';
import SubmissionWorkflowModal from '@/components/SubmissionWorkflowModal';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function TeamDashboard() {
  const [timeLeft, setTimeLeft] = useState(86400);
  const [isPaused, setIsPaused] = useState(false);
  const [formattedTime, setFormattedTime] = useState('24:00:00');
  const [saveStatus, setSaveStatus] = useState('IDLE'); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('slides'); // 'slides' or 'problem'
  const [problemStatement, setProblemStatement] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    slides: [
      { id: 'S1', title: 'Organizational Identity', content: '', label: 'Slide 01' },
      { id: 'S2', title: 'Problem Statement (Candidate View)', content: '', label: 'Slide 02' },
      { id: 'S3', title: 'Proposed Solution', content: '', label: 'Slide 03' },
      { id: 'S4', title: 'Target Stakeholders', content: '', label: 'Slide 04' },
      { id: 'S5', title: 'Existing Limitations', content: '', label: 'Slide 05' },
      { id: 'S6', title: 'Key Functional Features', content: '', label: 'Slide 06' },
      { id: 'S7', title: 'Industry / Market Segment', content: '', label: 'Slide 07' },
      { id: 'S8', title: 'Competitive Landscape', content: '', label: 'Slide 08' },
      { id: 'S9', title: 'Economic Model (Total Cost)', content: '', label: 'Slide 09' },
      { id: 'S10', title: 'Projected Impact', content: '', label: 'Slide 10' },
      { id: 'S11', title: 'Technology Stack', content: '', label: 'Slide 11' },
      { id: 'S12', title: 'System Architecture', content: '', label: 'Slide 12' },
      { id: 'S13', title: 'Validation & Evidence', content: '', label: 'Slide 13' },
      { id: 'S14', title: 'Conclusion & Outlook', content: '', label: 'Slide 14' }
    ]
  });

  const formDataRef = useRef(formData);
  const isPausedRef = useRef(isPaused);
  const lastSavedData = useRef(null);
  const socketRef = useRef(null);

  // Sync refs with state
  useEffect(() => {
    formDataRef.current = formData;
    isPausedRef.current = isPaused;
  }, [formData, isPaused]);

  useEffect(() => {
    fetchInitialData();

    let socket;
    
    // Dynamic import to ensure client-side only
    import('socket.io-client').then((module) => {
      const socketIO = module.default || module.io;
      if (!socketIO) return;

      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
      socket = socketIO(socketUrl);
      socketRef.current = socket;

      socket.on('timerUpdate', (data) => {
        setTimeLeft(data.timeRemaining);
        setIsPaused(data.timerPaused);
        setFormattedTime(data.formattedTime);
      });
    });

    // Auto-save interval - Accessing latest state via Refs to avoid stale closures
    const autoSaveInterval = setInterval(() => {
      if (!isPausedRef.current) {
        autoSaveSubmission();
      }
    }, 30000);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(autoSaveInterval);
    };
  }, []); 

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-screen bg-bg-light animate-pulse" />;

  async function fetchInitialData() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    console.log("🔄 Synchronizing system states...");
    try {
      const res = await axios.get(`${apiUrl}/team/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const teamData = res.data;
      if (teamData?.submission) {
        setSubmission(teamData.submission);
        if (teamData.submission.content?.slides) {
          setFormData(teamData.submission.content);
          lastSavedData.current = JSON.stringify(teamData.submission.content);
        }
      }
      
      if (teamData?.problemStatement) {
        setProblemStatement(teamData.problemStatement);
      }
    } catch (err) { 
      console.error("❌ Link synchronization failure:", err); 
    }
  }

  async function autoSaveSubmission(isManual = false) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    
    // Always use REF data for interval-based saves to ensure we have the absolute latest
    const currentData = formDataRef.current;
    if (!isManual && isPausedRef.current) return;

    setSaveStatus('SAVING');
    
    // Check if data has actually changed
    const currentDataStr = JSON.stringify(currentData);
    if (!isManual && currentDataStr === lastSavedData.current) {
      setTimeout(() => {
        setSaveStatus('SAVED');
        setTimeout(() => setSaveStatus('IDLE'), 3000);
      }, 500);
      return;
    }

    try {
      await axios.post(`${apiUrl}/team/submission`, { content: currentData }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSaveStatus('SAVED');
      lastSavedData.current = currentDataStr;
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    } catch (err) {
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 5000);
    }
  }

  const handleGenerateStandardPPT = async () => {
    setIsGenerating(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
       const res = await axios.post(`${apiUrl}/team/generate-ppt`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log("📥 Synthesis Response:", res.data);
      if (res.data.submission) {
        setSubmission(res.data.submission);
      }
      // Show workflow modal for prototype and certificate submission
      setShowWorkflowModal(true);
      // Force immediate refresh to secondary verify
      await fetchInitialData();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Synthesis Engine failure.";
      console.error("Synthesis Error Details:", err.response?.data);
      alert(`Synthesis Error: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (id, value) => {
    setFormData(prev => ({
      ...prev,
      slides: Array.isArray(prev.slides) ? prev.slides.map(s => s.id === id ? { ...s, content: value } : s) : []
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (isPaused) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-10 text-center font-sans tracking-tight">
        <div className="max-w-2xl animate-fade-in">
           <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-5xl mb-10 mx-auto border border-white/10 shadow-2xl relative">
              <span className="animate-pulse">⏳</span>
              <div className="absolute inset-0 bg-teal/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
           </div>
           
           <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Hackathon Paused</h2>
           <p className="text-teal font-black text-[10px] uppercase tracking-[0.5em] mb-12 opacity-80">Standby for Admin Authorization</p>
           
           <div className="p-12 glass-pane rounded-[3.5rem] border-white/10 bg-white/5 text-white/90 shadow-2xl">
             <p className="text-xl font-medium leading-relaxed">
               "The session has been paused by the administrator. <br/> 
               <span className="text-teal font-black uppercase text-sm tracking-widest mt-4 block">Don't worry, all your work is safely saved.</span> <br/>
               Access will be restored once the timer resumes."
             </p>
           </div>
           
           <button 
             onClick={handleLogout} 
             className="mt-16 text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-all group flex items-center gap-4 mx-auto"
           >
             <span className="w-8 h-px bg-current group-hover:w-12 transition-all"></span>
             Terminate Session
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800">
      {/* Premium Header - Futuristic Compact */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 flex flex-col md:flex-row justify-between items-center px-4 md:px-8 py-3 md:py-4 gap-4 shadow-sm">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#020617] rounded-xl flex items-center justify-center text-white font-black shadow-lg text-sm">H</div>
            <div className="hidden sm:block">
              <h1 className="text-sm md:text-base font-black uppercase tracking-tight text-[#020617] leading-none">hack@jit</h1>
              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1 opacity-70">Institutional Node</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:hidden">
             <button onClick={handleLogout} className="text-[10px] font-black uppercase text-rose-500">Exit System</button>
          </div>
        </div>

        <div className="flex items-center justify-center md:justify-end gap-6 w-full md:w-auto">
          <div className="text-center md:text-right">
            <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest">Temporal Clock</p>
            <p className={`text-base md:text-xl font-mono font-black tabular-nums transition-colors ${timeLeft < 3600 ? 'text-rose-500 animate-pulse' : 'text-[#020617]'}`}>
              {formattedTime}
            </p>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex flex-col items-center hidden sm:flex">
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              saveStatus === 'SAVING' ? 'text-teal-500 animate-pulse' : 
              saveStatus === 'SAVED' ? 'text-emerald-500' : 
              saveStatus === 'ERROR' ? 'text-rose-500' : 'text-slate-300'
            }`}>
              {saveStatus === 'SAVING' ? 'Saving Node...' : 
               saveStatus === 'SAVED' ? 'State Secured ✓' : 
               saveStatus === 'ERROR' ? 'Sync Failure' : 'Sync Active'}
            </span>
          </div>

          <div className="w-9 h-9 relative hidden md:block">
            <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <button 
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-[#020617] hover:text-[#020617] transition-all hidden md:block"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto py-6 md:py-8 px-4 md:px-8 gap-6 grid grid-cols-1 lg:grid-cols-12 items-start">
        
        {/* Left Column: Input Form */}
        <div className="lg:col-span-8 space-y-6 animate-fade-in">
          {problemStatement && (
            <div className="bg-[#4f46e5] text-white p-6 md:p-8 rounded-2xl shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
               <div className="relative z-10">
                 <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                     <div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100/80">Active challenge</span>
                       <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-2 leading-none italic">{problemStatement.title}</h3>
                    </div>
                    <div className="text-left md:text-right flex items-center gap-3">
                       <span className="text-xs font-black bg-white/20 px-3 py-1.5 rounded-lg tabular-nums">Q.{problemStatement.questionNo}</span>
                       <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest">{problemStatement.subDivisions || 'Primary'}</p>
                    </div>
                 </div>
                  <p className="text-sm md:text-base font-medium text-indigo-50/90 leading-relaxed max-w-4xl">
                   {problemStatement.description}
                  </p>
               </div>
            </div>
          )}

           <div className="bg-white p-8 md:p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="max-w-2xl text-center md:text-left relative z-10">
              <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-4 block">Operation Protocol</span>
              <h2 className="text-2xl md:text-4xl font-black text-[#020617] tracking-tighter uppercase leading-none mb-6 italic">Engineering the Future</h2>
              <p className="text-slate-500 font-bold text-sm md:text-base leading-relaxed mb-8 opacity-80 uppercase tracking-tight">
                From concept to deployment — faster, smarter, stronger. JIT’s official innovation engine enabling teams to build, validate, and launch production-ready solutions.
              </p>
              
              <Link 
                href={submission?.canRegenerate === false ? '#' : "/team/pitch-generator"} 
                className={`inline-flex items-center gap-4 px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all group ${
                  submission?.canRegenerate === false 
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed pointer-events-none' 
                    : 'bg-[#020617] text-white hover:shadow-2xl hover:-translate-y-0.5'
                }`}
              >
                <span>{submission?.canRegenerate === false ? 'Artifact Registry Locked' : 'Initialize Innovation Engine'}</span>
                {submission?.canRegenerate !== false && <span className="w-6 h-px bg-teal-400 group-hover:w-10 transition-all"></span>}
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Control & Artifacts */}
        <div className="lg:col-span-4 space-y-6 sticky top-24 animate-fade-in delay-200">
          
          {/* Synthesis Trigger */}
           <div className="bg-[#020617] p-6 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
            <div className="relative z-10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-4">Synthesis Engine</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
                Generate professional artifacts from live logic modules.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={handleGenerateStandardPPT}
                  disabled={isGenerating || isPaused || submission?.canRegenerate === false}
                  className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${
                    isGenerating || submission?.canRegenerate === false 
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed' 
                      : 'bg-teal-500 text-white hover:bg-white hover:text-[#020617] shadow-lg shadow-teal-500/10'
                  }`}
                >
                  {isGenerating ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : submission?.canRegenerate === false ? 'Vault Locked' : 'Synthesize Professional Deck'}
                </button>

                <Link 
                  href={submission?.canRegenerate === false ? '#' : "/team/pitch-generator"}
                  className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all flex items-center justify-center ${
                    submission?.canRegenerate === false
                      ? 'border-white/5 text-white/5 cursor-not-allowed pointer-events-none'
                      : 'border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  {submission?.canRegenerate === false ? 'System Locked' : 'Modular Pulse Engine ↗'}
                </Link>
              </div>
            </div>
          </div>

          {/* Artifact Repository */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vault status</h3>
              <button 
                onClick={fetchInitialData}
                className="text-[9px] font-black text-teal-600 uppercase tracking-widest hover:underline"
              >
                Sync ⟳
              </button>
            </div>
            
            {submission?.pptUrl ? (
              <div className="space-y-2">
                {[
                  { label: 'Artifact Generated', active: true, value: 'PPT_MASTER_V4' },
                  { label: 'Prototype Linked', active: !!submission.prototypeUrl, value: submission.prototypeUrl || 'Pending' },
                  { label: 'Authentication', active: !!submission.certificateName, value: submission.certificateName || 'Scanning' }
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${item.active ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] ${item.active ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                      {item.active ? '✓' : '○'}
                    </div>
                    <div className="flex-1 truncate">
                      <p className={`text-[9px] font-black uppercase tracking-widest ${item.active ? 'text-emerald-700' : 'text-slate-400'}`}>{item.label}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase truncate">{item.value}</p>
                    </div>
                  </div>
                ))}

                <a 
                  href={submission.pptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-[#020617] text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 transition-all shadow-lg"
                >
                  Download Artifact ↓
                </a>
              </div>
            ) : (
              <div className="text-center py-6 opacity-20">
                <div className="text-2xl mb-2">📁</div>
                <p className="text-[8px] font-bold uppercase tracking-widest">Repository Empty</p>
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="p-6 border border-slate-200 rounded-2xl bg-white/50 backdrop-blur-sm">
             <h4 className="text-[9px] font-black uppercase tracking-widest text-[#020617] mb-4 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span> 
               Protocols
             </h4>
             <ul className="space-y-2">
               {['Min 8 Modules', 'Technical Architecture', 'Validation Evidence'].map((rule, i) => (
                 <li key={i} className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1 h-px bg-slate-300"></div> {rule}
                 </li>
               ))}
             </ul>
          </div>

        </div>
      </main>


      {/* Submission Workflow Modal */}
      <SubmissionWorkflowModal
        isOpen={showWorkflowModal}
        onClose={() => setShowWorkflowModal(false)}
        onComplete={() => {
          fetchInitialData();
          setShowWorkflowModal(false);
        }}
        apiUrl={process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1'}
      />
    </div>
  );
}
