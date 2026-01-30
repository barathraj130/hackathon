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
      await axios.post(`${apiUrl}/admin/update-certificates`, {
        teamId,
        participants: [formData.leader, formData.member]
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      alert("Names saved successfully.");
      onComplete();
      onClose();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">EDIT NAMES</h2>
            <p className="text-xs font-bold text-[var(--secondary-blue)] tracking-wider mt-1 uppercase">Team: {teamName}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center font-bold text-slate-400 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-2 gap-10">
            {/* Leader Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3"><span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">01</span><h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Leader Details</h3></div>
              <div className="space-y-4">
                 <div className="space-y-1.5"><label className="label-premium !mb-0">Full Name</label><input className="input-premium" placeholder="Legal Name" value={formData.leader.name} onChange={e => setFormData({...formData, leader: {...formData.leader, name: e.target.value}})} required /></div>
                 <div className="space-y-1.5"><label className="label-premium !mb-0">College</label><input className="input-premium" placeholder="College Name" value={formData.leader.college} onChange={e => setFormData({...formData, leader: {...formData.leader, college: e.target.value}})} required /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="label-premium !mb-0">Year</label><input className="input-premium" placeholder="Year" value={formData.leader.year} onChange={e => setFormData({...formData, leader: {...formData.leader, year: e.target.value}})} required /></div>
                    <div className="space-y-1.5"><label className="label-premium !mb-0">Dept</label><input className="input-premium" placeholder="Department" value={formData.leader.dept} onChange={e => setFormData({...formData, leader: {...formData.leader, dept: e.target.value}})} required /></div>
                 </div>
              </div>
            </div>

            {/* Member Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3"><span className="w-8 h-8 bg-green-50 text-green-600 rounded-lg flex items-center justify-center font-bold text-xs">02</span><h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Member Details</h3></div>
              <div className="space-y-4">
                 <div className="space-y-1.5"><label className="label-premium !mb-0">Full Name</label><input className="input-premium" placeholder="Legal Name" value={formData.member.name} onChange={e => setFormData({...formData, member: {...formData.member, name: e.target.value}})} required /></div>
                 <div className="space-y-1.5"><label className="label-premium !mb-0">College</label><input className="input-premium" placeholder="College Name" value={formData.member.college} onChange={e => setFormData({...formData, member: {...formData.member, college: e.target.value}})} required /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="label-premium !mb-0">Year</label><input className="input-premium" placeholder="Year" value={formData.member.year} onChange={e => setFormData({...formData, member: {...formData.member, year: e.target.value}})} required /></div>
                    <div className="space-y-1.5"><label className="label-premium !mb-0">Dept</label><input className="input-premium" placeholder="Department" value={formData.member.dept} onChange={e => setFormData({...formData, member: {...formData.member, dept: e.target.value}})} required /></div>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
             <button type="button" onClick={onClose} className="flex-1 py-4 rounded-xl font-bold text-xs text-slate-400 border border-slate-200 hover:bg-slate-50 transition-all uppercase">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 btn-blue rounded-xl font-bold text-xs tracking-widest hover:-translate-y-0.5 shadow-xl shadow-blue-100 transition-all uppercase">{isSubmitting ? 'Saving...' : 'Save Member Details'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
