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
    projectName: '',
    teamName: '',
    collegeName: '',
    problemDescription: '',
    targetUsers: '',
    currentLimitations: '',
    proposedSolution: '',
    keyFeatures: '',
    targetMarket: '',
    competitors: '',
    revenueModel: '',
    expectedImpact: '',
    techStack: '',
    architectureExplanation: '',
    validationMetrics: '',
    userFeedback: ''
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
      alert("Pitch Deck Synthesis Initialized. Check your dashboard for the download link.");
      router.push('/team/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || "Synthesis process failed. Ensure infrastructure is online.";
      alert(`Synthesis Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-bg-light p-10 font-sans flex items-center justify-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-teal/5 blur-[120px] rounded-full z-0 rotate-12"></div>
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-royal/5 blur-[100px] rounded-full z-0"></div>

      <div className="relative z-10 w-full max-w-5xl animate-fade-in">
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

              <div className="relative z-10">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="flex items-center gap-4 transition-all duration-500">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-black tracking-tighter transition-all ${step === s ? 'bg-teal border-teal text-white shadow-lg shadow-teal/50 scale-110' : s < step ? 'bg-white border-white text-navy scale-90 opacity-50' : 'border-white/20 text-white/40'}`}>
                        {s < step ? '✓' : `0${s}`}
                      </div>
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all ${step === s ? 'text-white translate-x-2' : 'text-white/30 translate-x-0'}`}>
                        {s === 1 && 'Infrastructure'}
                        {s === 2 && 'Alignment'}
                        {s === 3 && 'Economics'}
                        {s === 4 && 'Blueprint'}
                        {s === 5 && 'Validation'}
                      </span>
                    </div>
                  ))}
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
                    {step === 1 && 'Basic Infrastructure'}
                    {step === 2 && 'Solution Alignment'}
                    {step === 3 && 'Structural Economics'}
                    {step === 4 && 'Technical Blueprint'}
                    {step === 5 && 'Metric Validation'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[3rem] font-black text-slate-100 leading-none tabular-nums">0{step}</span>
                </div>
              </div>

              <div className="min-h-[300px]">
                {step === 1 && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <label className="label-caps">Project / Product Name</label>
                      <input name="projectName" className="input-field !text-lg !font-bold" value={data.projectName} onChange={handleInputChange} placeholder="Ex: EcoTrack Global System" />
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="label-caps">Team Identity</label>
                        <input name="teamName" className="input-field" value={data.teamName} onChange={handleInputChange} placeholder="Team Lead Name" />
                      </div>
                      <div>
                        <label className="label-caps">College / Institution</label>
                        <input name="collegeName" className="input-field" value={data.collegeName} onChange={handleInputChange} placeholder="Full Institution Name" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <label className="label-caps">Core Problem Statement</label>
                      <textarea name="problemDescription" className="input-field min-h-[140px]" value={data.problemDescription} onChange={handleInputChange} placeholder="Describe the acute pain point being addressed..." />
                    </div>
                    <div>
                      <label className="label-caps">Primary Stakeholders</label>
                      <input name="targetUsers" className="input-field" value={data.targetUsers} onChange={handleInputChange} placeholder="Ex: Rural farmers, Urban commuters" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <label className="label-caps">Target Market Segment</label>
                      <input name="targetMarket" className="input-field" value={data.targetMarket} onChange={handleInputChange} placeholder="Ex: $2B Renewable Energy Sector" />
                    </div>
                    <div>
                      <label className="label-caps">Competitive Landscape</label>
                      <textarea name="competitors" className="input-field min-h-[100px]" value={data.competitors} onChange={handleInputChange} placeholder="Existing players or traditional methods..." />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <label className="label-caps">Integrated Technology Stack</label>
                      <input name="techStack" className="input-field" value={data.techStack} onChange={handleInputChange} placeholder="React, Node.js, TensorFlow, AWS" />
                    </div>
                    <div>
                      <label className="label-caps">Architecture Logic</label>
                      <textarea name="architectureExplanation" className="input-field min-h-[140px]" value={data.architectureExplanation} onChange={handleInputChange} placeholder="System hierarchy and data synchronization logic..." />
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-8 animate-fade-in">
                    <div>
                      <label className="label-caps">Quantitative Validation Metrics</label>
                      <textarea name="validationMetrics" className="input-field min-h-[140px]" value={data.validationMetrics} onChange={handleInputChange} placeholder="Ex: 40% efficiency boost, 25% cost reduction..." />
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                        Notice: The engine will automatically generate system performance visuals and comparative charts based on these inputs.
                      </p>
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
                {step < 5 ? (
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
                         Processing Logic...
                       </span>
                    ) : 'Initialize Final Synthesis'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
