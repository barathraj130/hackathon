'use client';
import SubmissionWorkflowModal from '@/components/SubmissionWorkflowModal';
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
  const [activeTab, setActiveTab] = useState('slides'); // 'slides' or 'problem'
  const [problemStatement, setProblemStatement] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  
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
    console.log("🔄 Synchronizing system states...");
    try {
      const res = await axios.get(`${apiUrl}/team/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const teamData = res.data;
      if (teamData?.submission) {
        console.log("✅ Artifact Synced:", teamData.submission.pptUrl);
        setSubmission(teamData.submission);
        if (teamData.submission.content?.slides) {
          setFormData(teamData.submission.content);
          lastSavedData.current = JSON.stringify(teamData.submission.content);
        }
      } else {
        console.log("⚠️ No submission record found.");
      }
      
      if (teamData?.problemStatement) {
        setProblemStatement(teamData.problemStatement);
      }
    } catch (err) { 
      console.error("❌ Link synchronization failure:", err); 
    }
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
      slides: prev.slides.map(s => s.id === id ? { ...s, content: value } : s)
    }));
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
          {problemStatement && (
            <div className="bg-indigo-600 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200">Admin Allotted Challenge</span>
                      <h3 className="text-3xl font-black uppercase tracking-tighter mt-2">{problemStatement.title}</h3>
                    </div>
                    <div className="text-right">
                       <span className="text-sm font-black bg-white/20 px-4 py-2 rounded-full tabular-nums">Q.{problemStatement.questionNo}</span>
                       <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mt-2">{problemStatement.subDivisions || 'Main division'}</p>
                    </div>
                 </div>
                 <p className="text-lg font-medium text-indigo-50 leading-relaxed max-w-3xl">
                   {problemStatement.description}
                 </p>
               </div>
            </div>
          )}

          <div className="glass-pane p-12 rounded-[2.5rem] bg-white border-0 shadow-2xl shadow-navy/5">
            <div className="max-w-2xl">
              <span className="text-[10px] font-black text-teal uppercase tracking-[0.4em] mb-4 block">Operation Protocol</span>
              <h2 className="text-4xl font-black text-navy tracking-tighter uppercase leading-tight mb-6">Create Your Professional <br/>Venture Artifacts</h2>
              <p className="text-slate-500 font-medium text-base leading-relaxed mb-10">
                The institutional standard requires a strict, guided synthesis process. Use the **Expert Venture Journey** engine to build your 15-slide pitch deck following a strict slide-by-slide design thinking workflow.
              </p>
              
              <Link 
                href="/team/pitch-generator" 
                className="inline-flex items-center gap-6 bg-navy text-white px-10 py-6 rounded-2xl font-black uppercase text-[11px] tracking-[0.4em] hover:shadow-2xl shadow-navy/30 transition-all hover:-translate-y-1 active:scale-95 group"
              >
                <span>Initialize Venture Journey</span>
                <span className="w-8 h-px bg-teal group-hover:w-12 transition-all"></span>
              </Link>
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Submission Status</h3>
              <button 
                onClick={fetchInitialData}
                className="text-[9px] font-bold text-teal uppercase hover:underline"
              >
                Sync ⟳
              </button>
            </div>
            
            {submission?.pptUrl ? (
              <div className="space-y-3">
                {/* PPT Generated */}
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">✓</div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">PPT Generated</p>
                    <p className="text-[8px] text-emerald-600/60 uppercase mt-0.5">Presentation Created</p>
                  </div>
                </div>

                {/* Prototype Submitted */}
                {submission.prototypeUrl ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">✓</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Prototype Submitted</p>
                      <p className="text-[8px] text-emerald-600/60 uppercase mt-0.5 truncate">{submission.prototypeUrl}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-white text-sm">⏳</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Prototype Pending</p>
                      <p className="text-[8px] text-amber-600/60 uppercase mt-0.5">Submit your prototype link</p>
                    </div>
                  </div>
                )}

                {/* Certificate Info */}
                {submission.certificateName ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">✓</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Certificate Details</p>
                      <p className="text-[8px] text-emerald-600/60 uppercase mt-0.5">{submission.certificateName}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="w-8 h-8 bg-slate-300 rounded-lg flex items-center justify-center text-white text-sm">○</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Certificate Pending</p>
                      <p className="text-[8px] text-slate-400 uppercase mt-0.5">Complete prototype first</p>
                    </div>
                  </div>
                )}

                {/* Locked Status */}
                {submission.status === 'LOCKED' && (
                  <div className="mt-4 p-4 bg-navy/5 border border-navy/10 rounded-xl text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-navy">🔒 Submission Locked</p>
                    <p className="text-[8px] text-slate-500 mt-1">Contact admin for changes</p>
                  </div>
                )}

                {/* Direct Download Link */}
                <a 
                  href={submission.pptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 flex items-center justify-center gap-3 w-full py-4 bg-navy text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-teal transition-all shadow-xl shadow-navy/20"
                >
                  <span>Download Artifact</span>
                  <span className="text-base text-teal">↓</span>
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

      {/* Technical Diagnostic Overlay (Temporary) */}
      <div className="max-w-7xl mx-auto px-10 pb-10 opacity-30 hover:opacity-100 transition-opacity">
        <details className="cursor-pointer">
          <summary className="text-[8px] font-black uppercase tracking-widest text-slate-400">Vault Diagnostic Tools</summary>
          <div className="mt-4 p-6 bg-navy text-teal-400 rounded-2xl font-mono text-[9px] overflow-auto max-h-[300px]">
             <p className="mb-2 uppercase border-b border-teal-400/20 pb-2">Technical Handshake Summary</p>
             <pre>{JSON.stringify({ 
               status: submission?.status || 'N/A',
               ppt: submission?.pptUrl || 'NULL',
               hasSubmission: !!submission,
               syncTime: new Date().toLocaleTimeString()
             }, null, 2)}</pre>
          </div>
        </details>
      </div>

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
