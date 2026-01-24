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
      alert('Please enter a valid prototype link');
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
      alert(err.response?.data?.error || 'Failed to submit prototype link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCertificateSubmit = async () => {
    if (!certificateName.trim() || !certificateCollege.trim() || !certificateYear) {
      alert('Please fill all certificate fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/team/submit-certificate-info`,
        { certificateName, certificateCollege, certificateYear },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      alert('✅ Submission Complete! Your presentation is now locked.');
      onComplete();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit certificate details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-10 shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">{step === 1 ? '🔗' : '🎓'}</span>
          </div>
          <h2 className="text-3xl font-black text-navy uppercase tracking-tight mb-2">
            {step === 1 ? 'Submit Prototype' : 'Certificate Details'}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {step === 1 
              ? 'Provide a link to your working prototype or demo'
              : 'Enter details for your participation certificate'
            }
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${step >= 1 ? 'bg-teal text-white' : 'bg-slate-100 text-slate-400'}`}>
            1
          </div>
          <div className="w-16 h-1 bg-slate-200">
            <div className={`h-full bg-teal transition-all ${step >= 2 ? 'w-full' : 'w-0'}`}></div>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${step >= 2 ? 'bg-teal text-white' : 'bg-slate-100 text-slate-400'}`}>
            2
          </div>
        </div>

        {/* Step 1: Prototype */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-3">
                Prototype Link
              </label>
              <input
                type="url"
                value={prototypeUrl}
                onChange={(e) => setPrototypeUrl(e.target.value)}
                placeholder="https://drive.google.com/... or https://forms.gle/... or any link"
                className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-teal focus:outline-none font-medium transition-all"
              />
              <p className="text-xs text-slate-400 mt-2 font-medium">
                Accepted: Google Drive, Forms, Images, GitHub, Figma, or any accessible link
              </p>
            </div>

            <button
              onClick={handlePrototypeSubmit}
              disabled={isSubmitting}
              className="w-full bg-navy text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-teal transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Continue →'}
            </button>
          </div>
        )}

        {/* Step 2: Certificate */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-3">
                Full Name (for Certificate)
              </label>
              <input
                type="text"
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-teal focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-3">
                College/Institution
              </label>
              <input
                type="text"
                value={certificateCollege}
                onChange={(e) => setCertificateCollege(e.target.value)}
                placeholder="Jeppiaar Institute of Technology"
                className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-teal focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-700 mb-3">
                Year of Study
              </label>
              <select
                value={certificateYear}
                onChange={(e) => setCertificateYear(e.target.value)}
                className="w-full px-6 py-4 rounded-xl border-2 border-slate-200 focus:border-teal focus:outline-none font-medium"
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
              className="w-full bg-teal text-white py-4 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-navy transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Finalizing...' : 'Complete Submission ✓'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
