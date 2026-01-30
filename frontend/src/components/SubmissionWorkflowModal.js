'use client';
import axios from 'axios';
import { useState } from 'react';

export default function SubmissionWorkflowModal({ isOpen, onClose, onComplete, apiUrl }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      // Logic to finalize submission
      await axios.post(`${apiUrl}/team/finalize-submission`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: "Review Content", desc: "Ensure all sections of your pitch are completed in the generator." },
    { title: "Final Lock", desc: "Once submitted, you will not be able to edit your pitch further." },
    { title: "PPT Generation", desc: "Our AI engine will synthesize your professional presentation deck." }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade">
      <div className="card-premium w-full max-w-lg space-y-8 shadow-2xl p-10">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Finalize Submission</h2>
          <div className="flex justify-center gap-1">
             {[1,2,3].map(s => <div key={s} className={`h-1 rounded-full transition-all duration-300 ${step >= s ? 'w-8 bg-blue-600' : 'w-4 bg-slate-200'}`} />)}
          </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 min-h-[160px] flex flex-col justify-center text-center">
           <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">{steps[step-1].title}</h3>
           <p className="text-xs text-slate-400 font-medium leading-relaxed">{steps[step-1].desc}</p>
        </div>

        {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-bold text-rose-600 uppercase text-center">
              {error}
            </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={step === 1 ? onClose : () => setStep(step - 1)} 
            className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
          >
            {step === 1 ? 'Cancel' : 'Prev Step'}
          </button>
          
          {step < 3 ? (
            <button 
                onClick={() => setStep(step + 1)} 
                className="flex-1 btn-blue !py-4 text-xs uppercase font-bold tracking-widest shadow-lg shadow-blue-100"
            >
                Next Step
            </button>
          ) : (
            <button 
                disabled={isSubmitting}
                onClick={handleSubmit} 
                className="flex-1 bg-slate-900 text-white !py-4 rounded-2xl text-xs uppercase font-bold tracking-widest shadow-xl shadow-slate-200 disabled:opacity-50"
            >
                {isSubmitting ? 'Locking...' : 'Submit Final'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
