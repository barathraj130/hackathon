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

  const [data, setData] = useState({
    // S1: Identity
    projectName: '', teamName: '', institutionName: '', leaderName: '', memberNames: '',
    // S2: Background
    s2_domain: '', s2_context: '', s2_rootReason: '',
    // S3: Problem Statement
    s3_coreProblem: '', s3_affected: '', s3_whyItMatters: '',
    // S4: Impact Mapping
    s4_painPoints: Array(10).fill({ point: '', impact: 'High', freq: 'Frequent' }),
    // S5: Stakeholders
    s5_primaryUsers: '', s5_secondaryUsers: '',
    // S6: Persona
    s6_customerName: '', s6_customerJob: '', s6_customerAge: '', s6_customerLocation: '', s6_customerEthos: '',
    s6_customerGender: '', s6_customerHobbies: '', s6_customerInterests: '', s6_customerIncome: '',
    s6_pains: '', s6_gains: '', s6_bio: '', s6_goals: '', s6_howWeHelp: '',
    s6_personality: { introvert: 50, thinking: 50, sensing: 50, judging: 50 },
    s6_motivations: { growth: 50, fear: 50, security: 50, recognition: 50, funding: 50 },
    // S7: Gap Analysis
    s7_alternatives: '', s7_limitations: '', s7_gainCreators: '', s7_painKillers: '',
    // S8: Solution Statement
    s8_solution: '', s8_coreTech: '',
    // S9: Solution Flow
    s9_oneline: '', s9_howItWorks: '', 
    s9_flowSteps: Array(10).fill(''),
    // S10: Lean Canvas
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
      { name: '', strength: '', weakness: '' },
      { name: '', strength: '', weakness: '' }
    ],
    s12_ourVenture: { name: 'Our Venture', strength: '', weakness: '' },
    // S13: Market Sizing (TAM SAM SOM)
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
    // S17: Repository
    slide_assets: {}
  });
  
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    
    async function init() {
      try {
        if (!token) return;
        const res = await axios.get(`${apiUrl}/team/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.submission?.pptUrl && !res.data.submission.canRegenerate) {
           router.push('/team/dashboard');
        } else if (res.data.submission?.content) {
           setData(prev => ({ ...prev, ...res.data.submission.content }));
        }
        const statsRes = await axios.get(`${apiUrl.replace('/v1', '')}/health`);
        if (statsRes.data?.timerPaused) setIsPaused(true);
      } catch (err) { console.error("Synthesis Init Failed", err); }
    }
    init();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const saveTimer = setTimeout(() => {
      if (data.projectName || data.teamName) { 
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
        axios.post(`${apiUrl}/team/submission`, { content: data }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error("Auto-save failed", err));
      }
    }, 5000); 
    return () => clearTimeout(saveTimer);
  }, [data, mounted]);

  useEffect(() => {
    if (!mounted) return;
    import('socket.io-client').then((module) => {
      const socketIO = module.default || module.io;
      if (socketIO) {
        const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || window.location.origin;
        const socket = socketIO(socketUrl);
        socket.on('timerUpdate', (data) => setIsPaused(data.timerPaused));
        return () => socket.disconnect();
      }
    });
  }, [mounted]);

  if (!mounted) return <div className="min-h-screen bg-[#f1f5f9] animate-pulse" />;

  if (isPaused) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-10 text-center font-sans tracking-tight">
        <div className="max-w-2xl animate-fade-in text-white">
           <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Hackathon Paused</h2>
           <p className="text-teal-400 font-bold uppercase tracking-widest mb-12">Standby for Authorization</p>
           <Link href="/team/dashboard" className="px-8 py-4 bg-white/10 rounded-xl font-black uppercase tracking-widest hover:bg-white/20 transition-all">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  async function handleFileUpload(e, slideId) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
      const res = await axios.post(`${apiUrl}/team/upload-asset`, formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      setData(prev => ({ ...prev, slide_assets: { ...prev.slide_assets, [`s${slideId}_img`]: res.data.fileUrl } }));
    } catch (err) { alert("Upload failed."); } finally { setUploading(false); }
  }

  async function handleSubmit() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/team/generate-pitch-deck`, data, { headers: { Authorization: `Bearer ${token}` } });
      alert("Synthesis Complete ✓");
      router.push('/team/dashboard');
    } catch (err) { alert("Synthesis cluster error."); } finally { setLoading(false); }
  }

  function nextStep() { setStep(prev => Math.min(prev + 1, 17)); window.scrollTo(0,0); }
  function prevStep() { setStep(prev => Math.max(prev - 1, 1)); window.scrollTo(0,0); }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/team/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-[#020617] text-white flex items-center justify-center rounded-lg font-black text-xs group-hover:-translate-x-1 transition-all">←</div>
          <div><h1 className="text-xs font-black uppercase tracking-widest text-[#020617]">Intelligence Synthesis</h1><p className="text-[8px] font-bold text-teal-600 uppercase tracking-widest leading-none mt-1">Institutional Node</p></div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right"><span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Progress</span><div className="text-xs font-black text-[#020617] mt-0.5">SLIDE {step} / 16</div></div>
          <div className="w-8 h-8 relative hidden sm:block"><img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" /></div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto py-8 px-8 animate-fade-in">
        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-3 hidden lg:block">
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2 italic">Modules</h3>
                <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                   {['Identity', 'Strategic Context', 'Problem Statement', 'Impact Matrix', 'Stakeholders', 'Persona Node', 'Gap Analysis', 'Solution Concept', 'Solution Flow', 'Lean Logic', 'Value Metrics', 'Market Positioning', 'Market Sizing', 'Revenue Model', 'Financial Allocation', 'Impact Vision', 'Repository'].map((label, i) => (
                     <button key={i} onClick={() => (i+1) <= step && setStep(i+1)} className={`w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-between ${step === (i+1) ? 'bg-[#020617] text-white shadow-lg' : i+1 < step ? 'text-teal-600 hover:bg-teal-50' : 'text-slate-300 pointer-events-none'}`}>
                        <span className="truncate">{label}</span>{i+1 < step && <span>✓</span>}
                     </button>
                   ))}
                </nav>
             </div>
          </aside>

          <section className="col-span-12 lg:col-span-9 bg-white p-10 rounded-2xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col justify-between overflow-hidden relative">
             <div className="flex-grow z-10">
                 {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">01</span><h2 className="text-xl font-black text-[#020617] uppercase">Identity</h2></div>
                      <div className="grid grid-cols-2 gap-6"><div className="col-span-2"><label className="label-caps">Project Name</label><input className="input-field !text-lg !font-bold" value={data.projectName} onChange={e => setData({...data, projectName: e.target.value})} /></div><div><label className="label-caps">Team Name</label><input className="input-field" value={data.teamName} onChange={e => setData({...data, teamName: e.target.value})} /></div><div><label className="label-caps">Institution</label><input className="input-field" value={data.institutionName} onChange={e => setData({...data, institutionName: e.target.value})} /></div><div><label className="label-caps">Leader</label><input className="input-field" value={data.leaderName} onChange={e => setData({...data, leaderName: e.target.value})} /></div><div><label className="label-caps">Members</label><input className="input-field" value={data.memberNames} onChange={e => setData({...data, memberNames: e.target.value})} /></div></div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">02</span><h2 className="text-xl font-black text-[#020617] uppercase">Strategic Context</h2></div><div className="space-y-6"><div><label className="label-caps">Domain</label><input className="input-field" value={data.s2_domain} onChange={e => setData({...data, s2_domain: e.target.value})} /></div><div><label className="label-caps">Operational Context</label><textarea className="input-field min-h-[120px]" value={data.s2_context} onChange={e => setData({...data, s2_context: e.target.value})} /></div><div><label className="label-caps">Root Catalyst</label><input className="input-field" value={data.s2_rootReason} onChange={e => setData({...data, s2_rootReason: e.target.value})} /></div></div></div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">03</span><h2 className="text-xl font-black text-[#020617] uppercase">Problem Statement</h2></div><div className="space-y-6"><div><label className="label-caps text-rose-500">Core Problem</label><textarea className="input-field min-h-[120px]" value={data.s3_coreProblem} onChange={e => setData({...data, s3_coreProblem: e.target.value})} /></div><div><label className="label-caps">Affected Personnel</label><input className="input-field" value={data.s3_affected} onChange={e => setData({...data, s3_affected: e.target.value})} /></div><div><label className="label-caps">Critical Gravity</label><input className="input-field" value={data.s3_whyItMatters} onChange={e => setData({...data, s3_whyItMatters: e.target.value})} /></div></div></div>
                  )}

                  {step === 4 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">04</span><h2 className="text-xl font-black text-[#020617] uppercase">Impact Matrix</h2></div><div className="max-h-[450px] overflow-y-auto pr-2 custom-scrollbar space-y-3">{data.s4_painPoints.map((pp, idx) => (<div key={idx} className="bg-slate-50 p-4 rounded-xl flex gap-4 items-end border border-slate-100"><div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-100">{idx+1}</div><div className="flex-grow"><input className="input-field !bg-white !py-2 !text-xs" value={pp.point} onChange={e => { let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], point: e.target.value }; setData({...data, s4_painPoints: u}) }} placeholder="Enter pain point facet..." /></div><select className="input-field !bg-white !py-2 !text-[9px] !w-fit font-bold" value={pp.impact} onChange={e => { let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], impact: e.target.value }; setData({...data, s4_painPoints: u}) }}><option>High</option><option>Medium</option><option>Low</option></select><select className="input-field !bg-white !py-2 !text-[9px] !w-fit font-bold" value={pp.freq} onChange={e => { let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], freq: e.target.value }; setData({...data, s4_painPoints: u}) }}><option>Frequent</option><option>Occasional</option><option>Rare</option></select></div>))}</div></div>
                  )}

                  {step === 5 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">05</span><h2 className="text-xl font-black text-[#020617] uppercase">Stakeholders</h2></div><div className="space-y-6"><div><label className="label-caps">Primary Consumers</label><textarea className="input-field min-h-[120px]" value={data.s5_primaryUsers} onChange={e => setData({...data, s5_primaryUsers: e.target.value})} /></div><div><label className="label-caps">Secondary Entities</label><textarea className="input-field min-h-[120px]" value={data.s5_secondaryUsers} onChange={e => setData({...data, s5_secondaryUsers: e.target.value})} /></div></div></div>
                  )}

                  {step === 6 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">06</span><h2 className="text-xl font-black text-[#020617] uppercase">Persona Node</h2></div><div className="grid grid-cols-4 gap-4"><div><label className="label-caps">Name</label><input className="input-field !py-2 !text-xs" value={data.s6_customerName} onChange={e => setData({...data, s6_customerName: e.target.value})} /></div><div><label className="label-caps">Age</label><input className="input-field !py-2 !text-xs" value={data.s6_customerAge} onChange={e => setData({...data, s6_customerAge: e.target.value})} /></div><div><label className="label-caps">Gender</label><input className="input-field !py-2 !text-xs" value={data.s6_customerGender} onChange={e => setData({...data, s6_customerGender: e.target.value})} /></div><div><label className="label-caps">Location</label><input className="input-field !py-2 !text-xs" value={data.s6_customerLocation} onChange={e => setData({...data, s6_customerLocation: e.target.value})} /></div></div><div className="grid grid-cols-2 gap-4"><div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100"><label className="label-caps text-rose-500 mb-2 block">Core Pains</label><textarea className="input-field w-full bg-white border-2 border-rose-200 rounded-lg p-3 min-h-[80px] focus:border-rose-400 text-xs" value={data.s6_pains} onChange={e => setData({...data, s6_pains: e.target.value})} /></div><div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100"><label className="label-caps text-emerald-500 mb-2 block">Success Goals</label><textarea className="input-field w-full bg-white border-2 border-emerald-200 rounded-lg p-3 min-h-[80px] focus:border-emerald-400 text-xs" value={data.s6_goals} onChange={e => setData({...data, s6_goals: e.target.value})} /></div></div></div>
                  )}

                  {step === 7 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">07</span><h2 className="text-xl font-black text-[#020617] uppercase">Gap Analysis</h2></div><div className="grid grid-cols-2 gap-6"><div><label className="label-caps">Status Quo</label><textarea className="input-field min-h-[120px]" value={data.s7_alternatives} onChange={e => setData({...data, s7_alternatives: e.target.value})} /></div><div><label className="label-caps">Limitations</label><textarea className="input-field min-h-[120px]" value={data.s7_limitations} onChange={e => setData({...data, s7_limitations: e.target.value})} /></div><div><label className="label-caps text-teal-600">Gains Creator</label><textarea className="input-field min-h-[100px]" value={data.s7_gainCreators} onChange={e => setData({...data, s7_gainCreators: e.target.value})} /></div><div><label className="label-caps text-rose-600">Pain Reliever</label><textarea className="input-field min-h-[100px]" value={data.s7_painKillers} onChange={e => setData({...data, s7_painKillers: e.target.value})} /></div></div></div>
                  )}

                  {step === 8 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">08</span><h2 className="text-xl font-black text-[#020617] uppercase">Solution Concept</h2></div><div className="space-y-6"><div><label className="label-caps text-teal-600">The Proposed Mission</label><textarea className="input-field min-h-[150px]" value={data.s8_solution} onChange={e => setData({...data, s8_solution: e.target.value})} /></div><div><label className="label-caps text-navy">Core Technology Architecture</label><input className="input-field" placeholder="AI, Blockchain, Web3, Cloud..." value={data.s8_coreTech} onChange={e => setData({...data, s8_coreTech: e.target.value})} /></div></div></div>
                  )}

                  {step === 9 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">09</span><h2 className="text-xl font-black text-[#020617] uppercase">Solution Flow</h2></div><div className="grid grid-cols-2 gap-6"><div><label className="label-caps">One Line Logic</label><input className="input-field font-bold italic" value={data.s9_oneline} onChange={e => setData({...data, s9_oneline: e.target.value})} /></div><div><label className="label-caps">System Process</label><input className="input-field" value={data.s9_howItWorks} onChange={e => setData({...data, s9_howItWorks: e.target.value})} /></div></div><div className="mt-8 border-t pt-6"><label className="label-caps font-black mb-4 block underline">Institutional Workflow (10 Steps)</label><div className="grid grid-cols-2 gap-x-8 gap-y-3">{data.s9_flowSteps.map((sv, i) => (<div key={i} className="flex items-center gap-3"><span className="text-[10px] font-black text-slate-300 w-4">#{i+1}</span><input className="input-field !py-2 !text-xs !bg-slate-50 border-slate-100" value={sv} onChange={e => { let u = [...data.s9_flowSteps]; u[i] = e.target.value; setData({...data, s9_flowSteps: u}) }} /></div>))}</div></div></div>
                  )}

                  {step === 10 && (
                    <div className="space-y-4 animate-fade-in">
                       <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">10</span><h2 className="text-xl font-black text-[#020617] uppercase">Lean Logic</h2></div>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-white rounded-xl border-2 border-slate-200 flex flex-col hover:border-rose-300 transition-all">
                             <label className="label-caps !text-[8px] text-rose-500 mb-1">01. Problem</label>
                             <textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[80px] !text-xs !normal-case" value={data.s10_leanProblem} onChange={e => setData({...data, s10_leanProblem: e.target.value})} placeholder="Market pain point..." />
                          </div>
                          <div className="p-3 bg-white rounded-xl border-2 border-slate-200 flex flex-col hover:border-teal-300 transition-all">
                             <label className="label-caps !text-[8px] text-teal-600 mb-1">02. Solution</label>
                             <textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[40px] !text-xs !normal-case" value={data.s10_leanSolution} onChange={e => setData({...data, s10_leanSolution: e.target.value})} placeholder="High-level fix..." />
                             <div className="mt-2 pt-2 border-t border-slate-100"><label className="label-caps !text-[7px] opacity-60 mb-1">Metrics</label><textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[40px] !text-xs !normal-case" value={data.s10_leanMetrics} onChange={e => setData({...data, s10_leanMetrics: e.target.value})} placeholder="Key numbers..." /></div>
                          </div>
                          <div className="p-3 bg-white rounded-xl border-2 border-teal-200 flex flex-col hover:border-teal-500 transition-all">
                             <label className="label-caps !text-[8px] text-[#020617] mb-1 font-black">03. Value Prop</label>
                             <textarea className="input-field !bg-teal-50/50 !border-0 !p-2 min-h-[90px] !text-xs !normal-case font-bold" value={data.s10_leanUSP} onChange={e => setData({...data, s10_leanUSP: e.target.value})} placeholder="Single compelling message..." />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded-xl border-2 border-slate-200 flex flex-col hover:border-indigo-400 transition-all">
                             <label className="label-caps !text-[8px] text-[#020617] mb-1">04. Unfair Advantage</label>
                             <textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[40px] !text-xs !normal-case" value={data.s10_leanUnfair} onChange={e => setData({...data, s10_leanUnfair: e.target.value})} placeholder="Competitive moat..." />
                             <div className="mt-2 pt-2 border-t border-slate-100"><label className="label-caps !text-[7px] opacity-60 mb-1">Channels</label><textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[40px] !text-xs !normal-case" value={data.s10_leanChannels} onChange={e => setData({...data, s10_leanChannels: e.target.value})} placeholder="Customer path..." /></div>
                          </div>
                          <div className="p-3 bg-white rounded-xl border-2 border-slate-200 flex flex-col hover:border-indigo-600 transition-all">
                             <label className="label-caps !text-[8px] text-indigo-600 mb-1">05. Customer Nodes</label>
                             <textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[90px] !text-xs !normal-case" value={data.s10_leanSegments} onChange={e => setData({...data, s10_leanSegments: e.target.value})} placeholder="Primary cohorts..." />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white rounded-xl border-2 border-rose-200"><label className="label-caps !text-[8px] text-rose-500 mb-1">06. Costs</label><textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[50px] !text-xs !normal-case" value={data.s10_leanCosts} onChange={e => setData({...data, s10_leanCosts: e.target.value})} placeholder="Operating structure (₹)..." /></div>
                          <div className="p-3 bg-white rounded-xl border-2 border-emerald-200"><label className="label-caps !text-[8px] text-emerald-600 mb-1">07. Revenue</label><textarea className="input-field !bg-slate-50 !border-0 !p-2 min-h-[50px] !text-xs !normal-case" value={data.s10_leanRevenue} onChange={e => setData({...data, s10_leanRevenue: e.target.value})} placeholder="Monetization logic (₹)..." /></div>
                       </div>
                    </div>
                  )}

                  {step === 11 && (
                     <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">11</span><h2 className="text-xl font-black text-[#020617] uppercase">Value Metrics</h2></div><div className="grid grid-cols-4 gap-4"><div className="space-y-2"><label className="label-caps text-emerald-500 !text-[8px]">Lifts</label>{data.s11_lifts.map((v, i) => (<input key={i} className="input-field !bg-slate-50 border-slate-100 !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s11_lifts]; u[i] = e.target.value; setData({...data, s11_lifts: u})}} />))}</div><div className="space-y-2"><label className="label-caps text-rose-500 !text-[8px]">Pulls</label>{data.s11_pulls.map((v, i) => (<input key={i} className="input-field !bg-slate-50 border-slate-100 !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s11_pulls]; u[i] = e.target.value; setData({...data, s11_pulls: u})}} />))}</div><div className="space-y-2"><label className="label-caps text-teal-600 !text-[8px]">Fuels</label>{data.s11_fuels.map((v, i) => (<input key={i} className="input-field !bg-slate-50 border-slate-100 !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s11_fuels]; u[i] = e.target.value; setData({...data, s11_fuels: u})}} />))}</div><div className="space-y-2"><label className="label-caps text-navy !text-[8px]">Outcomes</label>{data.s11_outcomes.map((v, i) => (<input key={i} className="input-field !bg-slate-50 border-slate-100 !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s11_outcomes]; u[i] = e.target.value; setData({...data, s11_outcomes: u})}} />))}</div></div></div>
                  )}

                  {step === 12 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">12</span><h2 className="text-xl font-black text-[#020617] uppercase">Positioning</h2></div><div className="space-y-4">{data.s12_competitors.map((c, i) => (<div key={i} className="bg-slate-50 p-6 rounded-2xl grid grid-cols-3 gap-6 border-2 border-slate-100"><div><label className="label-caps">Comp. {i+1}</label><input className="input-field !bg-white border-slate-200" value={c.name} onChange={e => { let u = [...data.s12_competitors]; u[i].name = e.target.value; setData({...data, s12_competitors: u})}} /></div><div><label className="label-caps">Strength</label><input className="input-field !bg-white border-slate-200" value={c.strength} onChange={e => { let u = [...data.s12_competitors]; u[i].strength = e.target.value; setData({...data, s12_competitors: u})}} /></div><div><label className="label-caps">Weakness</label><input className="input-field !bg-white border-slate-200" value={c.weakness} onChange={e => { let u = [...data.s12_competitors]; u[i].weakness = e.target.value; setData({...data, s12_competitors: u})}} /></div></div>))}<div className="bg-teal-50/50 p-8 rounded-3xl grid grid-cols-3 gap-6 border-2 border-teal-200 relative overflow-hidden group shadow-sm"><div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div><div><label className="text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-2">Our Mission</label><input className="w-full bg-white border-2 border-teal-200/50 rounded-xl px-4 py-3 text-[#020617] font-black uppercase text-xs shadow-inner" value={data.s12_ourVenture.name} readOnly /></div><div><label className="text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-2">Unfair Edge</label><input className="w-full bg-white border-2 border-teal-300 rounded-xl px-4 py-3 text-[#020617] italic text-xs outline-none shadow-sm" value={data.s12_ourVenture.strength} onChange={e => setData({...data, s12_ourVenture: {...data.s12_ourVenture, strength: e.target.value}})} /></div><div><label className="text-[9px] font-black text-teal-600 uppercase tracking-widest block mb-2">Market Gap Bridged</label><input className="w-full bg-white border-2 border-teal-300 rounded-xl px-4 py-3 text-[#020617] italic text-xs outline-none shadow-sm" value={data.s12_ourVenture.weakness} onChange={e => setData({...data, s12_ourVenture: {...data.s12_ourVenture, weakness: e.target.value}})} /></div></div></div></div>
                  )}

                  {step === 13 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">13</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Market Sizing (₹)</h2></div><div className="grid grid-cols-3 gap-6">{[ {l: 'TAM', c: 'teal', k: 's13_tam', m: '500 Cr'}, {l: 'SAM', c: 'orange', k: 's13_sam', m: '10 Cr'}, {l: 'SOM', c: 'navy', k: 's13_som', m: '20 Lakhs'} ].map((m, i) => (<div key={i} className="p-6 bg-white rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-slate-300"><label className={`label-caps !text-${m.c}-600`}>{m.l}</label><input className="input-field !bg-slate-50 border-slate-100 !text-lg font-black" placeholder={`Ex: ₹${m.m}`} value={data[m.k]} onChange={e => setData({...data, [m.k]: e.target.value})} /></div>))}</div><div className="mt-8"><label className="label-caps">Valuation Logic & Research Basis (Rupees)</label><textarea className="input-field border-2 border-slate-100 !bg-white min-h-[120px]" placeholder="Explain research methodology for ₹ sizing..." value={data.s13_marketLogic} onChange={e => setData({...data, s13_marketLogic: e.target.value})} /></div></div>
                  )}

                  {step === 14 && (
                    <div className="space-y-8 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">14</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Revenue Model (₹)</h2></div><div className="grid grid-cols-2 gap-10"><div><label className="label-caps text-teal-600 underline">Primary Stream</label><input className="input-field font-black uppercase text-teal-600 border-2 border-teal-100 mb-6" value={data.s14_primaryStream} onChange={e => setData({...data, s14_primaryStream: e.target.value})} /><label className="label-caps">Secondary Nodes</label><input className="input-field font-black uppercase border-2 border-slate-100" value={data.s14_secondaryStream} onChange={e => setData({...data, s14_secondaryStream: e.target.value})} /></div><div><label className="label-caps">Pricing Strategy (₹)</label><input className="input-field font-black border-2 border-slate-100 mb-6" value={data.s14_pricingStrategy} onChange={e => setData({...data, s14_pricingStrategy: e.target.value})} /><label className="label-caps">Economic Logic (Rupees)</label><textarea className="input-field min-h-[100px] border-2 border-slate-100" value={data.s14_revenueLogic} onChange={e => setData({...data, s14_revenueLogic: e.target.value})} /></div></div></div>
                  )}

                  {step === 15 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">15</span><h2 className="text-xl font-black text-[#020617] uppercase">Financial Allocation</h2></div><div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm table-fixed w-full"><table className="w-full text-left font-sans"><thead>
                                 <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <th className="px-6 py-4">Allocation Item</th>
                                    <th className="px-6 py-4 text-right">Value Descriptor / Pricing (₹)</th>
                                 </tr>
                              </thead><tbody className="divide-y divide-slate-100">{data.s15_allocations.map((alloc, i) => (<tr key={i} className="hover:bg-slate-50 transition-all"><td className="px-6 py-3"><input className="w-full bg-white border-2 border-slate-200 rounded-lg py-3 px-4 font-black uppercase text-xs text-[#020617] focus:border-teal-500 shadow-sm" value={alloc.category} onChange={e => { let u = [...data.s15_allocations]; u[i].category = e.target.value; setData({...data, s15_allocations: u}) }} placeholder="EX: PRODUCT NODES" /></td><td className="px-6 py-3 text-right"><input className="w-full bg-white border-2 border-slate-200 rounded-lg py-3 px-4 font-bold text-xs text-teal-600 text-right focus:border-teal-500 shadow-sm" value={alloc.amount} onChange={e => { let u = [...data.s15_allocations]; u[i].amount = e.target.value; setData({...data, s15_allocations: u}) }} placeholder="₹ 0.00" /></td></tr>))}</tbody></table></div></div>
                  )}

                  {step === 16 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded">16</span><h2 className="text-xl font-black text-[#020617] uppercase">Success Vision</h2></div><div className="space-y-8"><div><label className="label-caps">Social/Economic Impact</label><textarea className="input-field border-2 border-slate-100 min-h-[140px]" value={data.s16_socialEconomic} onChange={e => setData({...data, s16_socialEconomic: e.target.value})} /></div><div><label className="label-caps text-teal-600">Institutional Vision Boundary</label><input className="input-field border-2 border-teal-100 font-bold" value={data.s16_vision} onChange={e => setData({...data, s16_vision: e.target.value})} /></div></div></div>
                  )}

                  {step === 17 && (
                    <div className="space-y-12 animate-fade-in flex flex-col items-center justify-center text-center py-20"><div className="text-6xl mb-8 animate-bounce">🏛️</div><div className="space-y-4"><h2 className="text-4xl font-black text-navy uppercase tracking-tighter">Synthesis Authorization</h2><p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest leading-loose max-w-lg">All mission coordinates verified. Choose your submission protocols below: Generate immediately or save state for later review.</p></div></div>
                  )}
             </div>

             <footer className="mt-12 pt-8 border-t border-slate-100 relative z-20 flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-3 ml-auto">
                   {step > 1 && <button onClick={prevStep} className="px-8 py-4 rounded-xl border-2 border-slate-100 text-[11px] font-black uppercase text-slate-400 hover:text-navy hover:border-navy transition-all">Back</button>}
                   {step < 17 ? (
                     <button onClick={nextStep} className="bg-navy text-white px-10 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-teal-500 transition-all shadow-2xl active:scale-95">Proceed Journey</button>
                   ) : (
                     <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/team/dashboard')} className="px-8 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest text-slate-400 hover:bg-slate-100 hover:text-navy transition-all">SAVE & RETURN</button>
                        <button onClick={handleSubmit} disabled={loading} className="bg-teal-500 text-navy px-12 py-5 rounded-2xl font-black uppercase text-[13px] tracking-widest hover:bg-navy hover:text-white transition-all shadow-2xl active:scale-95 border-b-4 border-teal-700">
                            {loading ? 'SYNTHESIZING ARTIFACT...' : 'GENERATE & SUBMIT'}
                        </button>
                     </div>
                   )}
                </div>
             </footer>
          </section>
        </div>
      </main>
      <style jsx global>{`
        .input-field { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .input-field:focus { box-shadow: 0 0 15px rgba(20, 184, 166, 0.15); transform: translateY(-1px); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}
