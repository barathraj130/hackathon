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
    // S1: Context framing
    projectName: '', institutionName: '', teamName: '',
    // S2: Problem context mapping
    s2_context: '', s2_domain: '',
    // S3: Problem-impact breakdown
    s3_problem: '', s3_affected: '',
    // S4: Root-cause analysis
    s4_rootCauses: '', s4_failureAnalysis: '',
    // S5: Stakeholder segmentation
    s5_customerSegments: '',
    // S6: User Persona & JTBD
    s6_persona: '', s6_jtbd: '',
    // S7: Gap analysis
    s7_alternatives: '', s7_gaps: '',
    // S8: Solution synthesis
    s8_solution: '', s8_flow: '',
    // S9: Feature prioritization
    s9_features: '', s9_differentiation: '',
    // S10: Value Identification (Balloon)
    s10_lifts: '', s10_pulls: '', s10_fuels: '', s10_outcome: '',
    // S11: Market positioning
    s11_competitors: [
      { name: '', strength: '', gap: '' },
      { name: '', strength: '', gap: '' }
    ],
    // S12: Business model framing
    s12_revenueModel: '',
    // S13: Cost–benefit evaluation
    s13_devCost: '', s13_opsCost: '', s13_toolsCost: '',
    // S14: Impact assessment
    s14_metrics: '', s14_shortTerm: '', s14_longTerm: '',
    // S15: Closing (Auto)
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
                             {s === 1 && 'Title'}
                             {s === 2 && 'Context'}
                             {s === 3 && 'Problem'}
                             {s === 4 && 'Analysis'}
                             {s === 5 && 'Segments'}
                             {s === 6 && 'Persona'}
                             {s === 7 && 'Gaps'}
                             {s === 8 && 'Solution'}
                             {s === 9 && 'Design'}
                             {s === 10 && 'Balloon'}
                             {s === 11 && 'Competitors'}
                             {s === 12 && 'Revenue'}
                             {s === 13 && 'Financials'}
                             {s === 14 && 'Impact'}
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
                    {step === 1 && 'Title & Context'}
                    {step === 2 && 'Venture Background'}
                    {step === 3 && 'Problem & Impact'}
                    {step === 4 && 'Root-Cause Analysis'}
                    {step === 5 && 'Customer Segments'}
                    {step === 6 && 'Persona & JTBD'}
                    {step === 7 && 'Alternatives & Gaps'}
                    {step === 8 && 'Solution Overview'}
                    {step === 9 && 'Design & Features'}
                    {step === 10 && 'Value Balloon'}
                    {step === 11 && 'Market Positioning'}
                    {step === 12 && 'Business Model'}
                    {step === 13 && 'Financial Evaluation'}
                    {step === 14 && 'Metrics & Future'}
                    {step === 15 && 'Story Closure'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[2.5rem] font-black text-slate-100 leading-none tabular-nums">{step < 10 ? `0${step}` : step}</span>
                </div>
              </div>

              <div className="min-h-[400px]">
                {step === 1 && (
                  <div className="space-y-8 animate-fade-in font-roboto">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Context Framing</p>
                    <div>
                      <label className="label-caps">Project / Venture Name</label>
                      <input name="projectName" className="input-field !text-lg !font-bold" value={data.projectName} onChange={handleInputChange} placeholder="Official Identifier" />
                    </div>
                    <div>
                      <label className="label-caps">Institution / College Name</label>
                      <input name="institutionName" className="input-field" value={data.institutionName} onChange={e => setData({...data, institutionName: e.target.value})} placeholder="Full Institutional Title" />
                    </div>
                    <div>
                      <label className="label-caps">Team Name</label>
                      <input name="teamName" className="input-field" value={data.teamName} onChange={handleInputChange} placeholder="Operational Team Hub" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-fade-in font-roboto">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Problem Context Mapping</p>
                    <div>
                      <label className="label-caps">Real-world Context</label>
                      <textarea className="input-field min-h-[120px]" value={data.s2_context} onChange={e => setData({...data, s2_context: e.target.value})} placeholder="Environmental or social situation..." />
                    </div>
                    <div>
                      <label className="label-caps">Domain / Region</label>
                      <input className="input-field" value={data.s2_domain} onChange={e => setData({...data, s2_domain: e.target.value})} placeholder="Geographic or industrial scope" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Problem–Impact Breakdown</p>
                      <div>
                        <label className="label-caps">Core Problem</label>
                        <textarea className="input-field min-h-[100px]" value={data.s3_problem} onChange={e => setData({...data, s3_problem: e.target.value})} placeholder="Acute pain point identified..." />
                      </div>
                      <div>
                        <label className="label-caps">Who is affected?</label>
                        <input className="input-field" value={data.s3_affected} onChange={e => setData({...data, s3_affected: e.target.value})} placeholder="Stakeholder groups" />
                      </div>
                   </div>
                )}

                {step === 4 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Root-Cause Analysis</p>
                      <div>
                        <label className="label-caps">Root Causes</label>
                        <textarea className="input-field min-h-[100px]" value={data.s4_rootCauses} onChange={e => setData({...data, s4_rootCauses: e.target.value})} placeholder="Underlying drivers of the problem..." />
                      </div>
                      <div>
                        <label className="label-caps">Why existing solutions fail?</label>
                        <textarea className="input-field min-h-[100px]" value={data.s4_failureAnalysis} onChange={e => setData({...data, s4_failureAnalysis: e.target.value})} placeholder="Gaps in current methodologies" />
                      </div>
                   </div>
                )}

                {step === 5 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Stakeholder Segmentation</p>
                      <div>
                        <label className="label-caps">Customer Segments</label>
                        <textarea className="input-field min-h-[150px]" value={data.s5_customerSegments} onChange={e => setData({...data, s5_customerSegments: e.target.value})} placeholder="Segment A, Segment B, Segment C..." />
                      </div>
                   </div>
                )}

                {step === 6 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Empathy Mapping (Persona & JTBD)</p>
                      <div>
                        <label className="label-caps">User Persona</label>
                        <input className="input-field" value={data.s6_persona} onChange={e => setData({...data, s6_persona: e.target.value})} placeholder="Ex: Experienced rural engineer" />
                      </div>
                      <div>
                        <label className="label-caps">Jobs To Be Done (JTBD)</label>
                        <textarea className="input-field" value={data.s6_jtbd} onChange={e => setData({...data, s6_jtbd: e.target.value})} placeholder="Primary tasks user needs to complete..." />
                      </div>
                   </div>
                )}

                {step === 7 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Gap Analysis</p>
                      <div>
                        <label className="label-caps">Current Alternatives</label>
                        <textarea className="input-field" value={data.s7_alternatives} onChange={e => setData({...data, s7_alternatives: e.target.value})} placeholder="What are they using today?" />
                      </div>
                      <div>
                        <label className="label-caps">Unaddressed Gaps</label>
                        <textarea className="input-field" value={data.s7_gaps} onChange={e => setData({...data, s7_gaps: e.target.value})} placeholder="Specific failures of alternatives" />
                      </div>
                   </div>
                )}

                {step === 8 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Solution Synthesis</p>
                      <div>
                        <label className="label-caps">One-line Solution</label>
                        <input className="input-field !text-lg !font-bold" value={data.s8_solution} onChange={e => setData({...data, s8_solution: e.target.value})} />
                      </div>
                      <div>
                        <label className="label-caps">System Flow Summary</label>
                        <textarea className="input-field" value={data.s8_flow} onChange={e => setData({...data, s8_flow: e.target.value})} placeholder="A to B to C..." />
                      </div>
                   </div>
                )}

                {step === 9 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Feature Prioritization</p>
                      <div>
                        <label className="label-caps">Key Features</label>
                        <textarea className="input-field" value={data.s9_features} onChange={e => setData({...data, s9_features: e.target.value})} placeholder="High-impact technical features" />
                      </div>
                      <div>
                        <label className="label-caps">Differentiation Points</label>
                        <textarea className="input-field" value={data.s9_differentiation} onChange={e => setData({...data, s9_differentiation: e.target.value})} placeholder="Unique Value Proposition" />
                      </div>
                   </div>
                )}

                {step === 10 && (
                  <div className="space-y-6 animate-fade-in font-roboto">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Value vs Constraint Mapping</p>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <label className="label-caps text-emerald-500">🎈 Lifts (Value)</label>
                         <textarea className="input-field" value={data.s10_lifts} onChange={e => setData({...data, s10_lifts: e.target.value})} />
                       </div>
                       <div>
                         <label className="label-caps text-rose-500">⚓ Pulls (Constraints)</label>
                         <textarea className="input-field" value={data.s10_pulls} onChange={e => setData({...data, s10_pulls: e.target.value})} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <label className="label-caps text-teal">⚡ Fuel (Tech)</label>
                         <input className="input-field" value={data.s10_fuels} onChange={e => setData({...data, s10_fuels: e.target.value})} />
                       </div>
                       <div>
                         <label className="label-caps">☁️ Outcome</label>
                         <input className="input-field" value={data.s10_outcome} onChange={e => setData({...data, s10_outcome: e.target.value})} />
                       </div>
                    </div>
                  </div>
                )}

                {step === 11 && (
                   <div className="space-y-6 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Market Positioning</p>
                      {data.s11_competitors.map((c, idx) => (
                        <div key={idx} className="glass-pane p-6 rounded-2xl grid grid-cols-3 gap-6">
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
                              <label className="label-caps !text-[8px]">Gaps / Edge</label>
                              <input className="input-field !bg-white" value={c.gap} onChange={e => {
                                 const updated = [...data.s11_competitors];
                                 updated[idx].gap = e.target.value;
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
                        <label className="label-caps">Revenue Methodology</label>
                        <textarea className="input-field min-h-[150px]" value={data.s12_revenueModel} onChange={e => setData({...data, s12_revenueModel: e.target.value})} placeholder="Monetization Strategy & Model..." />
                      </div>
                   </div>
                )}

                {step === 13 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Cost–Benefit Evaluation</p>
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
                           <label className="label-caps">Infrastructure</label>
                           <input className="input-field" value={data.s13_toolsCost} onChange={e => setData({...data, s13_toolsCost: e.target.value})} />
                        </div>
                      </div>
                   </div>
                )}

                {step === 14 && (
                   <div className="space-y-8 animate-fade-in font-roboto">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Impact Assessment</p>
                      <div>
                        <label className="label-caps">Key Metrics</label>
                        <input className="input-field" value={data.s14_metrics} onChange={e => setData({...data, s14_metrics: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="label-caps">Short-term Impact</label>
                          <textarea className="input-field" value={data.s14_shortTerm} onChange={e => setData({...data, s14_shortTerm: e.target.value})} />
                        </div>
                        <div>
                          <label className="label-caps">Long-term Vision</label>
                          <textarea className="input-field" value={data.s14_longTerm} onChange={e => setData({...data, s14_longTerm: e.target.value})} />
                        </div>
                      </div>
                   </div>
                )}

                {step === 15 && (
                   <div className="space-y-12 animate-fade-in py-10 flex flex-col items-center justify-center text-center font-roboto">
                      <div className="w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">🎯</div>
                      <div>
                        <p className="text-[10px] font-black text-teal uppercase tracking-[0.4em] mb-2">Activity: Story Closure</p>
                        <h3 className="text-4xl font-black text-navy uppercase tracking-tighter">Venture Narrative Locked</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">All 15 synthesis modules are ready for generation</p>
                      </div>
                      <div className="p-10 glass-pane rounded-[3rem] max-w-xl border-teal/20 italic shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-teal opacity-20"></div>
                        <p className="text-base font-medium text-slate-600 leading-relaxed">
                          "The venture journey is complete. The engine will now compile a professional, institutionally consistent **High-Fidelity Pitch Deck** with your structured inputs and visuals."
                        </p>
                      </div>
                   </div>
                )}

                {/* Per-Slide Assets Section */}
                {step < 15 && (
                  <div className="mt-12 pt-8 border-t border-slate-50">
                    <button className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-teal transition-colors flex items-center gap-2 mb-4">
                      <span className="w-4 h-[1px] bg-current"></span> Assets & References
                    </button>
                    <div className="grid grid-cols-2 gap-6">
                       <input 
                         className="bg-transparent border border-dashed border-slate-200 rounded-xl px-4 py-3 text-[10px] outline-none focus:border-teal/50" 
                         placeholder="External Link" 
                         value={data.slide_assets[`s${step}_link`] || ''}
                         onChange={e => updateAsset(`s${step}_link`, e.target.value)}
                       />
                       <input 
                         className="bg-transparent border border-dashed border-slate-200 rounded-xl px-4 py-3 text-[10px] outline-none focus:border-teal/50" 
                         placeholder="Reference Note" 
                         value={data.slide_assets[`s${step}_note`] || ''}
                         onChange={e => updateAsset(`s${step}_note`, e.target.value)}
                       />
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
