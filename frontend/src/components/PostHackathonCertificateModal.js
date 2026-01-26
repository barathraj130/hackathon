'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function PostHackathonCertificateModal({ isOpen, onClose, teamData, apiUrl }) {
  const [participants, setParticipants] = useState([
    { name: '', college: '', year: '', dept: '', role: 'LEADER' },
    { name: '', college: '', year: '', dept: '', role: 'MEMBER' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (teamData) {
       // Pre-fill with some data if available
       setParticipants([
         { name: teamData.leaderName || '', college: teamData.collegeName || '', year: '', dept: '', role: 'LEADER' },
         { name: teamData.member1 || '', college: teamData.collegeName || '', year: '', dept: '', role: 'MEMBER' }
       ]);
    }
  }, [teamData]);

  if (!isOpen) return null;

  const handleInputChange = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const handleSubmit = async () => {
    // Validation
    const isValid = participants.every(p => p.name.trim() && p.college.trim() && p.year.trim() && p.dept.trim());
    if (!isValid) {
      alert('Please fill all details for all participants');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/team/certificate-details`, 
        { participants },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      setIsSaved(true);
      alert('✅ Credential data secured for certificate generation.');
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to synchronize professional metadata');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-8 md:p-12 shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <header className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-teal-50 rounded-full mb-4">
             <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></span>
             <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">Final Protocol Phase</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-[#020617] uppercase tracking-tighter mb-4">Certification Node</h2>
          <p className="text-slate-500 font-bold text-sm md:text-base max-w-xl mx-auto">
            Hackathon mission concluded. Provide professional metadata for team leader and members to generate institutional certificates.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
          {participants.map((participant, idx) => (
            <div key={idx} className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:border-teal-500/20">
               <div className="flex items-center justify-between mb-6">
                 <span className="text-[10px] font-black text-white bg-[#020617] px-3 py-1 rounded-full uppercase tracking-widest">
                   {participant.role}
                 </span>
                 <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl">
                   {participant.role === 'LEADER' ? '👑' : '👥'}
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Legal Full Name</label>
                   <input 
                     className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                     value={participant.name}
                     onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                     placeholder="Ex: John Doe"
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Institution</label>
                   <input 
                     className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                     value={participant.college}
                     onChange={(e) => handleInputChange(idx, 'college', e.target.value)}
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Year</label>
                      <select 
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                        value={participant.year}
                        onChange={(e) => handleInputChange(idx, 'year', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="I">1st Year</option>
                        <option value="II">2nd Year</option>
                        <option value="III">3rd Year</option>
                        <option value="IV">4th Year</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
                      <input 
                        className="w-full bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-teal-500 outline-none transition-all"
                        value={participant.dept}
                        onChange={(e) => handleInputChange(idx, 'dept', e.target.value)}
                        placeholder="Ex: CSE"
                      />
                    </div>
                 </div>
               </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 relative z-10">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#020617] transition-all"
          >
            Fill Later
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[2] bg-[#020617] text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-teal-500 transition-all shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Synchronizing Node...' : 'Initialize Final Certification ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
