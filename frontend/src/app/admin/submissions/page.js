'use client';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, SUBMITTED, LOCKED, PENDING

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    try {
      const res = await axios.get(`${apiUrl}/admin/submissions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSubmissions(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const toggleRegenerate = async (teamId, currentValue) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://hackathon-production-7c99.up.railway.app/v1';
    if (!confirm(`${currentValue ? 'Lock' : 'Unlock'} regeneration for this team?`)) return;

    try {
      await axios.post(`${apiUrl}/admin/toggle-regenerate`, 
        { teamId, canRegenerate: !currentValue },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
      );
      alert('Permission updated');
      fetchSubmissions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update permission');
    }
  };

  const downloadPPT = (pptUrl) => {
    const fullUrl = `${process.env.NEXT_PUBLIC_PPT_URL || 'https://hackathon-production-c6be.up.railway.app'}/outputs/${pptUrl.split('/').pop()}`;
    window.open(fullUrl, '_blank');
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'ALL') return true;
    if (filter === 'SUBMITTED') return s.status === 'SUBMITTED';
    if (filter === 'LOCKED') return s.status === 'LOCKED';
    if (filter === 'PENDING') return !s.pptUrl;
    return true;
  });

  return (
    <div className="min-h-screen bg-bg-light p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-navy uppercase tracking-tight mb-2">Submission Management</h1>
            <p className="text-slate-500 font-medium">Manage team submissions, prototypes, and certificates</p>
          </div>
          <Link href="/admin/dashboard" className="px-6 py-3 bg-navy text-white rounded-xl font-bold uppercase text-sm hover:bg-teal transition-all">
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-3">
          {['ALL', 'PENDING', 'SUBMITTED', 'LOCKED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${
                filter === f 
                  ? 'bg-teal text-white' 
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-20 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-teal border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400 font-medium">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Team</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">PPT</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Prototype</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Certificate</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Regenerate</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-navy">{sub.team.teamName}</p>
                          <p className="text-xs text-slate-500">{sub.team.collegeName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                          sub.status === 'LOCKED' ? 'bg-navy text-white' :
                          sub.status === 'SUBMITTED' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {sub.pptUrl ? (
                          <span className="text-emerald-600 text-xl">✓</span>
                        ) : (
                          <span className="text-slate-300 text-xl">○</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {sub.prototypeUrl ? (
                          <a href={sub.prototypeUrl} target="_blank" rel="noopener noreferrer" className="text-teal hover:underline text-xs truncate block max-w-[200px]">
                            {sub.prototypeUrl}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {sub.certificateName ? (
                          <div className="text-xs">
                            <p className="font-bold text-navy">{sub.certificateName}</p>
                            <p className="text-slate-500">{sub.certificateCollege}</p>
                            <p className="text-slate-500">Year {sub.certificateYear}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Not submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleRegenerate(sub.teamId, sub.canRegenerate)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all ${
                            sub.canRegenerate 
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                              : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          }`}
                        >
                          {sub.canRegenerate ? '🔓 Allowed' : '🔒 Locked'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {sub.pptUrl && (
                          <button
                            onClick={() => downloadPPT(sub.pptUrl)}
                            className="px-4 py-2 bg-teal text-white rounded-lg font-bold text-xs uppercase hover:bg-navy transition-all"
                          >
                            Download PPT
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
