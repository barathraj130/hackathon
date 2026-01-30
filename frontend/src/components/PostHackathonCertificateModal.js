'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function PostHackathonCertificateModal({ isOpen, onClose, teamData, apiUrl }) {
  const [participants, setParticipants] = useState([
    { name: '', college: '', year: '', dept: '', role: 'LEADER' },
    { name: '', college: '', year: '', dept: '', role: 'MEMBER' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teamData) {
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
    const isValid = participants.every(p => p.name.trim() && p.college.trim() && p.year.trim() && p.dept.trim());
    if (!isValid) {
      alert('Please fill all details');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${apiUrl}/team/certificate-details`, 
        { participants },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      alert('Details saved successfully.');
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-10 md:p-12 shadow-2xl animate-fade relative overflow-hidden text-slate-800">
        <header className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-green-50 text-[var(--primary-green)] rounded-full mb-4 border border-green-100">
             <span className="text-[10px] font-bold uppercase tracking-widest">Final Step</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 uppercase tracking-tight mb-4">Enter Team Names</h2>
          <p className="text-slate-500 font-medium text-base max-w-xl mx-auto">
            Great job on finishing the hackathon! Please enter the full names of your team members so we can prepare your certificates.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          {participants.map((participant, idx) => (
            <div key={idx} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 transition-all hover:bg-white hover:shadow-xl hover:border-slate-200">
               <div className="flex items-center justify-between mb-8">
                 <span className="text-[10px] font-bold text-white bg-slate-800 px-3 py-1 rounded-lg uppercase tracking-widest">
                   {participant.role}
                 </span>
                 <div className="text-2xl">
                   {participant.role === 'LEADER' ? '👑' : '👥'}
                 </div>
               </div>
               
               <div className="space-y-6">
                 <div className="space-y-1.5">
                   <label className="label-premium !mb-0 text-slate-400">Full Name</label>
                   <input 
                     className="input-premium"
                     value={participant.name}
                     onChange={(e) => handleInputChange(idx, 'name', e.target.value)}
                     placeholder="Ex: John Doe"
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="label-premium !mb-0 text-slate-400">College Name</label>
                   <input 
                     className="input-premium"
                     value={participant.college}
                     onChange={(e) => handleInputChange(idx, 'college', e.target.value)}
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="label-premium !mb-0 text-slate-400">Year</label>
                      <select 
                        className="input-premium"
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
                      <label className="label-premium !mb-0 text-slate-400">Dept</label>
                      <input 
                        className="input-premium"
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

        <div className="flex flex-col md:flex-row gap-6">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all"
          >
            Do it later
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-[2] btn-green py-4 rounded-2xl text-xs font-bold uppercase tracking-widest hover:-translate-y-0.5 shadow-xl shadow-green-100 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save and Finish ✓'}
          </button>
        </div>
      </div>
    </div>
  );
}
