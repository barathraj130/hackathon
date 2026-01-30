'use client';
import PostHackathonCertificateModal from '@/components/PostHackathonCertificateModal';
import SubmissionWorkflowModal from '@/components/SubmissionWorkflowModal';
import axios from 'axios';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function TeamDashboard() {
  const [timeLeft, setTimeLeft] = useState(86400);
  const [isPaused, setIsPaused] = useState(false);
  const [formattedTime, setFormattedTime] = useState('24:00:00');
  const [isGenerating, setIsGenerating] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [problemStatement, setProblemStatement] = useState(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isPausedRef = useRef(isPaused);
  const socketRef = useRef(null);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const fetchInitialData = useCallback(async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/team/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTeamData(res.data);
      if (res.data?.submission) {
        setSubmission(res.data.submission);
      }
      if (res.data?.problemStatement) setProblemStatement(res.data.problemStatement);
      
      if (res.data?.config?.allowCertificateDetails && (!res.data.submission?.certificates || res.data.submission.certificates.length === 0)) {
         setShowCertModal(true);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    fetchInitialData();
    
    let socketInstance = null;
    const initSocket = async () => {
      try {
        const module = await import('socket.io-client');
        const socketIO = module.default || module.io;
        
        if (typeof socketIO !== 'function') return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || process.env.NEXT_PUBLIC_WS_URL || 'https://hackathon-production-7c99.up.railway.app';
        
        socketInstance = socketIO(socketUrl, {
           transports: ['websocket', 'polling'],
           reconnectionAttempts: 5
        });
        socketRef.current = socketInstance;

        socketInstance.on('timerUpdate', (data) => {
          if (!data) return;
          try {
             if (typeof data.timeRemaining === 'number') setTimeLeft(data.timeRemaining);
             if (typeof data.timerPaused === 'boolean') setIsPaused(data.timerPaused);
             if (typeof data.formattedTime === 'string') setFormattedTime(data.formattedTime);
          } catch (e) {
             console.error("Socket error", e);
          }
        });
      } catch (e) {
         console.error("Socket init failed", e);
      }
    };

    initSocket();
    return () => { if (socketInstance) socketInstance.disconnect(); };
  }, [fetchInitialData]); 

  useEffect(() => { setMounted(true); }, []);

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
    } catch (err) { alert(`Error: ${err.response?.data?.error || err.message}`); } finally { setIsGenerating(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!mounted) return <div className="min-h-screen bg-slate-50 animate-pulse" />;

  return (
    <>
      {isPaused ? (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10 text-center">
          <div className="max-w-2xl bg-white p-12 rounded-3xl shadow-xl border border-slate-200">
             <h2 className="text-4xl font-bold text-slate-900 mb-4">Event Paused</h2>
             <p className="text-slate-500 font-semibold mb-10 uppercase tracking-wider">Please wait for the administrator to resume.</p>
             <button onClick={handleLogout} className="btn-outline px-10">Logout</button>
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 font-sans tracking-tight">
          <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 flex justify-between items-center px-8 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary-green)] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-green-200">B</div>
              <div><h1 className="text-sm font-bold text-slate-800 leading-none caps">Hackathon portal</h1><p className="text-[10px] font-bold text-slate-400 tracking-wider mt-1">Control Center</p></div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-right"><p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Time Remaining</p><p className={`text-2xl font-bold tabular-nums ${timeLeft < 3600 ? 'text-rose-500 animate-pulse' : 'text-slate-800'}`}>{formattedTime}</p></div>
              <div className="w-10 h-10"><img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" /></div>
              <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">Logout</button>
            </div>
          </nav>

          <main className="max-w-7xl mx-auto py-10 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              {problemStatement && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 border-l-8 border-l-[var(--secondary-blue)]">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="flex-1">
                        <span className="text-xs font-bold text-[var(--secondary-blue)] uppercase tracking-widest">My Task</span>
                        <h3 className="text-2xl font-bold text-slate-900 mt-2">{problemStatement.title}</h3>
                        <p className="text-slate-500 font-medium mt-4 leading-relaxed">{problemStatement.description}</p>
                      </div>
                      <div className="bg-slate-50 px-6 py-4 rounded-2xl text-center border border-slate-100 min-w-[120px]">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task ID</p>
                        <p className="text-3xl font-bold text-slate-800">{problemStatement.questionNo}</p>
                      </div>
                   </div>
                </div>
              )}
               <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
                <div className="max-w-xl space-y-6">
                  <span className="text-xs font-bold text-[var(--primary-green)] uppercase tracking-widest">Start Here</span>
                  <h2 className="text-4xl font-bold text-slate-900 leading-tight">Create Your Deck</h2>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed">Fill in the details about your project to build a professional presentation. Use our step-by-step tool to organize your information easily.</p>
                  <Link 
                    href={submission?.canRegenerate === false && submission?.status === 'SUBMITTED' ? '#' : "/team/pitch-generator"} 
                    className={`inline-flex items-center gap-4 px-10 py-4 rounded-xl font-bold uppercase text-sm tracking-wide transition-all ${submission?.canRegenerate === false && submission?.status === 'SUBMITTED' ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200' : 'btn-green shadow-xl shadow-green-100 hover:-translate-y-1'}`}
                  >
                    <span>{submission?.canRegenerate === false && submission?.status === 'SUBMITTED' ? 'Locked' : 'Open Generator'}</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8 sticky top-28">
               <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Open Tool</h3>
                <div className="space-y-4">
                    <button onClick={handleGenerateStandardPPT} disabled={isGenerating || (submission?.canRegenerate === false && submission?.status === 'SUBMITTED')} className={`w-full py-4 rounded-2xl font-bold uppercase text-xs tracking-wide transition-all flex items-center justify-center gap-3 ${isGenerating || (submission?.canRegenerate === false && submission?.status === 'SUBMITTED') ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100' : 'btn-blue shadow-lg shadow-blue-100 hover:-translate-y-1'}`}>
                      {isGenerating ? 'Processing...' : (submission?.canRegenerate === false && submission?.status === 'SUBMITTED') ? 'Locked' : 'Create Presentation'}
                    </button>
                    {teamData?.config?.allowCertificateDetails && (
                       <button onClick={() => setShowCertModal(true)} className="w-full py-4 border-2 border-slate-200 rounded-2xl font-bold uppercase text-xs tracking-wide text-slate-500 hover:bg-slate-50 transition-all">Enter Team Names</button>
                    )}
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center justify-between"><h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Downloads</h3><button onClick={fetchInitialData} className="text-xs font-bold text-[var(--secondary-blue)] hover:text-[var(--accent-orange)] transition-colors">Refresh</button></div>
                {submission?.pptUrl ? (
                  <div className="space-y-4">
                     <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--primary-green)] text-white flex items-center justify-center rounded-xl font-bold">✓</div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-green-700">Success</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">File Ready for Download</p>
                        </div>
                     </div>
                     <a href={submission.pptUrl} target="_blank" rel="noopener noreferrer" className="w-full py-4 btn-green !rounded-2xl text-xs flex items-center justify-center gap-2">Download File</a>
                  </div>
                ) : <div className="text-center py-10 opacity-30"><p className="text-4xl mb-4">📁</p><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Files Yet</p></div>}
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
