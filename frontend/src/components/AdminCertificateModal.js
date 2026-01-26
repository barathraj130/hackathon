'use client';
import axios from 'axios';
import { useEffect, useState } from 'react';

export default function AdminCertificateModal({ isOpen, onClose, teamId, teamName, apiUrl, onComplete }) {
  const [formData, setFormData] = useState({
    leader: { name: '', college: '', year: '', dept: '', role: 'LEADER' },
    member: { name: '', college: '', year: '', dept: '', role: 'MEMBER' }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) fetchExistingDetails();
  }, [isOpen]);

  async function fetchExistingDetails() {
    try {
        const res = await axios.get(`${apiUrl}/admin/submissions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const sub = res.data.find(s => s.teamId === teamId);
        if (sub?.certificates?.length > 0) {
            const l = sub.certificates.find(c => c.role === 'LEADER');
            const m = sub.certificates.find(c => c.role === 'MEMBER');
            setFormData({
                leader: l ? { ...l } : { name: '', college: '', year: '', dept: '', role: 'LEADER' },
                member: m ? { ...m } : { name: '', college: '', year: '', dept: '', role: 'MEMBER' }
            });
        }
    } catch (e) { console.error(e); }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // We use the same endpoint as teams but through an admin bypass if needed, 
      // or we can just send it with admin token to a new admin-only update route.
      // For now, let's assume the existing submission-workflow route can be used if we provide the right data.
      // Actually, better to create a clean admin route.
      await axios.post(`${apiUrl}/admin/update-certificates`, {
        teamId,
        participants: [formData.leader, formData.member]
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert("Participant details secured.");
      onComplete();
      onClose();
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-xl animate-fade-in uppercase tracking-tight">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-[#020617] tracking-tighter italic">MANUAL CREDENTIALING</h2>
            <p className="text-[10px] font-black text-teal-600 tracking-widest mt-1 uppercase">Mission Entity: {teamName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center font-black text-slate-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-2 gap-10">
            {/* Leader Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3"><span className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xs">01</span><h3 className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Team Leader Details</h3></div>
              <div className="space-y-4">
                 <input className="input-modal" placeholder="Leader Legal Name" value={formData.leader.name} onChange={e => setFormData({...formData, leader: {...formData.leader, name: e.target.value}})} required />
                 <input className="input-modal" placeholder="College / Institution" value={formData.leader.college} onChange={e => setFormData({...formData, leader: {...formData.leader, college: e.target.value}})} required />
                 <div className="grid grid-cols-2 gap-4">
                    <input className="input-modal" placeholder="Year" value={formData.leader.year} onChange={e => setFormData({...formData, leader: {...formData.leader, year: e.target.value}})} required />
                    <input className="input-modal" placeholder="Dept" value={formData.leader.dept} onChange={e => setFormData({...formData, leader: {...formData.leader, dept: e.target.value}})} required />
                 </div>
              </div>
            </div>

            {/* Member Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3"><span className="w-8 h-8 bg-teal-500 text-white rounded-lg flex items-center justify-center font-black text-xs">02</span><h3 className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Team Member Details</h3></div>
              <div className="space-y-4">
                 <input className="input-modal" placeholder="Member Legal Name" value={formData.member.name} onChange={e => setFormData({...formData, member: {...formData.member, name: e.target.value}})} required />
                 <input className="input-modal" placeholder="College / Institution" value={formData.member.college} onChange={e => setFormData({...formData, member: {...formData.member, college: e.target.value}})} required />
                 <div className="grid grid-cols-2 gap-4">
                    <input className="input-modal" placeholder="Year" value={formData.member.year} onChange={e => setFormData({...formData, member: {...formData.member, year: e.target.value}})} required />
                    <input className="input-modal" placeholder="Dept" value={formData.member.dept} onChange={e => setFormData({...formData, member: {...formData.member, dept: e.target.value}})} required />
                 </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <button type="button" onClick={onClose} className="flex-1 py-5 rounded-2xl font-black text-[11px] tracking-widest text-slate-400 border-2 border-slate-100 hover:bg-slate-50 transition-all uppercase">Abort</button>
             <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-[#020617] text-white rounded-2xl font-black text-[11px] tracking-widest hover:bg-teal-500 transition-all shadow-2xl active:scale-95 uppercase">{isSubmitting ? 'Securing...' : 'Verify & Secure Metadata'}</button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input-modal {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          padding: 1.25rem 1.5rem;
          font-weight: 800;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s ease;
          text-transform: uppercase;
        }
        .input-modal:focus {
          border-color: #0d9488;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
