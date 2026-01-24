'use client';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PitchGenerator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const [data, setData] = useState({
    // S1: Identity
    projectName: '', teamName: '', institutionName: '',
    // S2: Background
    s2_domain: '', s2_context: '', s2_rootReason: '',
    // S3: Problem
    s3_coreProblem: '', s3_affected: '', s3_whyItMatters: '',
    // S4: Impact Mapping
    s4_painPoints: [
      { point: '', impact: 'High', freq: 'Frequent' },
      { point: '', impact: 'Medium', freq: 'Occasional' }
    ],
    // S5: Stakeholders
    s5_primaryUsers: '', s5_secondaryUsers: '',
    // S6: Persona & JTBD
    s6_personaDetails: '', s6_jobsPainsGains: '',
    // S7: Gap Analysis
    s7_alternatives: '', s7_limitations: '',
    // S8: Solution
    s8_oneline: '', s8_howItWorks: '', s8_flow: '',
    // S9: Features
    s9_coreFeatures: '', s9_differentiators: '',
    // S10: Value Identification (Balloon)
    s10_lifts: '', s10_pulls: '', s10_fuels: '', s10_outcome: '',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/team/generate-pitch-deck`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Venture-Journey Synthesis Complete. Final Artifact generated in repository.");
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
                   <div className="space-y-6 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Impact Mapping</p>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-4 text-[9px] font-black text-slate-400 tracking-widest uppercase italic">The engine will convert these points into a frequency/impact graph.</div>
                      {data.s4_painPoints.map((pp, idx) => (
                        <div key={idx} className="glass-pane p-5 rounded-2xl flex gap-6 items-end border-slate-100/50">
                           <div className="flex-grow">
                              <label className="label-caps !text-[8px]">Pain Point</label>
                              <input className="input-field !bg-white" value={pp.point} onChange={e => {
                                 const updated = [...data.s4_painPoints];
                                 updated[idx].point = e.target.value;
                                 setData({...data, s4_painPoints: updated});
                              }} />
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Impact</label>
                              <select className="input-field !bg-white py-2" value={pp.impact} onChange={e => {
                                 const updated = [...data.s4_painPoints];
                                 updated[idx].impact = e.target.value;
                                 setData({...data, s4_painPoints: updated});
                              }}>
                                 <option>Low</option><option>Medium</option><option>High</option>
                              </select>
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Frequency</label>
                              <select className="input-field !bg-white py-2" value={pp.freq} onChange={e => {
                                 const updated = [...data.s4_painPoints];
                                 updated[idx].freq = e.target.value;
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
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Empathy Mapping (Persona & JTBD)</p>
                      <div>
                        <label className="label-caps">User Persona Details</label>
                        <textarea className="input-field" value={data.s6_personaDetails} onChange={e => setData({...data, s6_personaDetails: e.target.value})} placeholder="Age, Role, Psychology, Technology barriers..." />
                      </div>
                      <div>
                        <label className="label-caps">Jobs, Pains & Gains</label>
                        <textarea className="input-field min-h-[120px]" value={data.s6_jobsPainsGains} onChange={e => setData({...data, s6_jobsPainsGains: e.target.value})} placeholder="What are they trying to do? What stops them? What is the win?" />
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
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Solution Synthesis</p>
                      <div>
                        <label className="label-caps">One-line Solution</label>
                        <input className="input-field !text-lg !font-bold" value={data.s8_oneline} onChange={e => setData({...data, s8_oneline: e.target.value})} placeholder="Elevator Definition" />
                      </div>
                      <div>
                        <label className="label-caps">Mechanism (How it works)</label>
                        <textarea className="input-field" value={data.s8_howItWorks} onChange={e => setData({...data, s8_howItWorks: e.target.value})} placeholder="The fundamental process logic..." />
                      </div>
                      <div>
                        <label className="label-caps">Logic Flow Summary</label>
                        <input className="input-field" value={data.s8_flow} onChange={e => setData({...data, s8_flow: e.target.value})} placeholder="Phase A -> Phase B -> Output" />
                      </div>
                   </div>
                )}

                {step === 9 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Feature Prioritization</p>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="label-caps">Core Features</label>
                          <textarea className="input-field min-h-[150px]" value={data.s9_coreFeatures} onChange={e => setData({...data, s9_coreFeatures: e.target.value})} placeholder="Non-negotiable technical modules..." />
                        </div>
                        <div>
                          <label className="label-caps">Differentiators</label>
                          <textarea className="input-field min-h-[150px]" value={data.s9_differentiators} onChange={e => setData({...data, s9_differentiators: e.target.value})} placeholder="What makes this unique?" />
                        </div>
                      </div>
                   </div>
                )}

                {step === 10 && (
                  <div className="space-y-6 animate-fade-in font-roboto">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Value vs Constraint Mapping</p>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <label className="label-caps text-emerald-500">🎈 Lifts (Value)</label>
                         <textarea className="input-field !bg-emerald-50/10" value={data.s10_lifts} onChange={e => setData({...data, s10_lifts: e.target.value})} />
                       </div>
                       <div>
                         <label className="label-caps text-rose-500">⚓ Pulls (Costs/Risks)</label>
                         <textarea className="input-field !bg-rose-50/10" value={data.s10_pulls} onChange={e => setData({...data, s10_pulls: e.target.value})} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <label className="label-caps text-teal">⚡ Fuel (Tech Strengths)</label>
                         <input className="input-field" value={data.s10_fuels} onChange={e => setData({...data, s10_fuels: e.target.value})} />
                       </div>
                       <div>
                         <label className="label-caps">🏁 Desired Outcome</label>
                         <input className="input-field" value={data.s10_outcome} onChange={e => setData({...data, s10_outcome: e.target.value})} />
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
                    <div className="grid grid-cols-3 gap-4">
                       <div className="relative group">
                          <input 
                            className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-4 text-[9px] outline-none focus:border-teal/50 transition-all font-bold" 
                            placeholder="Image / Screenshot Link" 
                            value={data.slide_assets[`s${step}_img`] || ''}
                            onChange={e => updateAsset(`s${step}_img`, e.target.value)}
                          />
                          <div className="absolute top-[-8px] left-3 px-2 bg-white text-[7px] font-black text-slate-300 uppercase letter-tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">Image Link</div>
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
