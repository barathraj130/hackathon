'use client';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PitchGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    const checkStatus = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${apiUrl}/team/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // If they already have a PPT and it's locked, don't let them stay here
        if (res.data.submission?.pptUrl && !res.data.submission.canRegenerate) {
           router.push('/team/dashboard');
        }
      } catch (err) {
        console.error("Status check failed", err);
      }
    };
    checkStatus();
  }, [router]);
  
  const [data, setData] = useState({
    // S1: Identity
    projectName: '', teamName: '', institutionName: '',
    // S2: Background
    s2_domain: '', s2_context: '', s2_rootReason: '',
    // S3: Problem
    s3_coreProblem: '', s3_affected: '', s3_whyItMatters: '',
    // S4: Impact Mapping (Expanded to 10)
    s4_painPoints: Array(10).fill({ point: '', impact: 'High', freq: 'Frequent' }),
    // S5: Stakeholders
    s5_primaryUsers: '', s5_secondaryUsers: '',
    // S6: Persona & JTBD (Atomic Fields)
    s6_customerName: '', s6_customerJob: '', s6_customerAge: '', s6_customerLocation: '', s6_customerEthos: '',
    s6_pains: '', s6_gains: '', s6_bio: '', s6_goals: '', 
    s6_personality: { introvert: 50, thinking: 50, sensing: 50, judging: 50 },
    s6_motivations: { growth: 50, fear: 50, security: 50, recognition: 50, funding: 50 },
    // S7: Gap Analysis
    s7_alternatives: '', s7_limitations: '',
    // S8: Solution Synthesis (10 Flow Steps)
    s8_oneline: '', s8_howItWorks: '', 
    s8_flowSteps: Array(10).fill(''),
    // S9: Lean Canvas
    s9_leanProblem: '', s9_leanSolution: '', s9_leanMetrics: '', s9_leanUSP: '', 
    s9_leanUnfair: '', s9_leanChannels: '', s9_leanSegments: '', s9_leanCosts: '', s9_leanRevenue: '',
    s9_leanConcepts: '', s9_leanAdopters: '', s9_leanAlternatives: '',
    // S10: Value Identification (5 items per category)
    s10_lifts: Array(5).fill(''),
    s10_pulls: Array(5).fill(''),
    s10_fuels: Array(5).fill(''),
    s10_outcomes: Array(5).fill(''),
    // S11: Market Positioning
    s11_competitors: [
      { name: '', strength: '', weakness: '' },
      { name: '', strength: '', weakness: '' }
    ],
    // S12: Business Model
    s12_revenueModel: '', s12_pricingLogic: '',
    // S13: Financials
    s13_devCost: '', s13_opsCost: '', s13_toolsCost: '',
    // S14: Impact & Scope
    s14_socialEconomic: '', s14_metrics: '', s14_vision: '',
    // S15: Closure
    slide_assets: {}
  });

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e, slideId) => {
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
      alert("Asset upload failed. Please use external link as backup.");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${apiUrl}/team/generate-pitch-deck`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("🌟 Expert Synthesis Success:", res.data);
      alert(res.data.message || "Venture-Journey Synthesis Complete. Final Artifact generated in repository.");
      router.push('/team/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || "Synthesis failed.";
      alert(`Synthesis Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const updateAsset = (slideId, val) => {
    setData(prev => ({
      ...prev,
      slide_assets: { ...prev.slide_assets, [slideId]: val }
    }));
  };

  return (
    <div className="min-h-screen bg-bg-light p-10 font-sans flex items-center justify-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-teal/5 blur-[120px] rounded-full z-0 rotate-12"></div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-royal/5 blur-[100px] rounded-full z-0"></div>

      <div className="fixed top-0 left-0 w-full h-1.5 bg-slate-100 z-50">
        <div 
          className="h-full bg-navy transition-all duration-700" 
          style={{ width: `${(step / 15) * 100}%` }}
        ></div>
      </div>
        <div className="glass-pane rounded-[3rem] shadow-2xl shadow-navy/5 border border-white/50 overflow-hidden bg-white/70">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
            
            {/* Sidebar Status */}
            <div className="lg:col-span-4 bg-navy p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden min-h-[400px] lg:min-h-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <Link href="/team/dashboard" className="text-[9px] font-black uppercase tracking-[0.3em] text-teal hover:text-white transition-colors flex items-center gap-3">
                    <span className="w-5 h-px bg-current"></span> Sequential Return
                  </Link>
                  <div className="w-12 h-12 relative lg:hidden">
                    <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase leading-tight mb-4">hack@jit <br/>Engine</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose max-w-[200px]">
                  JIT Institutional Standard v4.0
                </p>
              </div>

              <div className="relative z-10 w-full">
                <div className="flex flex-col gap-2">
                  {[...Array(15)].map((_, i) => {
                    const s = i + 1;
                    return (
                      <div key={s} className="flex items-center gap-4 group cursor-pointer" onClick={() => s < step && setStep(s)}>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[7px] font-black transition-all ${step === s ? 'bg-teal border-teal text-white' : s < step ? 'bg-white border-white text-navy' : 'border-white/10 text-white/20'}`}>
                          {s < step ? '✓' : s}
                        </div>
                        {step === s && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-white animate-fade-in">
                             {s === 1 && 'Identity'}
                             {s === 2 && 'Background'}
                             {s === 3 && 'Problem'}
                             {s === 4 && 'Impact'}
                             {s === 5 && 'Stakeholders'}
                             {s === 6 && 'Persona'}
                             {s === 7 && 'Gaps'}
                             {s === 8 && 'Solution'}
                             {s === 9 && 'Features'}
                             {s === 10 && 'Balloon'}
                             {s === 11 && 'Market'}
                             {s === 12 && 'Revenue'}
                             {s === 13 && 'Financials'}
                             {s === 14 && 'Impact/Future'}
                             {s === 15 && 'Closure'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Form Content */}
            <div className="lg:col-span-8 p-8 md:p-16 flex flex-col justify-center relative">
              <div className="absolute top-8 right-8 hidden lg:block">
                <div className="w-20 h-20 relative">
                  <img src="/images/institution_logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              
              <div className="mb-10 flex justify-between items-end">
                <div>
                  <span className="text-[9px] font-black text-teal uppercase tracking-[0.4em] block mb-2">Target Module</span>
                  <h2 className="text-2xl font-black text-navy uppercase tracking-tighter">
                    {step === 1 && 'Identity & Context'}
                    {step === 2 && 'Venture Background'}
                    {step === 3 && 'Problem Framing'}
                    {step === 4 && 'Impact Mapping'}
                    {step === 5 && 'Stakeholder Segments'}
                    {step === 6 && 'Persona & JTBD'}
                    {step === 7 && 'Gap Analysis'}
                    {step === 8 && 'Proposed Solution'}
                    {step === 9 && 'Core Features'}
                    {step === 10 && 'Value Balloon'}
                    {step === 11 && 'Market Positioning'}
                    {step === 12 && 'Revenue Model'}
                    {step === 13 && 'Financial Analysis'}
                    {step === 14 && 'Success & Vision'}
                    {step === 15 && 'Synthesis Closure'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[2.5rem] font-black text-slate-100 leading-none tabular-nums">{step < 10 ? `0${step}` : step}</span>
                </div>
              </div>

              <div className="min-h-[420px]">
                {step === 1 && (
                  <div className="space-y-8 animate-fade-in font-roboto">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Identity Framing</p>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-6">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed italic select-none">Prompt: Define the official branding for this venture. This will form your cover identification.</p>
                    </div>
                    <div>
                      <label className="label-caps">Project / Product Name</label>
                      <input name="projectName" className="input-field !text-lg !font-bold" value={data.projectName} onChange={handleInputChange} placeholder="Official Title" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                        <label className="label-caps">Team Name</label>
                        <input name="teamName" className="input-field" value={data.teamName} onChange={handleInputChange} placeholder="Operational Hub" />
                       </div>
                       <div>
                        <label className="label-caps">College / Institution</label>
                        <input name="institutionName" className="input-field" value={data.institutionName} onChange={e => setData({...data, institutionName: e.target.value})} placeholder="Full Institutional Hub" />
                       </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-fade-in font-roboto">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Context Mapping</p>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-6 font-medium text-[10px] text-slate-500 italic">
                      Identify why this problem exists in its current domain.
                    </div>
                    <div>
                      <label className="label-caps">Domain / Industry</label>
                      <input className="input-field" value={data.s2_domain} onChange={e => setData({...data, s2_domain: e.target.value})} placeholder="Ex: Sustainable Logistics" />
                    </div>
                    <div>
                      <label className="label-caps">Real-world Context</label>
                      <textarea className="input-field min-h-[100px]" value={data.s2_context} onChange={e => setData({...data, s2_context: e.target.value})} placeholder="Current situational landscape..." />
                    </div>
                    <div>
                      <label className="label-caps">Why does this problem exist?</label>
                      <input className="input-field" value={data.s2_rootReason} onChange={e => setData({...data, s2_rootReason: e.target.value})} placeholder="Root driver of existence" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Problem Framing</p>
                      <div>
                        <label className="label-caps">Core Problem</label>
                        <textarea className="input-field min-h-[100px]" value={data.s3_coreProblem} onChange={e => setData({...data, s3_coreProblem: e.target.value})} placeholder="The single most acute pain point..." />
                      </div>
                      <div>
                        <label className="label-caps">Who is affected?</label>
                        <input className="input-field" value={data.s3_affected} onChange={e => setData({...data, s3_affected: e.target.value})} placeholder="Target stakeholder groups" />
                      </div>
                      <div>
                        <label className="label-caps">Why does it matter?</label>
                        <input className="input-field" value={data.s3_whyItMatters} onChange={e => setData({...data, s3_whyItMatters: e.target.value})} placeholder="Consequence of inaction" />
                      </div>
                   </div>
                )}

                {step === 4 && (
                   <div className="space-y-4 animate-fade-in font-roboto h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Impact Mapping (Max 10)</p>
                      {data.s4_painPoints.map((pp, idx) => (
                        <div key={idx} className="glass-pane p-4 rounded-xl flex gap-4 items-end border-slate-100/50">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">{idx+1}</div>
                           <div className="flex-grow">
                              <input className="input-field !bg-white !py-2 !text-xs" placeholder="Pain Point description" value={pp.point} onChange={e => {
                                 const updated = [...data.s4_painPoints];
                                 updated[idx] = { ...updated[idx], point: e.target.value };
                                 setData({...data, s4_painPoints: updated});
                              }} />
                           </div>
                           <div className="w-24">
                              <select className="input-field !bg-white !py-2 !text-[10px]" value={pp.impact} onChange={e => {
                                 const updated = [...data.s4_painPoints];
                                 updated[idx] = { ...updated[idx], impact: e.target.value };
                                 setData({...data, s4_painPoints: updated});
                              }}>
                                 <option>Low</option><option>Medium</option><option>High</option>
                              </select>
                           </div>
                           <div className="w-24">
                              <select className="input-field !bg-white !py-2 !text-[10px]" value={pp.freq} onChange={e => {
                                 const updated = [...data.s4_painPoints];
                                 updated[idx] = { ...updated[idx], freq: e.target.value };
                                 setData({...data, s4_painPoints: updated});
                              }}>
                                 <option>Rare</option><option>Occasional</option><option>Frequent</option>
                              </select>
                           </div>
                        </div>
                      ))}
                   </div>
                )}

                {step === 5 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Stakeholder Segmentation</p>
                      <div>
                        <label className="label-caps">Primary Users</label>
                        <textarea className="input-field min-h-[100px]" value={data.s5_primaryUsers} onChange={e => setData({...data, s5_primaryUsers: e.target.value})} placeholder="Those who use the core solution daily..." />
                      </div>
                      <div>
                        <label className="label-caps">Secondary Users</label>
                        <textarea className="input-field min-h-[100px]" value={data.s5_secondaryUsers} onChange={e => setData({...data, s5_secondaryUsers: e.target.value})} placeholder="Beneficiaries or peripheral stakeholders..." />
                      </div>
                   </div>
                )}

                 {step === 6 && (
                    <div className="space-y-6 animate-fade-in font-roboto h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                       <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Empathy Mapping (High Fidelity Persona)</p>
                       
                       <div className="grid grid-cols-3 gap-4">
                         <div>
                           <label className="label-caps">Name / Persona</label>
                           <input className="input-field !py-2 !text-xs" value={data.s6_customerName} onChange={e => setData({...data, s6_customerName: e.target.value})} placeholder="Ex: Rahul" />
                         </div>
                         <div>
                           <label className="label-caps">Age</label>
                           <input className="input-field !py-2 !text-xs" value={data.s6_customerAge} onChange={e => setData({...data, s6_customerAge: e.target.value})} placeholder="Ex: 34" />
                         </div>
                         <div>
                           <label className="label-caps">Location</label>
                           <input className="input-field !py-2 !text-xs" value={data.s6_customerLocation} onChange={e => setData({...data, s6_customerLocation: e.target.value})} placeholder="Ex: Rural Karnataka" />
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="label-caps">Professional Role</label>
                           <input className="input-field !py-2 !text-xs" value={data.s6_customerJob} onChange={e => setData({...data, s6_customerJob: e.target.value})} placeholder="Ex: Lead Supervisor" />
                         </div>
                         <div>
                           <label className="label-caps">Institutional Ethos / Motto</label>
                           <input className="input-field !py-2 !text-xs" value={data.s6_customerEthos} onChange={e => setData({...data, s6_customerEthos: e.target.value})} placeholder="Ex: Efficiency at scale" />
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label className="label-caps text-rose-500">Pains (Frustrations)</label>
                           <textarea className="input-field !py-2 !text-xs min-h-[80px]" value={data.s6_pains} onChange={e => setData({...data, s6_pains: e.target.value})} placeholder="Specific daily frustrations..." />
                         </div>
                         <div>
                           <label className="label-caps text-emerald-500">Core Goals</label>
                           <textarea className="input-field !py-2 !text-xs min-h-[80px]" value={data.s6_goals} onChange={e => setData({...data, s6_goals: e.target.value})} placeholder="What are they trying to achieve?" />
                         </div>
                       </div>

                       <div>
                         <label className="label-caps">Narrative Bio</label>
                         <textarea className="input-field !py-2 !text-xs min-h-[80px]" value={data.s6_bio} onChange={e => setData({...data, s6_bio: e.target.value})} placeholder="Brief background story of the persona..." />
                       </div>

                       <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                          <div className="space-y-4">
                             <label className="label-caps !mb-4">Personality Spectrums</label>
                             {Object.entries(data.s6_personality).map(([trait, val]) => (
                               <div key={trait} className="space-y-1">
                                  <div className="flex justify-between items-center px-1">
                                     <span className="text-[8px] font-black uppercase text-slate-400">{trait}</span>
                                     <span className="text-[8px] font-black text-teal">{val}%</span>
                                  </div>
                                  <input type="range" className="w-full accent-teal h-1" value={val} onChange={e => {
                                     const updated = { ...data.s6_personality, [trait]: parseInt(e.target.value) };
                                     setData({...data, s6_personality: updated});
                                  }} />
                               </div>
                             ))}
                          </div>
                          <div className="space-y-4">
                             <label className="label-caps !mb-4">Motivation Triggers</label>
                             {Object.entries(data.s6_motivations).map(([motive, val]) => (
                               <div key={motive} className="space-y-1">
                                  <div className="flex justify-between items-center px-1">
                                     <span className="text-[8px] font-black uppercase text-slate-400">{motive}</span>
                                     <span className="text-[8px] font-black text-orange-500">{val}%</span>
                                  </div>
                                  <input type="range" className="w-full accent-orange-500 h-1" value={val} onChange={e => {
                                     const updated = { ...data.s6_motivations, [motive]: parseInt(e.target.value) };
                                     setData({...data, s6_motivations: updated});
                                  }} />
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                {step === 7 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Gap Analysis</p>
                      <div>
                        <label className="label-caps">Existing Alternatives</label>
                        <textarea className="input-field" value={data.s7_alternatives} onChange={e => setData({...data, s7_alternatives: e.target.value})} placeholder="What is the user using right now? (Ex: Manual spreadsheets)" />
                      </div>
                      <div>
                        <label className="label-caps">Critical Limitations</label>
                        <textarea className="input-field" value={data.s7_limitations} onChange={e => setData({...data, s7_limitations: e.target.value})} placeholder="Specific failures of current methods" />
                      </div>
                   </div>
                )}

                {step === 8 && (
                   <div className="space-y-6 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Solution Synthesis & Sequential Logic</p>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="label-caps">One-line Solution</label>
                          <input className="input-field !font-bold" value={data.s8_oneline} onChange={e => setData({...data, s8_oneline: e.target.value})} placeholder="The Core Product" />
                        </div>
                        <div>
                          <label className="label-caps">Mechanism</label>
                          <input className="input-field" value={data.s8_howItWorks} onChange={e => setData({...data, s8_howItWorks: e.target.value})} placeholder="Fundamental Logic" />
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-6">
                        <label className="label-caps mb-4">Linear Logic Flow (Max 10 Steps)</label>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3 h-[250px] overflow-y-auto pr-4 custom-scrollbar">
                           {data.s8_flowSteps.map((stepVal, idx) => (
                             <div key={idx} className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-slate-300 w-4">{idx+1}</span>
                               <input 
                                 className="input-field !py-2 !text-[11px] !bg-slate-50 border-transparent focus:!border-teal/30" 
                                 placeholder={`Phase ${idx+1} Action...`}
                                 value={stepVal} 
                                 onChange={e => {
                                   const updated = [...data.s8_flowSteps];
                                   updated[idx] = e.target.value;
                                   setData({...data, s8_flowSteps: updated});
                                 }} 
                               />
                             </div>
                           ))}
                        </div>
                      </div>
                   </div>
                )}

                {step === 9 && (
                   <div className="animate-fade-in font-roboto h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-4 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Lean Canvas Synthesis (High Fidelity)</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-4">
                           <div className="lean-box bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                             <label className="label-caps !text-[8px] text-navy">Problem</label>
                             <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-[10px]" value={data.s9_leanProblem} onChange={e => setData({...data, s9_leanProblem: e.target.value})} placeholder="What is the pain?" />
                             <label className="label-caps !text-[7px] text-slate-400 mt-2">Alternatives</label>
                             <input className="input-field !bg-transparent !border-0 !p-0 !text-[9px]" value={data.s9_leanAlternatives} onChange={e => setData({...data, s9_leanAlternatives: e.target.value})} placeholder="Current methods..." />
                           </div>
                           <div className="lean-box bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                             <label className="label-caps !text-[8px] text-navy">Solution</label>
                             <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-[10px]" value={data.s9_leanSolution} onChange={e => setData({...data, s9_leanSolution: e.target.value})} placeholder="What is the fix?" />
                             <label className="label-caps !text-[7px] text-slate-400 mt-2">Key Metrics</label>
                             <input className="input-field !bg-transparent !border-0 !p-0 !text-[9px]" value={data.s9_leanMetrics} onChange={e => setData({...data, s9_leanMetrics: e.target.value})} placeholder="How to measure success?" />
                           </div>
                        </div>
                        <div className="col-span-1 space-y-4">
                           <div className="lean-box bg-teal/5 p-4 rounded-xl border border-teal/10 min-h-[140px]">
                             <label className="label-caps !text-[8px] text-teal">Unique Value Prop</label>
                             <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-[10px] font-bold" value={data.s9_leanUSP} onChange={e => setData({...data, s9_leanUSP: e.target.value})} placeholder="Why you?" />
                             <label className="label-caps !text-[7px] text-teal/40 mt-2 uppercase">High-Level Concept</label>
                             <input className="input-field !bg-transparent !border-0 !p-0 !text-[9px] italic" value={data.s9_leanConcepts} onChange={e => setData({...data, s9_leanConcepts: e.target.value})} placeholder="The X for Y analogy..." />
                           </div>
                           <div className="lean-box bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                             <label className="label-caps !text-[8px] text-navy">Unfair Advantage</label>
                             <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-[10px]" value={data.s9_leanUnfair} onChange={e => setData({...data, s9_leanUnfair: e.target.value})} placeholder="Can't be copied..." />
                           </div>
                        </div>
                        <div className="col-span-1 space-y-4">
                           <div className="lean-box bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                             <label className="label-caps !text-[8px] text-navy">Channels</label>
                             <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-[10px]" value={data.s9_leanChannels} onChange={e => setData({...data, s9_leanChannels: e.target.value})} placeholder="How to reach them?" />
                           </div>
                           <div className="lean-box bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                             <label className="label-caps !text-[8px] text-navy">Customer Segments</label>
                             <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[60px] !text-[10px]" value={data.s9_leanSegments} onChange={e => setData({...data, s9_leanSegments: e.target.value})} placeholder="Target audience..." />
                             <label className="label-caps !text-[7px] text-slate-400 mt-2">Early Adopters</label>
                             <input className="input-field !bg-transparent !border-0 !p-0 !text-[9px]" value={data.s9_leanAdopters} onChange={e => setData({...data, s9_leanAdopters: e.target.value})} placeholder="First users..." />
                           </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                         <div className="lean-box bg-rose-50/30 p-4 rounded-xl border border-rose-100">
                           <label className="label-caps !text-[8px] text-rose-500">Cost Structure</label>
                           <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[40px] !text-[10px]" value={data.s9_leanCosts} onChange={e => setData({...data, s9_leanCosts: e.target.value})} placeholder="Major expenses..." />
                         </div>
                         <div className="lean-box bg-emerald-50/30 p-4 rounded-xl border border-emerald-100">
                           <label className="label-caps !text-[8px] text-emerald-500">Revenue Streams</label>
                           <textarea className="input-field !bg-transparent !border-0 !p-0 min-h-[40px] !text-[10px]" value={data.s9_leanRevenue} onChange={e => setData({...data, s9_leanRevenue: e.target.value})} placeholder="How to make money?" />
                         </div>
                      </div>
                   </div>
                )}

                {step === 10 && (
                  <div className="space-y-6 animate-fade-in font-roboto">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Value vs Constraint Mapping (Atomic 5-Factor)</p>
                    <div className="grid grid-cols-4 gap-4">
                       <div className="space-y-2">
                          <label className="label-caps text-emerald-500 !text-[8px]">🎈 Lifts (5)</label>
                          {data.s10_lifts.map((val, i) => (
                             <input key={i} className="input-field !py-2 !text-[9px]" value={val} onChange={e => {
                                let updated = [...data.s10_lifts]; updated[i] = e.target.value; setData({...data, s10_lifts: updated});
                             }} />
                          ))}
                       </div>
                       <div className="space-y-2">
                          <label className="label-caps text-rose-500 !text-[8px]">⚓ Pulls (5)</label>
                          {data.s10_pulls.map((val, i) => (
                             <input key={i} className="input-field !py-2 !text-[9px]" value={val} onChange={e => {
                                let updated = [...data.s10_pulls]; updated[i] = e.target.value; setData({...data, s10_pulls: updated});
                             }} />
                          ))}
                       </div>
                       <div className="space-y-2">
                          <label className="label-caps text-teal !text-[8px]">⚡ Fuels (5)</label>
                          {data.s10_fuels.map((val, i) => (
                             <input key={i} className="input-field !py-2 !text-[9px]" value={val} onChange={e => {
                                let updated = [...data.s10_fuels]; updated[i] = e.target.value; setData({...data, s10_fuels: updated});
                             }} />
                          ))}
                       </div>
                       <div className="space-y-2">
                          <label className="label-caps text-navy !text-[8px]">🏁 Outcomes (5)</label>
                          {data.s10_outcomes.map((val, i) => (
                             <input key={i} className="input-field !py-2 !text-[9px]" value={val} onChange={e => {
                                let updated = [...data.s10_outcomes]; updated[i] = e.target.value; setData({...data, s10_outcomes: updated});
                             }} />
                          ))}
                       </div>
                    </div>
                  </div>
                )}

                {step === 11 && (
                   <div className="space-y-6 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Market Positioning</p>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4 text-[9px] font-black text-slate-400 tracking-widest uppercase italic">The engine will build a comparison matrix based on this analysis.</div>
                      {data.s11_competitors.map((c, idx) => (
                        <div key={idx} className="glass-pane p-5 rounded-2xl grid grid-cols-3 gap-6">
                           <div>
                              <label className="label-caps !text-[8px]">Competitor</label>
                              <input className="input-field !bg-white" value={c.name} onChange={e => {
                                 const updated = [...data.s11_competitors];
                                 updated[idx].name = e.target.value;
                                 setData({...data, s11_competitors: updated});
                              }} />
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Strengths</label>
                              <input className="input-field !bg-white" value={c.strength} onChange={e => {
                                 const updated = [...data.s11_competitors];
                                 updated[idx].strength = e.target.value;
                                 setData({...data, s11_competitors: updated});
                              }} />
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Weaknesses</label>
                              <input className="input-field !bg-white" value={c.weakness} onChange={e => {
                                 const updated = [...data.s11_competitors];
                                 updated[idx].weakness = e.target.value;
                                 setData({...data, s11_competitors: updated});
                              }} />
                           </div>
                        </div>
                      ))}
                   </div>
                )}

                {step === 12 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Business Model Framing</p>
                      <div>
                        <label className="label-caps">Revenue Model</label>
                        <textarea className="input-field min-h-[120px]" value={data.s12_revenueModel} onChange={e => setData({...data, s12_revenueModel: e.target.value})} placeholder="How does this venture sustain itself?" />
                      </div>
                      <div>
                        <label className="label-caps">Pricing Logic</label>
                        <input className="input-field" value={data.s12_pricingLogic} onChange={e => setData({...data, s12_pricingLogic: e.target.value})} placeholder="Tiered, Licensing, Subscription?" />
                      </div>
                   </div>
                )}

                {step === 13 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Cost Analysis</p>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                           <label className="label-caps">Development</label>
                           <input className="input-field" value={data.s13_devCost} onChange={e => setData({...data, s13_devCost: e.target.value})} />
                        </div>
                        <div>
                           <label className="label-caps">Operational</label>
                           <input className="input-field" value={data.s13_opsCost} onChange={e => setData({...data, s13_opsCost: e.target.value})} />
                        </div>
                        <div>
                           <label className="label-caps">Tools / Infra</label>
                           <input className="input-field" value={data.s13_toolsCost} onChange={e => setData({...data, s13_toolsCost: e.target.value})} />
                        </div>
                      </div>
                   </div>
                )}

                {step === 14 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Impact Assessment</p>
                      <div>
                        <label className="label-caps">Social / Economic Impact</label>
                        <textarea className="input-field" value={data.s14_socialEconomic} onChange={e => setData({...data, s14_socialEconomic: e.target.value})} placeholder="The broader win for society or industry" />
                      </div>
                      <div>
                        <label className="label-caps">Key Metrics for Success</label>
                        <input className="input-field" value={data.s14_metrics} onChange={e => setData({...data, s14_metrics: e.target.value})} placeholder="KPIs that matter" />
                      </div>
                      <div>
                        <label className="label-caps">Future Vision</label>
                        <input className="input-field" value={data.s14_vision} onChange={e => setData({...data, s14_vision: e.target.value})} placeholder="Project state in 5 years" />
                      </div>
                   </div>
                )}

                {step === 15 && (
                   <div className="space-y-12 animate-fade-in py-10 flex flex-col items-center justify-center text-center font-roboto">
                      <div className="w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">🏛️</div>
                      <div>
                        <p className="text-[10px] font-black text-teal uppercase tracking-[0.4em] mb-2">Activity: Story Closure</p>
                        <h3 className="text-4xl font-black text-navy uppercase tracking-tighter">Venture Narrative Finalized</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">All 15 intelligent modules are ready for artifact synthesis</p>
                      </div>
                      <div className="p-10 glass-pane rounded-[3rem] max-w-xl border-teal/20 italic shadow-2xl relative overflow-hidden bg-white">
                        <div className="absolute top-0 left-0 w-2 h-full bg-teal opacity-20"></div>
                        <p className="text-base font-medium text-slate-600 leading-relaxed">
                          "System state is locked. The engine will now compile an investor-grade **High-Fidelity Pitch Artifact** with consistent typography, professional charts, and structured logic flows."
                        </p>
                      </div>
                   </div>
                )}

                {/* Per-Slide Assets Section */}
                {step < 15 && (
                  <div className="mt-12 pt-8 border-t border-slate-50">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-2 mb-4">
                      <span className="w-4 h-[1px] bg-current"></span> Assets & Reference Protocol
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                       <div className="relative group">
                          <label className="absolute -top-6 left-0 text-[7px] font-black text-teal uppercase">Native Upload</label>
                          <div className="input-field !p-0 !bg-slate-50 flex items-center overflow-hidden h-[75px]">
                             <input 
                                type="file" 
                                id={`upload-${step}`} 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, step)}
                             />
                             <label htmlFor={`upload-${step}`} className="cursor-pointer bg-teal text-white px-6 h-full flex items-center text-[10px] font-black uppercase tracking-widest hover:bg-navy transition-colors whitespace-nowrap">
                                {uploading ? '...' : 'Upload'}
                             </label>
                             <div className="px-4 flex-grow flex items-center justify-between overflow-hidden">
                                {data.slide_assets[`s${step}_img`] ? (
                                   <>
                                      <img src={data.slide_assets[`s${step}_img`]} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-slate-200" />
                                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Secured ✓</span>
                                   </>
                                ) : (
                                   <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">No Binary</span>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="relative group">
                          <input 
                            className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-4 text-[9px] outline-none focus:border-teal/50 transition-all font-bold" 
                            placeholder="Image / Screenshot Link" 
                            disabled={uploading}
                            value={data.slide_assets[`s${step}_img`] || ''}
                            onChange={e => updateAsset(`s${step}_img`, e.target.value)}
                          />
                       </div>
                       <div className="relative group">
                          <input 
                            className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-4 text-[9px] outline-none focus:border-teal/50 transition-all font-bold" 
                            placeholder="External Resource URL" 
                            value={data.slide_assets[`s${step}_link`] || ''}
                            onChange={e => updateAsset(`s${step}_link`, e.target.value)}
                          />
                       </div>
                       <div className="relative group">
                          <input 
                            className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-4 text-[9px] outline-none focus:border-teal/50 transition-all font-bold" 
                            placeholder="Reference Note / ID" 
                            value={data.slide_assets[`s${step}_note`] || ''}
                            onChange={e => updateAsset(`s${step}_note`, e.target.value)}
                          />
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="mt-10 flex items-center justify-between pt-8 border-t border-slate-100">
                {step > 1 && (
                  <button onClick={prevStep} className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-navy transition-all">
                    Back
                  </button>
                )}
                {step < 15 ? (
                  <button 
                    onClick={nextStep} 
                    className="ml-auto bg-navy text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:shadow-2xl shadow-navy/20 transition-all hover:-translate-y-0.5"
                  >
                    Continue Journey
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="ml-auto bg-teal text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:shadow-2xl shadow-teal/50 transition-all hover:-translate-y-0.5 flex items-center gap-4"
                  >
                    {loading ? 'Synthesizing...' : 'Generate Pitch Deck'}
                  </button>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
