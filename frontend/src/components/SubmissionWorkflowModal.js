'use client';
import axios from 'axios';
import { useState } from 'react';

export default function SubmissionWorkflowModal({ isOpen, onClose, onComplete, apiUrl }) {
  const [step, setStep] = useState(1); // 1: Prototype, 2: Certificate
  const [prototypeUrl, setPrototypeUrl] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [certificateCollege, setCertificateCollege] = useState('');
  const [certificateYear, setCertificateYear] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePrototypeSubmit = async () => {
    if (!prototypeUrl.trim()) {
      alert('Please enter a valid link');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/team/submit-prototype`, 
        { prototypeUrl },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCertificateSubmit = async () => {
    if (!certificateName.trim() || !certificateCollege.trim() || !certificateYear) {
      alert('Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/team/submit-certificate-info`,
        { certificateName, certificateCollege, certificateYear },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      alert('✅ Submission Complete! Your project is now submitted.');
      onComplete();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-10 md:p-12 shadow-2xl animate-fade relative overflow-hidden">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">{step === 1 ? '🔗' : '🎓'}</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight mb-3">
            {step === 1 ? 'Link Your Work' : 'Final Details'}
          </h2>
          <p className="text-slate-500 font-medium text-base">
            {step === 1 
              ? 'Please provide a link to your project or demo.'
              : 'Enter the details as you want them to appear on your certificate.'
            }
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? 'bg-[var(--secondary-blue)] text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}>
            1
          </div>
          <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full bg-[var(--secondary-blue)] transition-all duration-500 ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? 'bg-[var(--secondary-blue)] text-white shadow-lg shadow-blue-100' : 'bg-slate-100 text-slate-400'}`}>
            2
          </div>
        </div>

        {/* Step 1: Prototype */}
        {step === 1 && (
          <div className="space-y-8 animate-fade">
            <div>
              <label className="label-premium">Project Link (Drive, GitHub, etc)</label>
              <input
                type="url"
                value={prototypeUrl}
                onChange={(e) => setPrototypeUrl(e.target.value)}
                placeholder="https://..."
                className="input-premium font-bold"
              />
              <p className="text-xs text-slate-400 mt-3 font-medium text-center">
                Paste your Google Drive, Figma, or GitHub link here.
              </p>
            </div>

            <button
              onClick={handlePrototypeSubmit}
              disabled={isSubmitting}
              className="w-full btn-blue py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:-translate-y-0.5 shadow-xl shadow-blue-100 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 2: Certificate */}
        {step === 2 && (
          <div className="space-y-6 animate-fade">
            <div>
              <label className="label-premium">Full Name</label>
              <input
                type="text"
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                placeholder="Enter name"
                className="input-premium font-bold"
              />
            </div>

            <div>
              <label className="label-premium">College Name</label>
              <input
                type="text"
                value={certificateCollege}
                onChange={(e) => setCertificateCollege(e.target.value)}
                placeholder="Enter college"
                className="input-premium font-bold"
              />
            </div>

            <div>
              <label className="label-premium">Year of Study</label>
              <select
                value={certificateYear}
                onChange={(e) => setCertificateYear(e.target.value)}
                className="input-premium font-bold"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <button
              onClick={handleCertificateSubmit}
              disabled={isSubmitting}
              className="w-full btn-green py-4 rounded-2xl font-bold uppercase text-xs tracking-widest hover:-translate-y-0.5 shadow-xl shadow-green-100 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizing...' : 'Submit Everything ✓'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
