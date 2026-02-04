'use client';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PitchGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const teamIdRef = require('react').useRef(null);
  const teamNameRef = require('react').useRef(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [teamId, setTeamId] = useState(null);

  const [data, setData] = useState({
    // S1: Identity
    projectName: '', teamName: '', institutionName: '', leaderName: '', memberNames: '',
    // S2: Strategic Context
    s2_domain: '', s2_context: '', s2_rootReason: '',
    // S3: Problem Statement
    s3_coreProblem: '', s3_affected: '', s3_whyItMatters: '',
    // S4: Impact Matrix
    s4_painPoints: Array(10).fill({ point: '', impact: 'High', freq: 'Frequent' }),
    // S5: Stakeholders
    s5_primaryUsers: '', s5_secondaryUsers: '',
    // S6: Persona Node
    s6_customerName: '', s6_customerJob: '', s6_customerAge: '', s6_customerLocation: '', s6_customerEthos: '',
    s6_customerGender: '', s6_customerHobbies: '', s6_customerInterests: '', s6_customerIncome: '',
    s6_pains: '', s6_gains: '', s6_bio: '', s6_goals: '', s6_howWeHelp: '',
    s6_personality: { introvert: 50, thinking: 50, sensing: 50, judging: 50 },
    s6_motivations: { growth: 50, fear: 50, security: 50, recognition: 50, funding: 50 },
    // S7: Gap Analysis
    s7_alternatives: '', s7_limitations: '', s7_gainCreators: '', s7_painKillers: '',
    // S8: Solution Concept
    s8_solution: '', s8_coreTech: '',
    // S9: Solution Flow
    s9_oneline: '', s9_howItWorks: '', 
    s9_flowSteps: Array(10).fill(''),
    // S10: Lean Logic
    s10_leanProblem: '', s10_leanSolution: '', s10_leanMetrics: '', s10_leanUSP: '', 
    s10_leanUnfair: '', s10_leanChannels: '', s10_leanSegments: '', s10_leanCosts: '', s10_leanRevenue: '',
    s10_leanConcepts: '', s10_leanAdopters: '', s10_leanAlternatives: '',
    // S11: Value Metrics
    s11_lifts: Array(5).fill(''),
    s11_pulls: Array(5).fill(''),
    s11_fuels: Array(5).fill(''),
    s11_outcomes: Array(5).fill(''),
    // S12: Market Positioning
    s12_competitors: [
      { name: '', strength: '', weakness: '', pricingModel: '', featureRichness: '' },
      { name: '', strength: '', weakness: '', pricingModel: '', featureRichness: '' }
    ],
    s12_ourVenture: { name: 'Our Venture', strength: '', weakness: '', pricingModel: '', featureRichness: '' },
    // S13: Market Sizing
    s13_tam: '', s13_sam: '', s13_som: '', s13_marketLogic: '',
    // S14: Revenue Model
    s14_primaryStream: '', s14_secondaryStream: '', s14_pricingStrategy: '', s14_revenueLogic: '',
    // S15: Financial Allocation
    s15_allocations: [
      { category: '', amount: '' },
      { category: '', amount: '' },
      { category: '', amount: '' },
      { category: '', amount: '' },
      { category: '', amount: '' }
    ],
    // S16: Impact Vision
    s16_socialEconomic: '', s16_metrics: '', s16_vision: '',
    slide_assets: {}
  });

  useEffect(() => {
    if (!mounted || !hasFetched) return;
    const saveTimer = setTimeout(() => {
      if (Object.keys(data).length > 0) handleSaveDraft(true);
    }, 5000); 
    return () => clearTimeout(saveTimer);
  }, [data, mounted, hasFetched]);
  
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    
    async function init() {
      setLoading(true);
      try {
        if (!token) {
          router.push('/login');
          return;
        }
        const res = await axios.get(`${apiUrl}/team/profile`, { headers: { Authorization: `Bearer ${token}` } });
        
        // Redirect if they have multiple questions but haven't picked one yet
        if (res.data.problemStatements?.length > 1 && !res.data.selectedProblemId) {
          router.push('/team/dashboard');
          return;
        }

        if (res.data.submission?.pptUrl && !res.data.submission.canRegenerate) {
           router.push('/team/dashboard');
        } else {
           const coreProblem = res.data.selectedProblem?.description || (res.data.problemStatements?.length === 1 ? res.data.problemStatements[0].description : '');
           const profileData = {
              teamName: res.data.teamName || '',
              institutionName: res.data.collegeName || '',
              leaderName: res.data.leaderName || '',
              s3_coreProblem: coreProblem,
              s10_leanProblem: coreProblem
           };

           if (res.data.submission?.content) {
              const savedContent = typeof res.data.submission.content === 'string' 
                ? JSON.parse(res.data.submission.content) 
                : res.data.submission.content;
              
              if (savedContent && Object.keys(savedContent).length > 0) {
                 setData(prev => ({ ...prev, ...profileData, ...savedContent }));
                 console.log(`[INIT] Hydrated mission state with ${Object.keys(savedContent).length} data points.`);
              } else {
                 setData(prev => ({ ...prev, ...profileData }));
              }
           } else {
              setData(prev => ({ ...prev, ...profileData }));
           }
        }
        setTeamId(res.data.id);
        teamIdRef.current = res.data.id;
        teamNameRef.current = res.data.teamName;
        setIsActive(res.data.isActive !== false);
        setIsPaused(res.data.config?.isPaused || false);
        setHasFetched(true);
      } catch (err) { 
        console.error("Init failed", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          router.push('/login');
        } else if (err.response?.status === 404) {
          alert("Team identity not found. Please logout and login again.");
        }
      } finally {
        setLoading(false);
      }
    }
    init();

    let socketInstance = null;
    const initSocket = async () => {
      try {
        const module = await import('socket.io-client');
        const socketIO = module.default || module.io;
        if (typeof socketIO !== 'function') return;

        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || process.env.NEXT_PUBLIC_WS_URL || 'https://hackathon-production-7c99.up.railway.app';
        socketInstance = socketIO(socketUrl, { transports: ['websocket', 'polling'], reconnectionAttempts: 5 });

        socketInstance.on('timerUpdate', (data) => {
          if (data && typeof data.timerPaused === 'boolean') setIsPaused(data.timerPaused);
        });

        socketInstance.on('teamStatusUpdate', (data) => {
          if (data && typeof data.isActive === 'boolean') {
             // Use localStorage or a way to verify identity if teamId isn't set yet
             const currentTeamId = localStorage.getItem('teamId'); // If we store it
             // Better: we have teamId from profile fetch
             if (data.teamId === teamIdRef.current || data.teamId === teamNameRef.current) {
                setIsActive(data.isActive);
             }
          }
        });
      } catch (e) { console.error("Socket error", e); }
    };
    initSocket();
    return () => { if (socketInstance) socketInstance.disconnect(); };
  }, [router]);

  async function handleSaveDraft(silent = false) {
    if (!silent) setSaving(true);
    if (!hasFetched) {
      console.warn("[DRAFT-SYNC] Safe-guard active. Skipping save because initial data hasn't been verified.");
      if (!silent) setSaving(false);
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/team/save-draft`, data, { headers: { Authorization: `Bearer ${token}` } });
      if (!silent) router.push('/team/dashboard');
    } catch (err) { console.error("Save failed", err); } finally { if (!silent) setSaving(false); }
  }

  const limitWords = (text, limit) => {
    if (!text) return '';
    const words = text.split(/\s+/);
    if (words.length > limit) return words.slice(0, limit).join(' ');
    return text;
  };

  async function handleSubmit() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${apiUrl}/team/generate-pitch-deck`, data, { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 180000 
      });
      if (res.data.success) {
        alert("Pitch Artifact Synthesized Successfully!");
        router.push('/team/dashboard');
      } else {
        throw new Error(res.data.error || "Synthesis logic failure.");
      }
    } catch (err) { 
      console.error("Submit fail", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        router.push('/login?error=session_expired');
        return;
      }
      const msg = err.response?.data?.error || err.message || "Unknown error";
      alert(`Synthesis Interrupted: ${msg}`); 
    } finally { 
      setLoading(false); 
    }
  }

  function nextStep() { setStep(prev => Math.min(prev + 1, 17)); window.scrollTo(0,0); }
  function prevStep() { setStep(prev => Math.max(prev - 1, 1)); window.scrollTo(0,0); }

  if (!mounted || loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Repository...</p>
    </div>
  );

  const stepsList = [
    'Identity', 'Strategic Context', 'Problem Statement', 'Impact Matrix', 'Stakeholders', 
    'Persona Node', 'Gap Analysis', 'Solution Concept', 'Solution Flow', 'Lean Logic', 
    'Value Metrics', 'Market Positioning', 'Market Sizing', 'Revenue Model', 
    'Financial Allocation', 'Impact Vision', 'Repository'
  ];

  return (
    <div className="min-h-screen bg-innovation font-sans tracking-tight relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none fixed"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-400/5 blur-[150px] rounded-full animate-pulse fixed pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-green-400/5 blur-[150px] rounded-full animate-pulse fixed pointer-events-none"></div>

      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/40 px-8 py-4 flex justify-between items-center shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <Link href="/team/dashboard" className="flex items-center gap-4 group">
          <div className="w-8 h-8 bg-slate-800 text-white flex items-center justify-center rounded-lg font-bold group-hover:-translate-x-1 transition-all">←</div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Generator</h1>
        </Link>
        <div className="px-4 py-1 bg-white/50 border border-white/60 rounded-full backdrop-blur-sm">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Step {step} of 17</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-6 relative z-10">
        <div className="grid grid-cols-12 gap-10">
          <aside className="col-span-3 hidden lg:block sticky top-28 h-fit">
            <div className="bg-gradient-to-b from-[#2563eb] to-[#1e40af] p-6 rounded-[2.5rem] border-2 border-white/20 shadow-[20px_20px_60px_rgba(37,99,235,0.3)] overflow-hidden relative">
              <div className="relative z-10 space-y-6">
                <div className="px-4 pb-4 border-b-2 border-white/10 flex items-center justify-between">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Flow Pipeline</h3>
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                    <span className="text-[10px] font-black text-white">17</span>
                  </div>
                </div>
                
                <nav className="space-y-3 max-h-[calc(100vh-320px)] pr-2 overflow-y-auto custom-scrollbar pt-2">
                  {stepsList.map((label, i) => {
                    const isActive = step === (i + 1);
                    const isCompleted = (i + 1) < step;
                    
                    const icons = [
                      <svg key="0" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
                      <svg key="1" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                      <svg key="2" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      <svg key="3" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
                      <svg key="4" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
                      <svg key="5" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
                      <svg key="6" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
                      <svg key="7" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
                      <svg key="8" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
                      <svg key="9" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 00.547 1.022l1.428 1.428a2 2 0 001.022.547l2.387.477a2 2 0 001.96-1.414l.477-2.387a2 2 0 00-.547-1.022l-1.428-1.428z" /></svg>,
                      <svg key="10" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
                      <svg key="11" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                      <svg key="12" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
                      <svg key="13" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                      <svg key="14" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 11V4.586L8.707 6.879 7.293 5.464 12 0.757l4.707 4.707-1.414 1.415L13 4.586V11h-2zm0 2v6.414l2.293-2.293 1.414 1.415L12 23.243l-4.707-4.707 1.414-1.415L11 19.414V13h2z" /></svg>,
                      <svg key="15" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                      <svg key="16" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    ];
                    
                    return (
                      <button 
                        key={i} 
                        onClick={() => (i+1) <= step && setStep(i+1)} 
                        className={`w-full text-left px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-4 border-b-4
                        ${isActive 
                          ? 'bg-white text-blue-600 shadow-[0_10px_20px_rgba(255,255,255,0.2)] translate-x-2 border-blue-200' 
                          : isCompleted 
                            ? 'bg-emerald-400 text-white border-emerald-600 hover:bg-emerald-500' 
                            : 'bg-white/10 text-white/40 border-white/5 pointer-events-none'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors
                          ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : isCompleted ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>
                          {isCompleted ? <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> : (icons[i] || i+1)}
                        </div>
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          <section className="col-span-12 lg:col-span-9 bg-white/60 backdrop-blur-xl p-12 rounded-[2.5rem] border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-h-[700px] flex flex-col justify-between transition-all duration-300">
             <div className="flex-grow">
                 {step === 1 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-orange-50 text-[var(--accent-orange)] flex items-center justify-center font-bold">01</span><h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Identity</h2></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2"><label className="label-premium">Project Name (Max 10 Words)</label><input className="input-premium text-lg font-bold" value={data.projectName} onChange={e => setData({...data, projectName: limitWords(e.target.value, 10)})} /></div>
                        <div><label className="label-premium">Team Name</label><input className="input-premium" value={data.teamName} onChange={e => setData({...data, teamName: e.target.value})} /></div>
                        <div><label className="label-premium">Institution</label><input className="input-premium" value={data.institutionName} onChange={e => setData({...data, institutionName: e.target.value})} /></div>
                        <div><label className="label-premium">Leader</label><input className="input-premium" value={data.leaderName} onChange={e => setData({...data, leaderName: e.target.value})} /></div>
                        <div><label className="label-premium">Members (Max 15 Words)</label><input className="input-premium" value={data.memberNames} onChange={e => setData({...data, memberNames: limitWords(e.target.value, 15)})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">02</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Strategic Context</h2></div>
                      <div className="space-y-8">
                        <div><label className="label-premium">Domain (Max 8 Words)</label><input className="input-premium" value={data.s2_domain} onChange={e => setData({...data, s2_domain: limitWords(e.target.value, 8)})} /></div>
                        <div><label className="label-premium">Operational Context (Max 35 Words)</label><textarea className="input-premium min-h-[150px]" value={data.s2_context} onChange={e => setData({...data, s2_context: limitWords(e.target.value, 35)})} /></div>
                        <div><label className="label-premium">Root Catalyst (Max 20 Words)</label><input className="input-premium" value={data.s2_rootReason} onChange={e => setData({...data, s2_rootReason: limitWords(e.target.value, 20)})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center font-bold">03</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Problem Statement</h2></div>
                      <div className="space-y-8">
                        <div><label className="label-premium text-rose-500">Core Problem (Max 50 Words)</label><textarea className="input-premium min-h-[150px]" value={data.s3_coreProblem} onChange={e => setData({...data, s3_coreProblem: limitWords(e.target.value, 50)})} /></div>
                        <div><label className="label-premium">Affected Personnel (Max 20 Words)</label><input className="input-premium" value={data.s3_affected} onChange={e => setData({...data, s3_affected: limitWords(e.target.value, 20)})} /></div>
                        <div><label className="label-premium">Critical Gravity (Max 30 Words)</label><input className="input-premium" value={data.s3_whyItMatters} onChange={e => setData({...data, s3_whyItMatters: limitWords(e.target.value, 30)})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center font-bold">04</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Impact Matrix</h2></div>
                      <div className="max-h-[500px] overflow-y-auto pr-4 space-y-4">
                        {data.s4_painPoints.map((pp, idx) => (
                          <div key={idx} className="bg-slate-50 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center border border-slate-100">
                            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200 shadow-sm">{idx+1}</span>
                            <div className="flex-grow w-full"><input className="input-premium !py-2 !text-xs !bg-white" value={pp.point} onChange={e => { let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], point: limitWords(e.target.value, 12) }; setData({...data, s4_painPoints: u}) }} placeholder="Enter pain point facet (Max 12 Words)..." /></div>
                            <select className="input-premium !py-2 !text-[10px] !w-fit font-bold !bg-white" value={pp.impact} onChange={e => { let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], impact: e.target.value }; setData({...data, s4_painPoints: u}) }}><option>High</option><option>Medium</option><option>Low</option></select>
                            <select className="input-premium !py-2 !text-[10px] !w-fit font-bold !bg-white" value={pp.freq} onChange={e => { let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], freq: e.target.value }; setData({...data, s4_painPoints: u}) }}><option>Frequent</option><option>Occasional</option><option>Rare</option></select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">05</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Stakeholders</h2></div>
                      <div className="space-y-8">
                        <div><label className="label-premium">Primary Consumers (Max 35 Words)</label><textarea className="input-premium min-h-[150px]" value={data.s5_primaryUsers} onChange={e => setData({...data, s5_primaryUsers: limitWords(e.target.value, 35)})} /></div>
                        <div><label className="label-premium">Secondary Entities (Max 35 Words)</label><textarea className="input-premium min-h-[150px]" value={data.s5_secondaryUsers} onChange={e => setData({...data, s5_secondaryUsers: limitWords(e.target.value, 35)})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-orange-50 text-[var(--accent-orange)] flex items-center justify-center font-bold">06</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Persona Node</h2></div>
                      <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2 md:col-span-1"><label className="label-premium">Name</label><input className="input-premium !py-2 !text-xs" value={data.s6_customerName} onChange={e => setData({...data, s6_customerName: e.target.value})} /></div>
                        <div className="col-span-2 md:col-span-1"><label className="label-premium">Age</label><input className="input-premium !py-2 !text-xs" value={data.s6_customerAge} onChange={e => setData({...data, s6_customerAge: e.target.value})} /></div>
                        <div className="col-span-2 md:col-span-1"><label className="label-premium">Gender</label><input className="input-premium !py-2 !text-xs" value={data.s6_customerGender} onChange={e => setData({...data, s6_customerGender: e.target.value})} /></div>
                        <div className="col-span-2 md:col-span-1"><label className="label-premium">Location</label><input className="input-premium !py-2 !text-xs" value={data.s6_customerLocation} onChange={e => setData({...data, s6_customerLocation: e.target.value})} /></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card-premium !bg-rose-50 !border-rose-100">
                          <label className="label-premium !text-rose-500 mb-2">Core Pains (Max 35 Words)</label>
                          <textarea className="input-premium !bg-white !text-xs !min-h-[100px]" value={data.s6_pains} onChange={e => setData({...data, s6_pains: limitWords(e.target.value, 35)})} />
                        </div>
                        <div className="card-premium !bg-emerald-50 !border-emerald-100">
                          <label className="label-premium !text-emerald-500 mb-2">Professional Goals (Max 35 Words)</label>
                          <textarea className="input-premium !bg-white !text-xs !min-h-[100px]" value={data.s6_goals} onChange={e => setData({...data, s6_goals: limitWords(e.target.value, 35)})} />
                        </div>
                      </div>
                      <div className="card-premium !bg-blue-50 !border-blue-100">
                        <label className="label-premium !text-blue-600 mb-2">How We Help (Max 35 Words)</label>
                        <textarea className="input-premium !bg-white !text-xs !min-h-[120px]" value={data.s6_howWeHelp} onChange={e => setData({...data, s6_howWeHelp: limitWords(e.target.value, 35)})} placeholder="• Point 1&#10;• Point 2" />
                      </div>
                    </div>
                  )}

                  {step === 7 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center font-bold">07</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Gap Analysis</h2></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div><label className="label-premium">Status Quo (Max 35 Words)</label><textarea className="input-premium min-h-[150px]" value={data.s7_alternatives} onChange={e => setData({...data, s7_alternatives: limitWords(e.target.value, 35)})} /></div>
                        <div><label className="label-premium">Limitations (Max 35 Words)</label><textarea className="input-premium min-h-[150px]" value={data.s7_limitations} onChange={e => setData({...data, s7_limitations: limitWords(e.target.value, 35)})} /></div>
                        <div><label className="label-premium text-[var(--primary-green)]">Gains Creator (Max 35 Words)</label><textarea className="input-premium min-h-[120px]" value={data.s7_gainCreators} onChange={e => setData({...data, s7_gainCreators: limitWords(e.target.value, 35)})} /></div>
                        <div><label className="label-premium text-rose-500">Pain Reliever (Max 35 Words)</label><textarea className="input-premium min-h-[120px]" value={data.s7_painKillers} onChange={e => setData({...data, s7_painKillers: limitWords(e.target.value, 35)})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 8 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-green-50 text-[var(--primary-green)] flex items-center justify-center font-bold">08</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Solution Concept</h2></div>
                      <div className="space-y-8">
                        <div><label className="label-premium text-[var(--primary-green)]">Proposed Mission (Max 50 Words)</label><textarea className="input-premium min-h-[200px]" value={data.s8_solution} onChange={e => setData({...data, s8_solution: limitWords(e.target.value, 50)})} /></div>
                        <div><label className="label-premium">Core Technology Architecture (Max 15 Words)</label><input className="input-premium" placeholder="AI, Blockchain, Web3, Cloud..." value={data.s8_coreTech} onChange={e => setData({...data, s8_coreTech: limitWords(e.target.value, 15)})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 9 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">09</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Solution Flow</h2></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div><label className="label-premium">One Line Logic</label><input className="input-premium font-bold italic" value={data.s9_oneline} onChange={e => setData({...data, s9_oneline: e.target.value})} /></div>
                        <div><label className="label-premium">System Process</label><input className="input-premium" value={data.s9_howItWorks} onChange={e => setData({...data, s9_howItWorks: e.target.value})} /></div>
                      </div>
                      <div className="pt-8 border-t border-slate-100">
                        <label className="label-premium mb-6 block">Institutional Workflow (10 Steps)</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                          {data.s9_flowSteps.map((sv, i) => (
                            <div key={i} className="flex items-center gap-4">
                              <span className="text-xs font-bold text-slate-300 w-6">#{i+1}</span>
                              <input className="input-premium !py-2.5 !text-xs" value={sv} onChange={e => { let u = [...data.s9_flowSteps]; u[i] = limitWords(e.target.value, 12); setData({...data, s9_flowSteps: u}) }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                   {step === 10 && (
                    <div className="space-y-6 animate-fade">
                       <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">10</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Lean Logic</h2></div>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="card-premium !p-6 border-rose-100">
                             <label className="label-premium !text-rose-500 mb-2">01. Problem (Max 25 Words)</label>
                             <textarea className="input-premium !min-h-[120px] !text-xs !bg-slate-50 border-0" value={data.s10_leanProblem} onChange={e => setData({...data, s10_leanProblem: limitWords(e.target.value, 25)})} placeholder="Market pain point..." />
                          </div>
                          <div className="card-premium !p-6 border-blue-100">
                             <label className="label-premium !text-blue-600 mb-2">02. Solution (Max 15 Words)</label>
                             <textarea className="input-premium !min-h-[60px] !text-xs !bg-slate-50 border-0 mb-4" value={data.s10_leanSolution} onChange={e => setData({...data, s10_leanSolution: limitWords(e.target.value, 15)})} placeholder="High-level fix..." />
                             <label className="label-premium !text-[8px] !text-slate-400 mb-1 uppercase">Metrics (Max 15 Words)</label>
                             <textarea className="input-premium !min-h-[60px] !text-xs !bg-slate-50 border-0" value={data.s10_leanMetrics} onChange={e => setData({...data, s10_leanMetrics: limitWords(e.target.value, 15)})} placeholder="Key numbers..." />
                          </div>
                          <div className="card-premium !p-6 bg-blue-50 border-blue-200">
                             <label className="label-premium !text-blue-700 mb-2">03. Value Prop (Max 25 Words)</label>
                             <textarea className="input-premium !min-h-[150px] !text-xs !bg-white font-bold" value={data.s10_leanUSP} onChange={e => setData({...data, s10_leanUSP: limitWords(e.target.value, 25)})} placeholder="Single compelling message..." />
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="card-premium !p-6">
                             <label className="label-premium mb-2 uppercase">04. Unfair Advantage (Max 15 Words)</label>
                             <textarea className="input-premium !min-h-[60px] !text-xs !bg-slate-50 border-0 mb-4" value={data.s10_leanUnfair} onChange={e => setData({...data, s10_leanUnfair: limitWords(e.target.value, 15)})} placeholder="Competitive moat..." />
                             <label className="label-premium !text-[8px] !text-slate-400 mb-1 uppercase">Channels (Max 15 Words)</label>
                             <textarea className="input-premium !min-h-[60px] !text-xs !bg-slate-50 border-0" value={data.s10_leanChannels} onChange={e => setData({...data, s10_leanChannels: limitWords(e.target.value, 15)})} placeholder="Customer path..." />
                          </div>
                          <div className="card-premium !p-6">
                             <label className="label-premium !text-indigo-600 mb-2 uppercase">05. Customer Nodes (Max 25 Words)</label>
                             <textarea className="input-premium !min-h-[150px] !text-xs !bg-slate-50 border-0" value={data.s10_leanSegments} onChange={e => setData({...data, s10_leanSegments: limitWords(e.target.value, 25)})} placeholder="Primary cohorts..." />
                          </div>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="card-premium !p-6 !bg-slate-50 border-slate-200">
                             <label className="label-premium mb-2 uppercase">06. Cost Structure (Max 15 Words)</label>
                             <textarea className="input-premium !min-h-[100px] !text-xs !bg-white border-0" value={data.s10_leanCosts} onChange={e => setData({...data, s10_leanCosts: limitWords(e.target.value, 15)})} placeholder="Infrastructure, R&D, Operations..." />
                          </div>
                          <div className="card-premium !p-6 !bg-emerald-50 border-emerald-100">
                             <label className="label-premium !text-emerald-600 mb-2 uppercase">07. Revenue Streams (Max 15 Words)</label>
                             <textarea className="input-premium !min-h-[100px] !text-xs !bg-white border-0" value={data.s10_leanRevenue} onChange={e => setData({...data, s10_leanRevenue: limitWords(e.target.value, 15)})} placeholder="Subscriptions, Licensing, Ad-hoc..." />
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 11 && (
                     <div className="space-y-8 animate-fade">
                        <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-slate-50 text-slate-800 flex items-center justify-center font-bold">11</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Value Metrics</h2></div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="space-y-3">
                            <label className="label-premium !text-emerald-500 !text-[10px]">Lifts (Max 6 Words)</label>
                            {data.s11_lifts.map((v, i) => (<input key={i} className="input-premium !py-2.5 !text-[10px]" value={v} onChange={e => { let u = [...data.s11_lifts]; u[i] = limitWords(e.target.value, 6); setData({...data, s11_lifts: u})}} />))}
                          </div>
                          <div className="space-y-3">
                            <label className="label-premium !text-rose-500 !text-[10px]">Pulls (Max 6 Words)</label>
                            {data.s11_pulls.map((v, i) => (<input key={i} className="input-premium !py-2.5 !text-[10px]" value={v} onChange={e => { let u = [...data.s11_pulls]; u[i] = limitWords(e.target.value, 6); setData({...data, s11_pulls: u})}} />))}
                          </div>
                          <div className="space-y-3">
                            <label className="label-premium !text-blue-600 !text-[10px]">Fuels (Max 6 Words)</label>
                            {data.s11_fuels.map((v, i) => (<input key={i} className="input-premium !py-2.5 !text-[10px]" value={v} onChange={e => { let u = [...data.s11_fuels]; u[i] = limitWords(e.target.value, 6); setData({...data, s11_fuels: u})}} />))}
                          </div>
                          <div className="space-y-3">
                            <label className="label-premium !text-slate-800 !text-[10px]">Outcomes (Max 6 Words)</label>
                            {data.s11_outcomes.map((v, i) => (<input key={i} className="input-premium !py-2.5 !text-[10px]" value={v} onChange={e => { let u = [...data.s11_outcomes]; u[i] = limitWords(e.target.value, 6); setData({...data, s11_outcomes: u})}} />))}
                          </div>
                        </div>
                     </div>
                  )}

                  {step === 12 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-orange-50 text-[var(--accent-orange)] flex items-center justify-center font-bold">12</span><h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Market Positioning</h2></div>
                      <div className="space-y-10">
                        {data.s12_competitors.map((c, i) => (
                          <div key={i} className="card-premium !bg-slate-50 !p-8">
                            <h3 className="text-xs font-bold uppercase text-slate-400 mb-6">Competitor {i+1}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                              <div><label className="label-premium">Name</label><input className="input-premium !bg-white !py-2 !text-xs" value={c.name} onChange={e => { let u = [...data.s12_competitors]; u[i].name = e.target.value; setData({...data, s12_competitors: u})}} /></div>
                              <div><label className="label-premium">Strength</label><input className="input-premium !bg-white !py-2 !text-xs" value={c.strength} onChange={e => { let u = [...data.s12_competitors]; u[i].strength = e.target.value; setData({...data, s12_competitors: u})}} /></div>
                              <div><label className="label-premium">Weakness</label><input className="input-premium !bg-white !py-2 !text-xs" value={c.weakness} onChange={e => { let u = [...data.s12_competitors]; u[i].weakness = e.target.value; setData({...data, s12_competitors: u})}} /></div>
                              <div><label className="label-premium">Pricing</label><input className="input-premium !bg-white !py-2 !text-xs" value={c.pricingModel} onChange={e => { let u = [...data.s12_competitors]; u[i].pricingModel = e.target.value; setData({...data, s12_competitors: u})}} /></div>
                              <div><label className="label-premium">Richness</label><input className="input-premium !bg-white !py-2 !text-xs" value={c.featureRichness} onChange={e => { let u = [...data.s12_competitors]; u[i].featureRichness = e.target.value; setData({...data, s12_competitors: u})}} /></div>
                            </div>
                          </div>
                        ))}
                        
                        <div className="card-premium !bg-blue-50 !border-blue-200 !p-10 shadow-lg">
                          <h3 className="text-sm font-bold uppercase text-blue-600 mb-8">Our Venture</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                            <div><label className="label-premium !text-blue-600">Name</label><input className="input-premium !bg-white !text-slate-800 font-bold" value={data.s12_ourVenture.name} readOnly /></div>
                            <div><label className="label-premium !text-blue-600">Unfair Edge</label><input className="input-premium !bg-white !text-slate-800" value={data.s12_ourVenture.strength} onChange={e => setData({...data, s12_ourVenture: {...data.s12_ourVenture, strength: e.target.value}})} /></div>
                            <div><label className="label-premium !text-blue-600">Market Gap</label><input className="input-premium !bg-white !text-slate-800" value={data.s12_ourVenture.weakness} onChange={e => setData({...data, s12_ourVenture: {...data.s12_ourVenture, weakness: e.target.value}})} /></div>
                            <div><label className="label-premium !text-blue-600">Pricing</label><input className="input-premium !bg-white !text-slate-800" value={data.s12_ourVenture.pricingModel} onChange={e => setData({...data, s12_ourVenture: {...data.s12_ourVenture, pricingModel: e.target.value}})} /></div>
                            <div><label className="label-premium !text-blue-600">Richness</label><input className="input-premium !bg-white !text-slate-800" value={data.s12_ourVenture.featureRichness} onChange={e => setData({...data, s12_ourVenture: {...data.s12_ourVenture, featureRichness: e.target.value}})} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 13 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-orange-50 text-[var(--accent-orange)] flex items-center justify-center font-bold">13</span><h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Market Sizing (₹)</h2></div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[ {l: 'TAM', c: 'blue-600', k: 's13_tam', m: '500 Cr'}, {l: 'SAM', c: 'orange-500', k: 's13_sam', m: '10 Cr'}, {l: 'SOM', c: 'green-600', k: 's13_som', m: '50 Lakhs'} ].map((m, i) => (
                          <div key={i} className="card-premium">
                             <label className={`label-premium !text-${m.c} mb-3`}>{m.l}</label>
                             <input className="input-premium !text-xl font-bold" placeholder={`Ex: ₹${m.m}`} value={data[m.k]} onChange={e => setData({...data, [m.k]: e.target.value})} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-8">
                        <label className="label-premium">Valuation Logic & Research Basis (Rupees)</label>
                        <textarea className="input-premium !min-h-[150px]" placeholder="Explain research methodology for ₹ sizing..." value={data.s13_marketLogic} onChange={e => setData({...data, s13_marketLogic: e.target.value})} />
                      </div>
                    </div>
                  )}

                  {step === 14 && (
                    <div className="space-y-10 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-green-50 text-[var(--primary-green)] flex items-center justify-center font-bold">14</span><h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Revenue Model (₹)</h2></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                           <div><label className="label-premium !text-[var(--primary-green)] mb-2">Primary Stream (Max 15 Words)</label><input className="input-premium font-bold text-[var(--primary-green)]" value={data.s14_primaryStream} onChange={e => setData({...data, s14_primaryStream: limitWords(e.target.value, 15)})} /></div>
                           <div><label className="label-premium mb-2">Secondary Nodes (Max 25 Words)</label><input className="input-premium" value={data.s14_secondaryStream} onChange={e => setData({...data, s14_secondaryStream: limitWords(e.target.value, 25)})} /></div>
                        </div>
                        <div className="space-y-8">
                           <div><label className="label-premium mb-2">Pricing Strategy (₹) (Max 15 Words)</label><input className="input-premium" value={data.s14_pricingStrategy} onChange={e => setData({...data, s14_pricingStrategy: limitWords(e.target.value, 15)})} /></div>
                           <div><label className="label-premium mb-2">Economic Logic (Rupees) (Max 40 Words)</label><textarea className="input-premium !min-h-[120px]" value={data.s14_revenueLogic} onChange={e => setData({...data, s14_revenueLogic: limitWords(e.target.value, 40)})} /></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 15 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-orange-50 text-[var(--accent-orange)] flex items-center justify-center font-bold">15</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Financial Allocation</h2></div>
                      <div className="card-premium !p-0 overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                              <th className="px-8 py-5">Allocation Item</th>
                              <th className="px-8 py-5 text-right">Value (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.s15_allocations.map((alloc, i) => (
                              <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-8 py-4"><input className="input-premium !bg-transparent !border-0 !p-0 font-bold text-sm" value={alloc.category} onChange={e => { let u = [...data.s15_allocations]; u[i].category = e.target.value; setData({...data, s15_allocations: u}) }} placeholder="Enter category..." /></td>
                                <td className="px-8 py-4 text-right"><input type="number" className="input-premium !bg-transparent !border-0 !p-0 font-bold text-sm text-right text-[var(--primary-green)]" value={alloc.amount} onChange={e => { let u = [...data.s15_allocations]; u[i].amount = e.target.value; setData({...data, s15_allocations: u}) }} placeholder="0" /></td>
                              </tr>
                            ))}
                            <tr className="bg-green-50 font-bold text-green-700">
                              <td className="px-8 py-6 uppercase tracking-wider">Total Allocation</td>
                              <td className="px-8 py-6 text-right text-xl">₹ {data.s15_allocations.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0).toLocaleString('en-IN')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {step === 16 && (
                    <div className="space-y-10 animate-fade">
                       <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">16</span><h2 className="text-2xl font-bold text-slate-900 uppercase">Success Vision</h2></div>
                       <div className="space-y-10">
                          <div><label className="label-premium">Social / Economic Impact (Max 50 Words)</label><textarea className="input-premium !min-h-[250px]" value={data.s16_socialEconomic} onChange={e => setData({...data, s16_socialEconomic: limitWords(e.target.value, 50)})} /></div>
                          <div><label className="label-premium !text-blue-600">Institutional Vision Boundary (Max 40 Words)</label><input className="input-premium font-bold border-blue-100" value={data.s16_vision} onChange={e => setData({...data, s16_vision: limitWords(e.target.value, 40)})} /></div>
                       </div>
                    </div>
                  )}

                  {step === 17 && (
                    <div className="space-y-12 animate-fade text-center py-24">
                      <div className="text-7xl mb-10">🏛️</div>
                      <div className="space-y-6">
                        <h2 className="text-4xl font-bold text-slate-900 uppercase tracking-tight">Ready for Submission</h2>
                        <p className="text-slate-500 font-medium max-w-xl mx-auto leading-relaxed">Your project data is complete. Click below to generate your professional pitch artifact.</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 max-w-2xl mx-auto mt-12 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                         <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Project Name</p><p className="text-sm font-bold text-slate-800">{data.projectName || 'Unnamed Project'}</p></div>
                         <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Team</p><p className="text-sm font-bold text-slate-800">{data.teamName || 'Unknown Team'}</p></div>
                         <div className="p-4 bg-[var(--secondary-blue)] rounded-2xl border border-blue-200 shadow-sm"><p className="text-[10px] font-bold text-white/60 uppercase mb-2">Question</p><p className="text-sm font-bold text-white">{selectedProblem ? `Q.${selectedProblem.questionNo} ${selectedProblem.subDivisions ? `- ${selectedProblem.subDivisions}` : ''}` : (data.s3_coreProblem ? 'Custom' : 'NONE')}</p></div>
                      </div>
                    </div>
                  )}
             </div>

             <footer className="mt-16 pt-10 border-t border-slate-100 flex justify-between items-center sm:flex-row flex-col gap-6">
                <button 
                  onClick={() => handleSaveDraft(false)} 
                  disabled={saving}
                  className="text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-colors flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save Draft Progress'}
                </button>
                <div className="flex items-center gap-4">
                   {step > 1 && <button onClick={prevStep} className="btn-outline !py-3 !px-10 text-xs">Previous</button>}
                   {step < 17 ? (
                     <button onClick={nextStep} className="btn-blue !py-4 !px-12 text-xs uppercase tracking-widest shadow-lg shadow-blue-100">Next Step</button>
                   ) : (
                     <button 
                       onClick={handleSubmit} 
                       disabled={loading} 
                       className="btn-green !py-5 !px-14 text-sm uppercase tracking-widest shadow-xl shadow-green-200 hover:-translate-y-1"
                     >
                        {loading ? 'Creating File...' : 'Finalize & Submit'}
                     </button>
                   )}
                </div>
             </footer>
          </section>
        </div>
      </main>

      {/* MALPRACTICE / SUSPENSION OVERLAY */}
      {isActive === false && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-red-500 rounded-3xl flex items-center justify-center text-white text-5xl mx-auto shadow-2xl shadow-red-500/20">
              ⚠️
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Access Suspended</h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Institutional Protocol: Malpractice Detected</p>
            </div>
            <div className="p-6 bg-red-50/5 border border-red-500/20 rounded-2xl backdrop-blur-sm">
              <p className="text-red-400 text-sm font-medium leading-relaxed">
                Your team has been flagged for a violation of hackathon guidelines. This node is now locked. Please report to the administration desk immediately.
              </p>
            </div>
            <div className="pt-4 space-y-4">
              <button 
                onClick={() => alert("Please report to the main stage / help desk for manual verification.")}
                className="w-full py-4 bg-red-500 text-white font-bold rounded-xl uppercase text-xs tracking-widest hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Request Resume / Contact Admin
              </button>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] block opacity-50">System ID: {teamId}</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
