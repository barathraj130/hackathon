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
    // S8: Solution Flow
    s8_oneline: '', s8_howItWorks: '', 
    s8_flowSteps: Array(10).fill(''),
    // S9: Lean Canvas
    s9_leanProblem: '', s9_leanSolution: '', s9_leanMetrics: '', s9_leanUSP: '', 
    s9_leanUnfair: '', s9_leanChannels: '', s9_leanSegments: '', s9_leanCosts: '', s9_leanRevenue: '',
    s9_leanConcepts: '', s9_leanAdopters: '', s9_leanAlternatives: '',
    // S10: Value Metrics
    s10_lifts: Array(5).fill(''),
    s10_pulls: Array(5).fill(''),
    s10_fuels: Array(5).fill(''),
    s10_outcomes: Array(5).fill(''),
    // S11: Market Positioning (2 Competitors vs Ours)
    s11_competitors: [
      { name: '', strength: '', weakness: '' },
      { name: '', strength: '', weakness: '' }
    ],
    s11_ourVenture: { name: 'Our Venture', strength: '', weakness: '' },
    // S12: Market Sizing (TAM SAM SOM)
    s12_tam: '', s12_sam: '', s12_som: '', s12_marketLogic: '',
    // S13: Revenue Model
    s13_primaryStream: '', s13_secondaryStream: '', s13_pricingStrategy: '', s13_revenueLogic: '',
    // S14: Financial Allocation (Decentralized Sovereignty)
    s14_allocations: [
      { category: '', amount: '' },
      { category: '', amount: '' },
      { category: '', amount: '' },
      { category: '', amount: '' },
      { category: '', amount: '' }
    ],
    // S15: Impact Vision
    s15_socialEconomic: '', s15_metrics: '', s15_vision: '',
    // S16: Closure
    slide_assets: {}
  });
  
  useEffect(() => {
    setMounted(true);
    checkStatus();
  }, []);

  async function checkStatus() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await axios.get(`${apiUrl}/team/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.submission?.pptUrl && !res.data.submission.canRegenerate) {
         router.push('/team/dashboard');
      } else if (res.data.submission?.content) {
         setData(prev => ({ ...prev, ...res.data.submission.content }));
      }
      
      const statsRes = await axios.get(`${apiUrl.replace('/v1', '')}/health`);
      if (statsRes.data?.timerPaused) setIsPaused(true);

    } catch (err) {
      console.error("Status check failed", err);
    }
  }

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
      if (!socketIO) return;
      const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/v1', '') || process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
      const socket = socketIO(socketUrl);
      socket.on('timerUpdate', (data) => setIsPaused(data.timerPaused));
      return () => socket.disconnect();
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
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      updateAsset(`${slideId}_img`, res.data.fileUrl);
    } catch (err) {
      alert("Upload failed. Use external link if needed.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${apiUrl}/team/generate-pitch-deck`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(res.data.message || "Synthesis Success.");
      router.push('/team/dashboard');
    } catch (err) {
      alert(`Synthesis Error: ${err.response?.data?.error || "Unknown Failure"}`);
    } finally {
      setLoading(false);
    }
  }

  function nextStep() { setStep(prev => Math.min(prev + 1, 16)); window.scrollTo(0,0); }
  function prevStep() { setStep(prev => Math.max(prev - 1, 1)); window.scrollTo(0,0); }

  function updateAsset(slideId, val) {
    setData(prev => ({
      ...prev,
      slide_assets: { ...prev.slide_assets, [slideId]: val }
    }));
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-3 flex justify-between items-center shadow-sm">
        <Link href="/team/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-[#020617] text-white flex items-center justify-center rounded-lg font-black text-xs transition-transform group-hover:-translate-x-1">←</div>
          <div className="hidden sm:block">
            <h1 className="text-xs font-black uppercase tracking-widest text-[#020617]">Intelligence Synthesis</h1>
            <p className="text-[8px] font-bold text-teal-600 uppercase tracking-widest leading-none mt-1">Institutional Node</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right">
             <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Mission Progress</span>
             <div className="text-xs font-black text-[#020617] mt-0.5">SLIDE {step} / 16</div>
          </div>
          <div className="w-8 h-8 relative hidden sm:block">
             <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto py-6 md:py-8 px-4 md:px-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="hidden lg:block lg:col-span-3">
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-24">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2 italic">Synthesis Modules</h3>
                <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-1">
                   {[
                     'Identity', 'Strategic Context', 'Problem Statement', 'Impact Matrix', 'Stakeholders',
                     'Persona Node', 'Gap Analysis', 'Solution Flow', 'Lean Logic', 'Value Metrics',
                     'Market Positioning', 'Market Sizing', 'Revenue Model', 'Financial Allocation', 'Impact Vision', 'Repository'
                   ].map((label, i) => (
                     <button 
                        key={i} 
                        onClick={() => (i+1) <= step && setStep(i+1)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-between ${step === (i+1) ? 'bg-[#020617] text-white shadow-lg' : i+1 < step ? 'text-teal-600 hover:bg-teal-50' : 'text-slate-300 pointer-events-none'}`}
                     >
                        <span className="truncate">{label}</span>
                        {i+1 < step && <span>✓</span>}
                     </button>
                   ))}
                </nav>
             </div>
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white p-6 md:p-10 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden min-h-[600px] flex flex-col justify-between">
               <div className="relative z-10 flex-grow">
                 {step === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">01</span>
                        <h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Identity & Context</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="md:col-span-2">
                           <label className="label-caps">Project Name</label>
                           <input name="projectName" className="input-field !text-lg !font-bold" value={data.projectName} onChange={handleInputChange} />
                         </div>
                         <div><label className="label-caps">Team Name</label><input name="teamName" className="input-field" value={data.teamName} onChange={handleInputChange} /></div>
                         <div><label className="label-caps">Institution</label><input name="institutionName" className="input-field" value={data.institutionName} onChange={e => setData({...data, institutionName: e.target.value})} /></div>
                         <div><label className="label-caps">Leader</label><input name="leaderName" className="input-field" value={data.leaderName} onChange={handleInputChange} /></div>
                         <div><label className="label-caps">Members</label><input name="memberNames" className="input-field" value={data.memberNames} onChange={handleInputChange} /></div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">02</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Strategic Context</h2></div>
                      <div className="space-y-6">
                        <div><label className="label-caps">Domain</label><input className="input-field" value={data.s2_domain} onChange={e => setData({...data, s2_domain: e.target.value})} /></div>
                        <div><label className="label-caps">Context</label><textarea className="input-field min-h-[120px]" value={data.s2_context} onChange={e => setData({...data, s2_context: e.target.value})} /></div>
                        <div><label className="label-caps">Root Cause</label><input className="input-field" value={data.s2_rootReason} onChange={e => setData({...data, s2_rootReason: e.target.value})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">03</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Problem Statement</h2></div>
                      <div className="space-y-6">
                        <div><label className="label-caps">Core Problem</label><textarea className="input-field min-h-[120px]" value={data.s3_coreProblem} onChange={e => setData({...data, s3_coreProblem: e.target.value})} /></div>
                        <div><label className="label-caps">Affected Personnel</label><input className="input-field" value={data.s3_affected} onChange={e => setData({...data, s3_affected: e.target.value})} /></div>
                        <div><label className="label-caps">Critical Gravity</label><input className="input-field" value={data.s3_whyItMatters} onChange={e => setData({...data, s3_whyItMatters: e.target.value})} /></div>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4 animate-fade-in">
                       <div className="flex items-center gap-3 mb-4"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">04</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Impact Matrix</h2></div>
                       <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                          {data.s4_painPoints.map((pp, idx) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl flex gap-4 items-end">
                               <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-100">{idx+1}</div>
                               <div className="flex-grow"><input className="input-field !bg-white !py-2 !text-xs" value={pp.point} onChange={e => {
                                  let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], point: e.target.value }; setData({...data, s4_painPoints: u});
                               }} placeholder="Problem facet..." /></div>
                               <select className="input-field !bg-white !py-2 !text-[9px] !w-fit" value={pp.impact} onChange={e => {
                                  let u = [...data.s4_painPoints]; u[idx] = { ...u[idx], impact: e.target.value }; setData({...data, s4_painPoints: u});
                               }}><option>High</option><option>Medium</option><option>Low</option></select>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">05</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Stakeholders</h2></div>
                       <div className="space-y-6">
                        <div><label className="label-caps">Primary Nodes</label><textarea className="input-field min-h-[120px]" value={data.s5_primaryUsers} onChange={e => setData({...data, s5_primaryUsers: e.target.value})} /></div>
                        <div><label className="label-caps">Secondary Nodes</label><textarea className="input-field min-h-[120px]" value={data.s5_secondaryUsers} onChange={e => setData({...data, s5_secondaryUsers: e.target.value})} /></div>
                       </div>
                    </div>
                  )}

                  {step === 6 && (
                    <div className="space-y-6 animate-fade-in max-h-[550px] overflow-y-auto pr-2">
                       <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">06</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Persona Node</h2></div>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <div><label className="label-caps">Name</label><input className="input-field !py-2 !text-xs" value={data.s6_customerName} onChange={e => setData({...data, s6_customerName: e.target.value})} /></div>
                         <div><label className="label-caps">Age</label><input className="input-field !py-2 !text-xs" value={data.s6_customerAge} onChange={e => setData({...data, s6_customerAge: e.target.value})} /></div>
                         <div><label className="label-caps">Gender</label><input className="input-field !py-2 !text-xs" value={data.s6_customerGender} onChange={e => setData({...data, s6_customerGender: e.target.value})} /></div>
                         <div><label className="label-caps">Locality</label><input className="input-field !py-2 !text-xs" value={data.s6_customerLocation} onChange={e => setData({...data, s6_customerLocation: e.target.value})} /></div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-rose-50 rounded-xl border border-rose-100"><label className="label-caps text-rose-500">Pains</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[80px]" value={data.s6_pains} onChange={e => setData({...data, s6_pains: e.target.value})} /></div>
                         <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100"><label className="label-caps text-emerald-500">Goals</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[80px]" value={data.s6_goals} onChange={e => setData({...data, s6_goals: e.target.value})} /></div>
                       </div>
                       <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                          <div className="space-y-2">
                             <label className="label-caps">Personality</label>
                             {Object.entries(data.s6_personality).map(([k, v]) => (
                               <div key={k} className="flex items-center gap-4"><span className="text-[8px] font-black uppercase w-16">{k}</span><input type="range" className="flex-grow h-1 accent-[#020617]" value={v} onChange={e => { let u = {...data.s6_personality, [k]: parseInt(e.target.value)}; setData({...data, s6_personality: u}) }} /><span className="text-[8px] font-black w-6 text-right">{v}%</span></div>
                             ))}
                          </div>
                          <div className="space-y-2">
                             <label className="label-caps">Motivations</label>
                             {Object.entries(data.s6_motivations).map(([k, v]) => (
                               <div key={k} className="flex items-center gap-4"><span className="text-[8px] font-black uppercase w-16">{k}</span><input type="range" className="flex-grow h-1 accent-orange-500" value={v} onChange={e => { let u = {...data.s6_motivations, [k]: parseInt(e.target.value)}; setData({...data, s6_motivations: u}) }} /><span className="text-[8px] font-black w-6 text-right">{v}%</span></div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 7 && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">07</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Gap Analysis</h2></div>
                       <div className="grid grid-cols-2 gap-6">
                        <div><label className="label-caps">Status Quo</label><textarea className="input-field min-h-[120px]" value={data.s7_alternatives} onChange={e => setData({...data, s7_alternatives: e.target.value})} /></div>
                        <div><label className="label-caps">Limitations</label><textarea className="input-field min-h-[120px]" value={data.s7_limitations} onChange={e => setData({...data, s7_limitations: e.target.value})} /></div>
                        <div><label className="label-caps text-teal-600">Gains</label><textarea className="input-field min-h-[100px] border-teal-50" value={data.s7_gainCreators} onChange={e => setData({...data, s7_gainCreators: e.target.value})} /></div>
                        <div><label className="label-caps text-[#020617]">Relief</label><textarea className="input-field min-h-[100px] border-teal-50" value={data.s7_painKillers} onChange={e => setData({...data, s7_painKillers: e.target.value})} /></div>
                       </div>
                    </div>
                  )}

                  {step === 8 && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">08</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Solution Flow</h2></div>
                       <div className="grid grid-cols-2 gap-6">
                        <div><label className="label-caps">Proposed Solution</label><input className="input-field" value={data.s8_oneline} onChange={e => setData({...data, s8_oneline: e.target.value})} /></div>
                        <div><label className="label-caps">Logic</label><input className="input-field" value={data.s8_howItWorks} onChange={e => setData({...data, s8_howItWorks: e.target.value})} /></div>
                       </div>
                       <div className="pt-6">
                          <label className="label-caps font-black italic">Execution Path (10 Phases)</label>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 max-h-[250px] overflow-y-auto">
                             {data.s8_flowSteps.map((sVal, idx) => (
                               <div key={idx} className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-300 w-4">{idx+1}</span><input className="input-field !py-2 !text-xs !bg-slate-50 border-none" value={sVal} onChange={e => { let u = [...data.s8_flowSteps]; u[idx] = e.target.value; setData({...data, s8_flowSteps: u}) }} /></div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 9 && (
                    <div className="space-y-4 animate-fade-in max-h-[550px] overflow-y-auto pr-2">
                       <div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">09</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Lean Logic</h2></div>
                       <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><label className="label-caps !text-[8px]">Problem</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-xs" value={data.s9_leanProblem} onChange={e => setData({...data, s9_leanProblem: e.target.value})} /></div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><label className="label-caps !text-[8px]">Solution</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-xs" value={data.s9_leanSolution} onChange={e => setData({...data, s9_leanSolution: e.target.value})} /></div>
                          <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-100"><label className="label-caps !text-[8px] text-teal-600">Value Prop</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-xs" value={data.s9_leanUSP} onChange={e => setData({...data, s9_leanUSP: e.target.value})} /></div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><label className="label-caps !text-[8px]">Advantage</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-xs" value={data.s9_leanUnfair} onChange={e => setData({...data, s9_leanUnfair: e.target.value})} /></div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><label className="label-caps !text-[8px]">Channels</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-xs" value={data.s9_leanChannels} onChange={e => setData({...data, s9_leanChannels: e.target.value})} /></div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100"><label className="label-caps !text-[8px]">Segments</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-xs" value={data.s9_leanSegments} onChange={e => setData({...data, s9_leanSegments: e.target.value})} /></div>
                       </div>
                       <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100"><label className="label-caps !text-[8px] text-rose-500">Costs</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[40px] !text-xs" value={data.s9_leanCosts} onChange={e => setData({...data, s9_leanCosts: e.target.value})} /></div>
                          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100"><label className="label-caps !text-[8px] text-emerald-600">Revenue</label><textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[40px] !text-xs" value={data.s9_leanRevenue} onChange={e => setData({...data, s9_leanRevenue: e.target.value})} /></div>
                       </div>
                    </div>
                  )}

                  {step === 10 && (
                     <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">10</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Value Metrics</h2></div><div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2"><label className="label-caps text-emerald-500 !text-[8px]">🎈 Lifts</label>{data.s10_lifts.map((v, i) => (<input key={i} className="input-field !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s10_lifts]; u[i] = e.target.value; setData({...data, s10_lifts: u})}} />))}</div>
                        <div className="space-y-2"><label className="label-caps text-rose-500 !text-[8px]">⚓ Pulls</label>{data.s10_pulls.map((v, i) => (<input key={i} className="input-field !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s10_pulls]; u[i] = e.target.value; setData({...data, s10_pulls: u})}} />))}</div>
                        <div className="space-y-2"><label className="label-caps text-teal-600 !text-[8px]">⚡ Fuels</label>{data.s10_fuels.map((v, i) => (<input key={i} className="input-field !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s10_fuels]; u[i] = e.target.value; setData({...data, s10_fuels: u})}} />))}</div>
                        <div className="space-y-2"><label className="label-caps text-navy !text-[8px]">🏁 Outcomes</label>{data.s10_outcomes.map((v, i) => (<input key={i} className="input-field !py-2 !text-[9px]" value={v} onChange={e => { let u = [...data.s10_outcomes]; u[i] = e.target.value; setData({...data, s10_outcomes: u})}} />))}</div>
                     </div></div>
                  )}

                  {step === 11 && (
                     <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">11</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Market Positioning</h2></div>
                        <div className="space-y-4">
                           {data.s11_competitors.map((c, i) => (
                              <div key={i} className="bg-slate-50 p-6 rounded-2xl grid grid-cols-3 gap-6 border border-slate-100">
                                 <div><label className="label-caps !text-[8px]">Competitor {i+1}</label><input className="input-field !bg-white" value={c.name} onChange={e => { let u = [...data.s11_competitors]; u[i].name = e.target.value; setData({...data, s11_competitors: u})}} /></div>
                                 <div><label className="label-caps !text-[8px]">Strengths</label><input className="input-field !bg-white" value={c.strength} onChange={e => { let u = [...data.s11_competitors]; u[i].strength = e.target.value; setData({...data, s11_competitors: u})}} /></div>
                                 <div><label className="label-caps !text-[8px]">Weaknesses</label><input className="input-field !bg-white" value={c.weakness} onChange={e => { let u = [...data.s11_competitors]; u[i].weakness = e.target.value; setData({...data, s11_competitors: u})}} /></div>
                              </div>
                           ))}
                           <div className="bg-slate-800 p-8 rounded-3xl grid grid-cols-3 gap-6 shadow-2xl relative overflow-hidden group border border-slate-700">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                              <div><label className="text-[9px] font-black text-teal-300 uppercase tracking-widest block mb-2">OUR VENTURE</label><input className="w-full bg-slate-900 border border-teal-500/30 rounded-xl px-4 py-3 text-white font-black uppercase text-xs" value={data.s11_ourVenture.name} readOnly /></div>
                              <div><label className="text-[9px] font-black text-teal-300 uppercase tracking-widest block mb-2">UNFAIR ADVANTAGE</label><input className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white italic text-xs focus:border-teal-400 outline-none transition-all" value={data.s11_ourVenture.strength} onChange={e => setData({...data, s11_ourVenture: {...data.s11_ourVenture, strength: e.target.value}})} placeholder="Ex: Patented AI Synthesis Model" /></div>
                              <div><label className="text-[9px] font-black text-teal-300 uppercase tracking-widest block mb-2">GAP BEING BRIDGED</label><input className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white italic text-xs focus:border-teal-400 outline-none transition-all" value={data.s11_ourVenture.weakness} onChange={e => setData({...data, s11_ourVenture: {...data.s11_ourVenture, weakness: e.target.value}})} placeholder="Ex: Real-time decentralization" /></div>
                           </div>
                        </div>
                     </div>
                  )}

                  {step === 12 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">12</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Market Sizing (TAM SAM SOM)</h2></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><label className="label-caps !text-teal-600">TAM (Total Market)</label><input className="input-field !bg-white !text-lg font-black" placeholder="Ex: $500B" value={data.s12_tam} onChange={e => setData({...data, s12_tam: e.target.value})} /><p className="text-[8px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Total demand for product</p></div>
                           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><label className="label-caps !text-orange-500">SAM (Serviceable)</label><input className="input-field !bg-white !text-lg font-black" placeholder="Ex: $10B" value={data.s12_sam} onChange={e => setData({...data, s12_sam: e.target.value})} /><p className="text-[8px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Target segment share</p></div>
                           <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100"><label className="label-caps !text-navy">SOM (Obtainable)</label><input className="input-field !bg-white !text-lg font-black" placeholder="Ex: $200M" value={data.s12_som} onChange={e => setData({...data, s12_som: e.target.value})} /><p className="text-[8px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Realistic first 3-5 years</p></div>
                        </div>
                        <div className="mt-8"><label className="label-caps">Market logic & Evidence</label><textarea className="input-field min-h-[120px]" placeholder="Explain your calculations and data sources..." value={data.s12_marketLogic} onChange={e => setData({...data, s12_marketLogic: e.target.value})} /></div>
                    </div>
                  )}

                  {step === 13 && (
                    <div className="space-y-8 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">13</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Revenue Model</h2></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-6">
                              <div><label className="label-caps">Primary Revenue Stream</label><input className="input-field font-black uppercase text-teal-600" placeholder="Ex: SaaS Subscription" value={data.s13_primaryStream} onChange={e => setData({...data, s13_primaryStream: e.target.value})} /></div>
                              <div><label className="label-caps">Secondary Revenue Stream</label><input className="input-field font-black uppercase" placeholder="Ex: Marketplace Commission" value={data.s13_secondaryStream} onChange={e => setData({...data, s13_secondaryStream: e.target.value})} /></div>
                           </div>
                           <div className="space-y-6">
                              <div><label className="label-caps">Pricing Strategy</label><input className="input-field font-black" placeholder="Ex: $29/mo Tiered Pricing" value={data.s13_pricingStrategy} onChange={e => setData({...data, s13_pricingStrategy: e.target.value})} /></div>
                              <div><label className="label-caps">Economic Logic (Scaling)</label><textarea className="input-field min-h-[80px] text-xs font-bold" placeholder="How do unit economics work at scale?" value={data.s13_revenueLogic} onChange={e => setData({...data, s13_revenueLogic: e.target.value})} /></div>
                           </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Standard Logic</p>
                           <p className="text-xs text-slate-500 mt-2 leading-relaxed">Synthesis of World-Class revenue models prioritizing Customer Lifetime Value (LTV) relative to Acquisition Cost (CAC).</p>
                        </div>
                    </div>
                  )}

                  {step === 14 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">14</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Financial Allocation</h2></div>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                           <table className="w-full text-left">
                              <thead>
                                 <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    <th className="px-6 py-4">Allocation Item</th>
                                    <th className="px-6 py-4 text-right">Value Descriptor / Pricing</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {data.s14_allocations.map((alloc, i) => (
                                    <tr key={i}>
                                       <td className="px-6 py-4"><input className="w-full bg-transparent font-black uppercase text-xs text-[#020617] outline-none" placeholder={`Item ${i+1}`} value={alloc.category} onChange={e => { let u = [...data.s14_allocations]; u[i].category = e.target.value; setData({...data, s14_allocations: u}) }} /></td>
                                       <td className="px-6 py-4"><input className="w-full bg-transparent font-bold text-xs text-teal-600 outline-none text-right" placeholder="Ex: $500 / 20%" value={alloc.amount} onChange={e => { let u = [...data.s14_allocations]; u[i].amount = e.target.value; setData({...data, s14_allocations: u}) }} /></td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center mt-4 italic opacity-70">Design categories in the left column // Assign valuations in the right column</p>
                    </div>
                  )}

                  {step === 15 && (
                    <div className="space-y-6 animate-fade-in"><div className="flex items-center gap-3"><span className="text-[10px] font-black bg-[#020617] text-white px-3 py-1 rounded uppercase tracking-widest">15</span><h2 className="text-xl font-black text-[#020617] uppercase tracking-tight">Success Vision</h2></div>
                        <div className="space-y-6"><div><label className="label-caps">Broad Impact</label><textarea className="input-field min-h-[120px]" value={data.s15_socialEconomic} onChange={e => setData({...data, s15_socialEconomic: e.target.value})} /></div><div><label className="label-caps">Long-term Vision</label><input className="input-field" value={data.s15_vision} onChange={e => setData({...data, s15_vision: e.target.value})} /></div></div>
                    </div>
                  )}

                  {step === 16 && (
                    <div className="space-y-12 animate-fade-in flex flex-col items-center justify-center text-center py-10"><div className="text-5xl mb-6">🏛️</div><div className="space-y-4"><h2 className="text-3xl font-black text-navy uppercase tracking-tight">Synthesis Seal</h2><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">All modules verified for generation.</p></div></div>
                  )}
               </div>

               <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                  {step < 16 && (
                    <div className="flex-1 space-y-2">
                       <label className="label-caps !mb-2 opacity-50">Reference Asset</label>
                       <div className="flex gap-2">
                          <input type="file" id="up" className="hidden" onChange={e => handleFileUpload(e, step)} /><label htmlFor="up" className="bg-slate-100 px-4 py-2 rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-slate-200">{uploading ? '...' : 'Upload'}</label>
                          <input className="input-field !py-2 !text-xs flex-grow" placeholder="External Asset URL..." value={data.slide_assets[`s${step}_img`] || ''} onChange={e => updateAsset(`s${step}_img`, e.target.value)} />
                       </div>
                    </div>
                  )}
               </div>

               <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 relative z-10">
                  {step > 1 && <button onClick={prevStep} className="px-6 py-3 rounded-xl border border-slate-200 text-[10px] font-black uppercase text-slate-400 hover:text-navy transition-all">Back</button>}
                  {step < 16 ? (
                    <button onClick={nextStep} className="ml-auto bg-[#020617] text-white px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-500 transition-all shadow-xl active:scale-95">Proceed Journey →</button>
                  ) : (
                    <button onClick={handleSubmit} disabled={loading} className="ml-auto bg-teal-500 text-white px-10 py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#020617] transition-all shadow-xl active:scale-95">
                      {loading ? 'Synthesizing...' : 'Initialize Final Synthesis'}
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
