'use client';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PitchGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

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
    if (!mounted) return;
    const saveTimer = setTimeout(() => {
      if (Object.keys(data).length > 0) handleSaveDraft(true);
    }, 5000); 
    return () => clearTimeout(saveTimer);
  }, [data, mounted]);
  
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

           if (res.data.submission?.content && Object.keys(res.data.submission.content).length > 0) {
              setData(prev => ({ ...prev, ...profileData, ...res.data.submission.content }));
           } else {
              setData(prev => ({ ...prev, ...profileData }));
           }
        }
        setIsPaused(res.data.config?.isPaused || false);
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
  }, []);

  async function handleSaveDraft(silent = false) {
    if (!silent) setSaving(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/team/save-draft`, data, { headers: { Authorization: `Bearer ${token}` } });
      if (!silent) router.push('/team/dashboard');
    } catch (err) { console.error("Save failed"); } finally { if (!silent) setSaving(false); }
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
        localStorage.clear();
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
    <div className="min-h-screen bg-slate-50 font-sans tracking-tight">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <Link href="/team/dashboard" className="flex items-center gap-4 group">
          <div className="w-8 h-8 bg-slate-800 text-white flex items-center justify-center rounded-lg font-bold group-hover:-translate-x-1 transition-all">←</div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Generator</h1>
        </Link>
        <div className="px-4 py-1 bg-slate-50 border border-slate-200 rounded-full">
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Step {step} of 17</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-6">
        <div className="grid grid-cols-12 gap-10">
          <aside className="col-span-3 hidden lg:block sticky top-28 h-fit">
             <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                   {stepsList.map((label, i) => (
                     <button key={i} onClick={() => (i+1) <= step && setStep(i+1)} className={`w-full text-left px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-between ${step === (i+1) ? 'bg-blue-50 text-[var(--secondary-blue)] shadow-inner' : i+1 < step ? 'text-[var(--primary-green)]' : 'text-slate-300 pointer-events-none'}`}>
                        <span className="truncate">{label}</span>{i+1 < step && <span>✓</span>}
                     </button>
                   ))}
                </nav>
             </div>
          </aside>

          <section className="col-span-12 lg:col-span-9 bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-xl min-h-[700px] flex flex-col justify-between">
             <div className="flex-grow">
                 {step === 1 && (
                    <div className="space-y-8 animate-fade">
                      <div className="flex items-center gap-4"><span className="w-10 h-10 rounded-xl bg-orange-50 text-[var(--accent-orange)] flex items-center justify-center font-bold">01</span><h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Identity</h2></div>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="col-span-2"><label className="label-premium">Project Name (Max 10 Words)</label><input className="input-premium text-lg font-bold" value={data.projectName} onChange={e => setData({...data, projectName: limitWords(e.target.value, 10)})} /></div>
                        <div><label className="label-premium">Team Name</label><input className="input-premium" value={data.teamName} readOnly /></div>
                        <div><label className="label-premium">Institution</label><input className="input-premium" value={data.institutionName} readOnly /></div>
                        <div><label className="label-premium">Leader</label><input className="input-premium" value={data.leaderName} readOnly /></div>
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
                         <div className="p-4 bg-[var(--secondary-blue)] rounded-2xl border border-blue-200 shadow-sm"><p className="text-[10px] font-bold text-white/60 uppercase mb-2">Question</p><p className="text-sm font-bold text-white">{selectedProblem ? `Q.${selectedProblem.questionNo}` : (data.s3_coreProblem ? 'Custom' : 'NONE')}</p></div>
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
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
