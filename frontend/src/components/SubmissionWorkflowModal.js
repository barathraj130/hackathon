'use client';
import axios from 'axios';
import { useState } from 'react';

export default function SubmissionWorkflowModal({ isOpen, onClose, onComplete, apiUrl }) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  // Prototype submission data
  const [prototypeLink, setPrototypeLink] = useState('');
  const [prototypeFile, setPrototypeFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Certificate data
  const [participants, setParticipants] = useState([
    { name: '', role: 'Leader', college: '', year: '1', dept: '' },
    { name: '', role: 'Member', college: '', year: '1', dept: '' }
  ]);

  if (!isOpen) return null;

  const handlePrototypeSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // Submit prototype link if provided
      if (prototypeLink.trim()) {
        await axios.post(`${apiUrl}/team/submit-prototype`, 
          { prototypeUrl: prototypeLink },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      
      // Upload prototype file if provided
      if (prototypeFile) {
        const formData = new FormData();
        formData.append('prototypeFile', prototypeFile);
        
        await axios.post(`${apiUrl}/team/upload-prototype-file`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
      }
      
      setStep(2); // Move to certificate details
    } catch (err) {
      setError(err.response?.data?.error || "Prototype submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCertificateSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      
      // Validate all fields are filled
      const allFilled = participants.every(p => 
        p.name.trim() && p.college.trim() && p.dept.trim() && p.year
      );
      
      if (!allFilled) {
        setError("Please fill in all certificate details for both participants.");
        setIsSubmitting(false);
        return;
      }
      
      await axios.post(`${apiUrl}/team/update-certificates`, 
        { participants },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStep(3); // Move to final confirmation
    } catch (err) {
      setError(err.response?.data?.error || "Certificate submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${apiUrl}/team/finalize-submission`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Final submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Submit Your Prototype</h3>
              <p className="text-xs text-slate-500 font-medium">Provide a link to your working prototype or upload files</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Prototype Link (GitHub, Figma, Live Demo, etc.)
                </label>
                <input 
                  type="url"
                  className="input-premium py-3 !text-sm"
                  value={prototypeLink}
                  onChange={(e) => setPrototypeLink(e.target.value)}
                  placeholder="https://github.com/yourteam/project or https://figma.com/..."
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">OR</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                  Upload Prototype Files (ZIP, PDF, etc.)
                </label>
                <div className="relative">
                  <input 
                    type="file"
                    accept=".zip,.pdf,.pptx,.docx"
                    onChange={(e) => setPrototypeFile(e.target.files[0])}
                    className="hidden"
                    id="prototype-file"
                  />
                  <label 
                    htmlFor="prototype-file"
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                  >
                    <span className="text-2xl">📎</span>
                    <span className="text-xs font-bold text-slate-600">
                      {prototypeFile ? prototypeFile.name : 'Click to select file'}
                    </span>
                  </label>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 text-center">{uploadProgress}% uploaded</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">
                  💡 You can provide either a link, upload a file, or both
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={onClose} 
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                Cancel
              </button>
              <button 
                disabled={isSubmitting || (!prototypeLink.trim() && !prototypeFile)}
                onClick={handlePrototypeSubmit} 
                className="flex-1 btn-blue !py-4 text-xs uppercase font-bold tracking-widest shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading...' : 'Next: Certificate Details'}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Certificate Details</h3>
              <p className="text-xs text-slate-500 font-medium">Enter participant information for certificate generation</p>
            </div>

            <div className="space-y-5">
              {participants.map((p, idx) => (
                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                      {p.role === 'Leader' ? '01' : '02'}
                    </span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{p.role} Details</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name *</label>
                      <input 
                        className="input-premium py-2 !text-xs !bg-white" 
                        value={p.name} 
                        onChange={e => { 
                          let u = [...participants]; 
                          u[idx].name = e.target.value; 
                          setParticipants(u); 
                        }}
                        placeholder="As it should appear on certificate"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Institution *</label>
                      <input 
                        className="input-premium py-2 !text-xs !bg-white" 
                        value={p.college} 
                        onChange={e => { 
                          let u = [...participants]; 
                          u[idx].college = e.target.value; 
                          setParticipants(u); 
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Department *</label>
                      <input 
                        className="input-premium py-2 !text-xs !bg-white" 
                        value={p.dept} 
                        onChange={e => { 
                          let u = [...participants]; 
                          u[idx].dept = e.target.value; 
                          setParticipants(u); 
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Year of Study *</label>
                      <select 
                        className="input-premium py-2 !text-xs !bg-white font-bold" 
                        value={p.year} 
                        onChange={e => { 
                          let u = [...participants]; 
                          u[idx].year = e.target.value; 
                          setParticipants(u); 
                        }}
                      >
                        {[1,2,3,4,5].map(y => <option key={y} value={y}>{y} Year</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(1)} 
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                Back
              </button>
              <button 
                disabled={isSubmitting}
                onClick={handleCertificateSubmit} 
                className="flex-1 btn-blue !py-4 text-xs uppercase font-bold tracking-widest shadow-lg shadow-blue-100 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Next: Final Review'}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Ready to Submit</h3>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                You've completed all required steps. Click below to finalize your submission and lock your entry.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-xs font-bold text-slate-700">PPT Generated</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-xs font-bold text-slate-700">Prototype Submitted</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <span className="text-xs font-bold text-slate-700">Certificate Details Provided</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wide text-center">
                ⚠️ Once submitted, you cannot make further changes
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep(2)} 
                className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                Back
              </button>
              <button 
                disabled={isSubmitting}
                onClick={handleFinalSubmit} 
                className="flex-1 bg-slate-900 text-white !py-4 rounded-2xl text-xs uppercase font-bold tracking-widest shadow-xl shadow-slate-200 disabled:opacity-50"
              >
                {isSubmitting ? 'Finalizing...' : 'Submit & Lock'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade">
      <div className="card-premium w-full max-w-2xl space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto !bg-white/90 !backdrop-blur-2xl !border-white/60">
        <div className="flex justify-between items-center border-b border-slate-200/50 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Submission Workflow</h2>
            <div className="flex gap-1 mt-2">
              {[1,2,3].map(s => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    step >= s ? 'w-10 bg-[var(--secondary-blue)]' : 'w-4 bg-slate-200'
                  }`} 
                />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors text-xl font-bold">✕</button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 uppercase text-center animate-shake">
            {error}
          </div>
        )}

        {renderStepContent()}
      </div>
    </div>
  );
}
