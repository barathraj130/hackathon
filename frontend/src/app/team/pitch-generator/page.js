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
    // Basic Info
    projectName: '',
    teamName: '',
    collegeName: '',
    
    // Problem & Solution
    problemDescription: '',
    targetUsers: '',
    currentLimitations: '',
    proposedSolution: '',
    keyFeatures: '',
    
    // Market & Business
    targetMarket: '',
    competitors: '',
    revenueModel: '',
    expectedImpact: '',
    
    // Technical
    techStack: '',
    architectureExplanation: '',
    
    // Validation
    validationMetrics: '', // Percentages, numbers
    userFeedback: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/v1';
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/team/generate-pitch-deck`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Pitch Deck Synthesis Initialized. Check your dashboard for the download link.");
      router.push('/team/dashboard');
    } catch (err) {
      alert("Synthesis process failed. Ensure infrastructure is online.");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-bg-light p-10 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-brand-navy p-8 text-white relative">
          <Link href="/team/dashboard" className="absolute top-8 left-8 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> Sequential Return
          </Link>
          <div className="flex justify-between items-center mb-6 pt-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter">Pitch Synthesis Engine</h1>
            <span className="text-[10px] font-bold bg-white/10 px-3 py-1 rounded-full">STEP {step} OF 5</span>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
            <div className="bg-brand-teal h-full transition-all duration-500" style={{ width: `${(step/5) * 100}%` }}></div>
          </div>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <h2 className="text-xl font-extrabold text-brand-navy border-b pb-4 mb-8">Basic Infrastructure</h2>
              <div>
                <label className="label-caps">Project / Product Name</label>
                <input name="projectName" className="input-field" value={data.projectName} onChange={handleInputChange} placeholder="Ex: EcoTrack Global" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-caps">Team Identity</label>
                  <input name="teamName" className="input-field" value={data.teamName} onChange={handleInputChange} placeholder="Team Alpha" />
                </div>
                <div>
                  <label className="label-caps">College / Institution</label>
                  <input name="collegeName" className="input-field" value={data.collegeName} onChange={handleInputChange} placeholder="MIT" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-xl font-extrabold text-brand-navy border-b pb-4 mb-8">Solution Alignment</h2>
              <div>
                <label className="label-caps">Core Problem Statement</label>
                <textarea name="problemDescription" className="input-field min-h-[100px]" value={data.problemDescription} onChange={handleInputChange} placeholder="Describe the acute pain point..." />
              </div>
              <div>
                <label className="label-caps">Primary Stakeholders (Target Users)</label>
                <input name="targetUsers" className="input-field" value={data.targetUsers} onChange={handleInputChange} placeholder="Ex: Rural farmers, Urban commuters" />
              </div>
              <div>
                <label className="label-caps">Strategic Solution</label>
                <textarea name="proposedSolution" className="input-field min-h-[100px]" value={data.proposedSolution} onChange={handleInputChange} placeholder="How does your innovation work?" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-xl font-extrabold text-brand-navy border-b pb-4 mb-8">Structural Economics</h2>
              <div>
                <label className="label-caps">Target Market Segment</label>
                <input name="targetMarket" className="input-field" value={data.targetMarket} onChange={handleInputChange} placeholder="Ex: $2B Renewable Energy Sector" />
              </div>
              <div>
                <label className="label-caps">Competitive Landscape</label>
                <textarea name="competitors" className="input-field" value={data.competitors} onChange={handleInputChange} placeholder="List key competitors or existing methods..." />
              </div>
              <div>
                <label className="label-caps">Value Creation / Revenue Model</label>
                <textarea name="revenueModel" className="input-field" value={data.revenueModel} onChange={handleInputChange} placeholder="How will this sustain itself?" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-xl font-extrabold text-brand-navy border-b pb-4 mb-8">Technical Blueprint</h2>
              <div>
                <label className="label-caps">Technology Stack</label>
                <input name="techStack" className="input-field" value={data.techStack} onChange={handleInputChange} placeholder="React, Node.js, TensorFlow, AWS" />
              </div>
              <div>
                <label className="label-caps">Architecture Logic</label>
                <textarea name="architectureExplanation" className="input-field min-h-[150px]" value={data.architectureExplanation} onChange={handleInputChange} placeholder="Explain the data flow and system hierarchy..." />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-500">
              <h2 className="text-xl font-extrabold text-brand-navy border-b pb-4 mb-8">Metric Validation</h2>
              <div>
                <label className="label-caps">Quantitative Metrics (For Charts)</label>
                <textarea name="validationMetrics" className="input-field min-h-[100px]" value={data.validationMetrics} onChange={handleInputChange} placeholder="Ex: 40% efficiency boost, 25% cost reduction..." />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic leading-relaxed">
                The engine will automatically generate Impact/Frequency graphs <br /> and comparative charts based on these metrics.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 flex justify-between gap-4 pt-8 border-t border-gray-100">
            {step > 1 && (
              <button onClick={prevStep} className="px-8 py-4 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors uppercase text-xs tracking-widest">
                Sequential Back
              </button>
            )}
            {step < 5 ? (
              <button onClick={nextStep} className="ml-auto px-10 py-4 bg-brand-navy text-white rounded-xl font-bold hover:bg-brand-blue transition-all uppercase text-xs tracking-widest shadow-lg shadow-brand-navy/20">
                Continue Synthesis
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="ml-auto px-12 py-4 bg-brand-teal text-white rounded-xl font-bold hover:opacity-90 transition-all uppercase text-xs tracking-widest shadow-lg shadow-brand-teal/20 flex items-center gap-2"
              >
                {loading ? 'PROCESSING ARCHITECTURE...' : 'Initialize Expert Deck Synthesis'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
