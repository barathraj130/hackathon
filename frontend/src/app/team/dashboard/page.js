'use client';
import PostHackathonCertificateModal from '@/components/PostHackathonCertificateModal';
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
  const [teamData, setTeamData] = useState(null);
  const [problemStatement, setProblemStatement] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
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

  useEffect(() => {
    formDataRef.current = formData;
    isPausedRef.current = isPaused;
  }, [formData, isPaused]);

  useEffect(() => {
    fetchInitialData();
    import('socket.io-client').then((module) => {
      const socketIO = module.default || module.io;
      if (!socketIO) return;
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
      const socket = socketIO(socketUrl);
      socketRef.current = socket;
      socket.on('timerUpdate', (data) => {
        setTimeLeft(data.timeRemaining);
        setIsPaused(data.timerPaused);
        setFormattedTime(data.formattedTime);
      });
    });
    const autoSaveInterval = setInterval(() => { if (!isPausedRef.current) autoSaveSubmission(); }, 30000);
    return () => { if (socketRef.current) socketRef.current.disconnect(); clearInterval(autoSaveInterval); };
  }, []); 

  useEffect(() => { setMounted(true); }, []);

  async function fetchInitialData() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/team/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeamData(res.data);
      if (res.data?.submission) {
        setSubmission(res.data.submission);
        if (res.data.submission.content?.slides) {
          setFormData(res.data.submission.content);
          lastSavedData.current = JSON.stringify(res.data.submission.content);
        }
      }
      if (res.data?.problemStatement) setProblemStatement(res.data.problemStatement);
      
      if (res.data?.config?.allowCertificateDetails && (!res.data.submission?.certificates || res.data.submission.certificates.length === 0)) {
         setShowCertModal(true);
      }
    } catch (err) { console.error(err); }
  }

  async function autoSaveSubmission(isManual = false) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    const currentData = formDataRef.current;
    if (!isManual && isPausedRef.current) return;
    setSaveStatus('SAVING');
    const currentDataStr = JSON.stringify(currentData);
    if (!isManual && currentDataStr === lastSavedData.current) {
      setTimeout(() => { setSaveStatus('SAVED'); setTimeout(() => setSaveStatus('IDLE'), 3000); }, 500);
      return;
    }
    try {
      await axios.post(`${apiUrl}/team/submission`, { content: currentData }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSaveStatus('SAVED');
      lastSavedData.current = currentDataStr;
      setTimeout(() => setSaveStatus('IDLE'), 3000);
    } catch (err) { setSaveStatus('ERROR'); setTimeout(() => setSaveStatus('IDLE'), 5000); }
  }

  const handleGenerateStandardPPT = async () => {
    setIsGenerating(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
       const res = await axios.post(`${apiUrl}/team/generate-ppt`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.submission) setSubmission(res.data.submission);
      setShowWorkflowModal(true);
      await fetchInitialData();
    } catch (err) { alert(`Synthesis Error: ${err.response?.data?.error || err.message}`); } finally { setIsGenerating(false); }
  };

  if (!mounted) return <div className="min-h-screen bg-[#f1f5f9] animate-pulse" />;
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <>
      {isPaused ? (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-10 text-center font-sans tracking-tight">
          <div className="max-w-2xl animate-fade-in text-white">
             <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Hackathon Paused</h2>
             <p className="text-teal-400 font-bold uppercase tracking-widest mb-12">Standby for Authorization</p>
             <button onClick={handleLogout} className="px-8 py-4 bg-white/10 rounded-xl font-black uppercase tracking-widest hover:bg-white/20 transition-all">Terminate session</button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800">
          <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 flex justify-between items-center px-8 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#020617] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg">H</div>
              <div><h1 className="text-sm font-black uppercase tracking-tight text-[#020617] leading-none">hack@jit</h1><p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">Institutional Node</p></div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right"><p className="text-[8px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Temporal Clock</p><p className={`text-xl font-mono font-black tabular-nums ${timeLeft < 3600 ? 'text-rose-500 animate-pulse' : 'text-[#020617]'}`}>{formattedTime}</p></div>
              <div className="w-9 h-9"><img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" /></div>
              <button onClick={handleLogout} className="px-5 py-2 rounded-lg border-2 border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-[#020617] hover:text-[#020617] transition-all">Logout</button>
            </div>
          </nav>

          <main className="max-w-[1400px] mx-auto py-8 px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6 animate-fade-in">
              {problemStatement && (
                <div className="bg-[#4f46e5] text-white p-8 rounded-[2rem] shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
                   <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1"><span className="text-[10px] font-black uppercase tracking-widest text-indigo-100/80">Active challenge</span><h3 className="text-2xl font-black uppercase tracking-tight mt-2 italic leading-tight">{problemStatement.title}</h3><p className="text-sm font-medium mt-4 text-indigo-50/90 leading-relaxed">{problemStatement.description}</p></div>
                      <div className="bg-white/20 px-4 py-2 rounded-xl text-center"><p className="text-[9px] font-black uppercase tracking-widest">Question</p><p className="text-xl font-black tabular-nums">{problemStatement.questionNo}</p></div>
                   </div>
                </div>
              )}
               <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="max-w-xl relative z-10 space-y-6">
                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Operation Protocol</span>
                  <h2 className="text-4xl font-black text-[#020617] tracking-tighter uppercase leading-tight italic">Engineering the Future</h2>
                  <p className="text-slate-500 font-bold text-base leading-relaxed opacity-80 uppercase tracking-tight">Construct professional pitch decks through modular intelligence synthesis. Our engine transforms your code and logic into investor-ready artifacts.</p>
                  <Link href={submission?.canRegenerate === false ? '#' : "/team/pitch-generator"} className={`inline-flex items-center gap-6 px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${submission?.canRegenerate === false ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-[#020617] text-white hover:bg-teal-500 hover:shadow-2xl active:scale-95'}`}>
                    <span>{submission?.canRegenerate === false ? 'System Locked' : 'Initialize Synthesis Engine →'}</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6 sticky top-28 animate-fade-in">
               <div className="bg-indigo-600 p-8 rounded-3xl border border-indigo-500 shadow-2xl text-white space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Synthesis Engine</h3>
                <div className="space-y-4">
                    <button onClick={handleGenerateStandardPPT} disabled={isGenerating || submission?.canRegenerate === false} className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${isGenerating || submission?.canRegenerate === false ? 'bg-indigo-800 text-indigo-400 cursor-not-allowed' : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl'}`}>
                      {isGenerating ? 'Synthesizing...' : submission?.canRegenerate === false ? 'Vault Locked' : 'Generate PPT Artifact'}
                    </button>
                    {teamData?.config?.allowCertificateDetails && (
                       <button onClick={() => setShowCertModal(true)} className="w-full py-5 border-2 border-indigo-400 rounded-2xl font-black uppercase text-[10px] tracking-widest text-indigo-100 hover:bg-indigo-700 transition-all">Configure Certificates 🎓</button>
                    )}
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between"><h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Repository Status</h3><button onClick={fetchInitialData} className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Sync ⟳</button></div>
                {submission?.pptUrl ? (
                  <div className="space-y-4">
                     <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4"><div className="w-10 h-10 bg-emerald-500 text-white flex items-center justify-center rounded-xl text-lg">✓</div><div className="flex-1"><p className="text-[10px] font-black uppercase text-emerald-700">Deck Secured</p><p className="text-[8px] font-bold text-slate-400 uppercase">ARTIFACT_V17_FINAL</p></div></div>
                     <a href={submission.pptUrl} target="_blank" rel="noopener noreferrer" className="w-full py-4 bg-[#020617] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 transition-all text-center block shadow-lg">Download Deck ↓</a>
                  </div>
                ) : <div className="text-center py-10 opacity-20"><div className="text-4xl mb-2">📂</div><p className="text-[10px] font-black uppercase tracking-widest">Vault Empty</p></div>}
              </div>
            </div>
          </main>

          <SubmissionWorkflowModal isOpen={showWorkflowModal} onClose={() => setShowWorkflowModal(false)} onComplete={() => { fetchInitialData(); setShowWorkflowModal(false); }} apiUrl={process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1'} />
          {teamData && <PostHackathonCertificateModal isOpen={showCertModal} onClose={() => setShowCertModal(false)} teamData={teamData} apiUrl={process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1'} />}
        </div>
      )}
    </>
  );
}
