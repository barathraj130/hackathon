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
    projectName: '', teamName: '', collegeName: '',
    s2_problem: '', s2_affected: '', s2_significance: '',
    s3_painPoints: [
      { point: '', impact: 'Medium', freq: 'Occasional' },
      { point: '', impact: 'Medium', freq: 'Occasional' },
      { point: '', impact: 'Medium', freq: 'Occasional' }
    ],
    s4_solution: '', s4_features: '',
    s5_lifts: '', s5_pulls: '', s5_fuels: '', s5_outcome: '',
    s6_broad: '', s6_target: '', s6_initial: '',
    s7_growth: '', s7_demand: '',
    s8_competitors: [
      { name: '', strength: '', gap: '' },
      { name: '', strength: '', gap: '' }
    ],
    s9_devCost: '', s9_opsCost: '', s9_toolsCost: '',
    s10_frontend: '', s10_backend: '', s10_database: '', s10_tools: '',
    s11_flow: '',
    s12_metrics: '', s12_feedback: '', s12_comparisons: '',
    s13_shortTerm: '', s13_longTerm: '',
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
      // We map the final data for the 14-slide synthesis
      await axios.post(`${apiUrl}/team/generate-pitch-deck`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Final Synthesis Complete. 14 High-Fidelity slides are being compiled. Check your repository.");
      router.push('/team/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || "Synthesis process failed.";
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
          className="h-full bg-teal transition-all duration-700" 
          style={{ width: `${(step / 14) * 100}%` }}
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
                <div className="flex flex-col gap-3">
                  {[...Array(14)].map((_, i) => {
                    const s = i + 1;
                    return (
                      <div key={s} className="flex items-center gap-4 group cursor-pointer" onClick={() => s < step && setStep(s)}>
                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-black transition-all ${step === s ? 'bg-teal border-teal text-white' : s < step ? 'bg-white border-white text-navy' : 'border-white/10 text-white/20'}`}>
                          {s < step ? '✓' : s}
                        </div>
                        {step === s && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-white animate-fade-in">
                             {s === 1 && 'Identity'}
                             {s === 2 && 'Problem'}
                             {s === 3 && 'Impact Graph'}
                             {s === 4 && 'Solution'}
                             {s === 5 && 'Balloon Activity'}
                             {s === 6 && 'Market Size'}
                             {s === 7 && 'Opportunity'}
                             {s === 8 && 'Competitors'}
                             {s === 9 && 'Cost Analysis'}
                             {s === 10 && 'Stack'}
                             {s === 11 && 'Architecture'}
                             {s === 12 && 'Validation'}
                             {s === 13 && 'Future Scope'}
                             {s === 14 && 'Final Closure'}
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
                  <h2 className="text-3xl font-black text-navy uppercase tracking-tighter">
                    {step === 1 && 'Slide 01: Organizational Identity'}
                    {step === 2 && 'Slide 02: Problem Statement'}
                    {step === 3 && 'Slide 03: Impact Graphing'}
                    {step === 4 && 'Slide 04: Solution Mapping'}
                    {step === 5 && 'Slide 05: Value Identification'}
                    {step === 6 && 'Slide 06: Market Sizing'}
                    {step === 7 && 'Slide 07: Growth Validation'}
                    {step === 8 && 'Slide 08: Differentiation'}
                    {step === 9 && 'Slide 09: Cost Analysis'}
                    {step === 10 && 'Slide 10: Stack Engineering'}
                    {step === 11 && 'Slide 11: Architecture'}
                    {step === 12 && 'Slide 12: Evidence'}
                    {step === 13 && 'Slide 13: Vision Mapping'}
                    {step === 14 && 'Slide 14: Story Closure'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[3rem] font-black text-slate-100 leading-none tabular-nums">{step < 10 ? `0${step}` : step}</span>
                </div>
              </div>

              <div className="min-h-[400px]">
                {step === 1 && (
                  <div className="space-y-8 animate-fade-in">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Context Framing</p>
                    <div>
                      <label className="label-caps">Project / Product Name</label>
                      <input name="projectName" className="input-field !text-lg !font-bold" value={data.projectName} onChange={handleInputChange} placeholder="System official moniker" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <label className="label-caps">Team Name</label>
                         <input name="teamName" className="input-field" value={data.teamName} onChange={handleInputChange} />
                       </div>
                       <div>
                         <label className="label-caps">College Name</label>
                         <input name="collegeName" className="input-field" value={data.collegeName} onChange={handleInputChange} />
                       </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Problem Framing</p>
                      <div>
                        <label className="label-caps">Core Problem</label>
                        <textarea className="input-field min-h-[100px]" value={data.s2_problem} onChange={e => setData({...data, s2_problem: e.target.value})} placeholder="Main inefficiency addressed..." />
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                           <label className="label-caps">Who is affected?</label>
                           <input className="input-field" value={data.s2_affected} onChange={e => setData({...data, s2_affected: e.target.value})} placeholder="Primary stakeholders" />
                        </div>
                        <div>
                           <label className="label-caps">Why does it matter?</label>
                           <input className="input-field" value={data.s2_significance} onChange={e => setData({...data, s2_significance: e.target.value})} placeholder="Impact of resolution" />
                        </div>
                      </div>
                   </div>
                )}

                {step === 3 && (
                   <div className="space-y-6 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Impact vs Frequency Mapping</p>
                      {data.s3_painPoints.map((p, idx) => (
                        <div key={idx} className="glass-pane p-6 rounded-2xl flex gap-6 items-end">
                           <div className="flex-grow">
                              <label className="label-caps !text-[8px]">Pain Point 0{idx+1}</label>
                              <input className="input-field !bg-white" value={p.point} onChange={e => {
                                 const updated = [...data.s3_painPoints];
                                 updated[idx].point = e.target.value;
                                 setData({...data, s3_painPoints: updated});
                              }} />
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Impact</label>
                              <select className="input-field !bg-white" value={p.impact} onChange={e => {
                                 const updated = [...data.s3_painPoints];
                                 updated[idx].impact = e.target.value;
                                 setData({...data, s3_painPoints: updated});
                              }}>
                                 <option>Low</option><option>Medium</option><option>High</option>
                              </select>
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Frequency</label>
                              <select className="input-field !bg-white" value={p.freq} onChange={e => {
                                 const updated = [...data.s3_painPoints];
                                 updated[idx].freq = e.target.value;
                                 setData({...data, s3_painPoints: updated});
                              }}>
                                 <option>Rare</option><option>Occasional</option><option>Frequent</option>
                              </select>
                           </div>
                        </div>
                      ))}
                   </div>
                )}

                {step === 4 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Solution Mapping</p>
                      <div>
                        <label className="label-caps">One-line Solution</label>
                        <input className="input-field !text-lg !font-bold" value={data.s4_solution} onChange={e => setData({...data, s4_solution: e.target.value})} placeholder="Elevator pitch of the solution" />
                      </div>
                      <div>
                        <label className="label-caps">3 Key Features (Comma separated)</label>
                        <input className="input-field" value={data.s4_features} onChange={e => setData({...data, s4_features: e.target.value})} placeholder="Real-time, Secure, Automated" />
                      </div>
                   </div>
                )}

                {step === 5 && (
                  <div className="space-y-6 animate-fade-in">
                    <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Balloon Value Uplift</p>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <label className="label-caps text-emerald-500">🎈 Drivers (Uplift)</label>
                         <textarea className="input-field !bg-emerald-50/20" value={data.s5_lifts} onChange={e => setData({...data, s5_lifts: e.target.value})} placeholder="Core value drivers" />
                       </div>
                       <div>
                         <label className="label-caps text-rose-500">⚓ Constraints (Weights)</label>
                         <textarea className="input-field !bg-rose-50/20" value={data.s5_pulls} onChange={e => setData({...data, s5_pulls: e.target.value})} placeholder="Risks or costs" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                       <div>
                         <label className="label-caps text-teal">⚡ Fuel (Tech/Innovation)</label>
                         <input className="input-field" value={data.s5_fuels} onChange={e => setData({...data, s5_fuels: e.target.value})} />
                       </div>
                       <div>
                         <label className="label-caps">☁️ Desired Outcome</label>
                         <input className="input-field" value={data.s5_outcome} onChange={e => setData({...data, s5_outcome: e.target.value})} />
                       </div>
                    </div>
                  </div>
                )}

                {step === 6 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Market Sizing (TAM-SAM-SOM)</p>
                      <div>
                        <label className="label-caps">Broad Market (TAM)</label>
                        <input className="input-field" value={data.s6_broad} onChange={e => setData({...data, s6_broad: e.target.value})} placeholder="Ex: $500B Global Logic Market" />
                      </div>
                      <div>
                        <label className="label-caps">Target Market (SAM)</label>
                        <input className="input-field" value={data.s6_target} onChange={e => setData({...data, s6_target: e.target.value})} placeholder="Ex: $50B Regional Hub" />
                      </div>
                      <div>
                        <label className="label-caps">Initial Users (SOM)</label>
                        <input className="input-field" value={data.s6_initial} onChange={e => setData({...data, s6_initial: e.target.value})} placeholder="Ex: First 100 Power Users" />
                      </div>
                   </div>
                )}

                {step === 7 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Opportunity Validation</p>
                      <div>
                        <label className="label-caps">Growth Reason</label>
                        <textarea className="input-field" value={data.s7_growth} onChange={e => setData({...data, s7_growth: e.target.value})} placeholder="Why is this market expanding now?" />
                      </div>
                      <div>
                        <label className="label-caps">Demand Signal</label>
                        <input className="input-field" value={data.s7_demand} onChange={e => setData({...data, s7_demand: e.target.value})} placeholder="Evidence of user need" />
                      </div>
                   </div>
                )}

                {step === 8 && (
                   <div className="space-y-6 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Differentiation Mapping</p>
                      {data.s8_competitors.map((c, idx) => (
                        <div key={idx} className="glass-pane p-6 rounded-2xl grid grid-cols-3 gap-6">
                           <div>
                              <label className="label-caps !text-[8px]">Competitor</label>
                              <input className="input-field !bg-white" value={c.name} onChange={e => {
                                 const updated = [...data.s8_competitors];
                                 updated[idx].name = e.target.value;
                                 setData({...data, s8_competitors: updated});
                              }} />
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Strengths</label>
                              <input className="input-field !bg-white" value={c.strength} onChange={e => {
                                 const updated = [...data.s8_competitors];
                                 updated[idx].strength = e.target.value;
                                 setData({...data, s8_competitors: updated});
                              }} />
                           </div>
                           <div>
                              <label className="label-caps !text-[8px]">Gaps / Your Edge</label>
                              <input className="input-field !bg-white" value={c.gap} onChange={e => {
                                 const updated = [...data.s8_competitors];
                                 updated[idx].gap = e.target.value;
                                 setData({...data, s8_competitors: updated});
                              }} />
                           </div>
                        </div>
                      ))}
                   </div>
                )}

                {step === 9 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Cost-Benefit Assessment</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                           <label className="label-caps">Development</label>
                           <input className="input-field" value={data.s9_devCost} onChange={e => setData({...data, s9_devCost: e.target.value})} placeholder="Monetary/Manpower" />
                        </div>
                        <div>
                           <label className="label-caps">Operational</label>
                           <input className="input-field" value={data.s9_opsCost} onChange={e => setData({...data, s9_opsCost: e.target.value})} placeholder="Monthly burn" />
                        </div>
                        <div>
                           <label className="label-caps">Infrastructure</label>
                           <input className="input-field" value={data.s9_toolsCost} onChange={e => setData({...data, s9_toolsCost: e.target.value})} placeholder="Cloud/Tools" />
                        </div>
                      </div>
                   </div>
                )}

                {step === 10 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Feasibility Check</p>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="label-caps">Frontend</label>
                          <input className="input-field" value={data.s10_frontend} onChange={e => setData({...data, s10_frontend: e.target.value})} />
                        </div>
                        <div>
                          <label className="label-caps">Backend</label>
                          <input className="input-field" value={data.s10_backend} onChange={e => setData({...data, s10_backend: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="label-caps">Database</label>
                          <input className="input-field" value={data.s10_database} onChange={e => setData({...data, s10_database: e.target.value})} />
                        </div>
                        <div>
                          <label className="label-caps">Additional Tools</label>
                          <input className="input-field" value={data.s10_tools} onChange={e => setData({...data, s10_tools: e.target.value})} />
                        </div>
                      </div>
                   </div>
                )}

                {step === 11 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: System Decomposition</p>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic mb-4">
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed"> Prompt: Describe your system flow as a sequence (Ex: User {"->"} Frontend {"->"} Process Engine {"->"} DB). The engine will convert this into a block-diagram visual.</p>
                      </div>
                      <div>
                        <label className="label-caps">Architecture Logic Flow (Plain Text)</label>
                        <textarea className="input-field min-h-[200px] !text-base" value={data.s11_flow} onChange={e => setData({...data, s11_flow: e.target.value})} placeholder="Component A -> Syncs to -> Component B..." />
                      </div>
                   </div>
                )}

                {step === 12 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Evidence Validation</p>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic mb-4">
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed"> Prompt: Provide the quantitative benchmarks or feedback that prove your system works. This forms the "Evidence" slide with indicator icons.</p>
                      </div>
                      <div>
                         <label className="label-caps">Key Metrics (Numerical preferred)</label>
                         <input className="input-field" value={data.s12_metrics} onChange={e => setData({...data, s12_metrics: e.target.value})} placeholder="Ex: 40% faster performance, 99.9% Up-time" />
                      </div>
                      <div>
                         <label className="label-caps">Feedback Snippets</label>
                         <input className="input-field" value={data.s12_feedback} onChange={e => setData({...data, s12_feedback: e.target.value})} placeholder="Ex: 'Reduces manual effort by half' - Beta User" />
                      </div>
                      <div>
                         <label className="label-caps">Comparative Benchmarks</label>
                         <input className="input-field" value={data.s12_comparisons} onChange={e => setData({...data, s12_comparisons: e.target.value})} placeholder="Your system vs Baseline / Current Industry Standard" />
                      </div>
                   </div>
                )}

                {step === 13 && (
                   <div className="space-y-8 animate-fade-in">
                      <p className="text-[10px] font-black text-teal uppercase tracking-[0.2em] mb-2 bg-teal/5 inline-block px-3 py-1 rounded">Activity: Vision Mapping</p>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic mb-4">
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed"> Prompt: Map out the evolutionary trajectory of your product. What happens in the next 6 months vs the next 5 years?</p>
                      </div>
                      <div>
                        <label className="label-caps">Short-term Impact (6 Months)</label>
                        <textarea className="input-field" value={data.s13_shortTerm} onChange={e => setData({...data, s13_shortTerm: e.target.value})} placeholder="Immediate outreach and pilot goals..." />
                      </div>
                      <div>
                        <label className="label-caps">Long-term Vision (5 Years)</label>
                        <textarea className="input-field" value={data.s13_longTerm} onChange={e => setData({...data, s13_longTerm: e.target.value})} placeholder="Global scalability and ecosystem integration..." />
                      </div>
                   </div>
                )}

                {step === 14 && (
                   <div className="space-y-12 animate-fade-in py-10 flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-teal/10 rounded-full flex items-center justify-center text-5xl mb-6 shadow-inner animate-pulse">🏁</div>
                      <div>
                        <p className="text-[10px] font-black text-teal uppercase tracking-[0.4em] mb-2">Activity: Story Closure</p>
                        <h3 className="text-4xl font-black text-navy uppercase tracking-tighter">System State: Stabilized</h3>
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3">All 14 synthesis modules are ready for artifact generation</p>
                      </div>
                      <div className="p-10 glass-pane rounded-[3rem] max-w-xl border-teal/20 italic shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-teal opacity-20"></div>
                        <p className="text-base font-medium text-slate-600 leading-relaxed">
                          "The core narrative is locked. The engine will now derive automated visuals, TAM-SAM-SOM circles, quadrant positioning, and complex architectural diagrams to form your professional **High-Fidelity Pitch Artifact**."
                        </p>
                      </div>
                      <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Synthesis Engine version 4.0.0A</div>
                   </div>
                )}

                {/* Per-Slide Assets Section (Always Available) */}
                {step < 14 && (
                  <div className="mt-12 pt-8 border-t border-slate-50">
                    <button className="text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-teal transition-colors flex items-center gap-2 mb-4">
                      <span className="w-4 h-[1px] bg-current"></span> Integrated Assets & References
                    </button>
                    <div className="grid grid-cols-2 gap-6">
                       <input 
                         className="bg-transparent border border-dashed border-slate-200 rounded-xl px-4 py-3 text-[10px] outline-none focus:border-teal/50" 
                         placeholder="External Link (Ex: GitHub, Figma)" 
                         value={data.slide_assets[`s${step}_link`] || ''}
                         onChange={e => updateAsset(`s${step}_link`, e.target.value)}
                       />
                       <input 
                         className="bg-transparent border border-dashed border-slate-200 rounded-xl px-4 py-3 text-[10px] outline-none focus:border-teal/50" 
                         placeholder="Reference Note / Asset ID" 
                         value={data.slide_assets[`s${step}_note`] || ''}
                         onChange={e => updateAsset(`s${step}_note`, e.target.value)}
                       />
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="mt-12 flex items-center justify-between pt-10 border-t border-slate-100">
                {step > 1 && (
                  <button onClick={prevStep} className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-navy transition-all">
                    Sequential Back
                  </button>
                )}
                {step < 14 ? (
                  <button 
                    onClick={nextStep} 
                    className="ml-auto bg-navy text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:shadow-2xl shadow-navy/20 transition-all hover:-translate-y-0.5 active:scale-95"
                  >
                    Continue Synthesis
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit} 
                    disabled={loading}
                    className="ml-auto bg-teal text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:shadow-2xl shadow-teal/50 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-4"
                  >
                    {loading ? (
                       <span className="flex items-center gap-2">
                         <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                         Stabilizing State...
                       </span>
                     ) : 'Generate Professional Artifact'}
                  </button>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
