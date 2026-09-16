import { useState, useEffect } from 'react';
import { getTrainerEnrollments, revokeEnrollment } from '../../services/api';
import { Card, Spinner } from '../../components/ui';
import { Users, Mail, Phone, Search, ShieldOff, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TrainerEnrollments() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [revokeMsg, setRevokeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEnrollments = () => {
    setLoading(true);
    getTrainerEnrollments()
      .then(res => setEnrollments(res.data.enrollments || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEnrollments(); }, []);

  const filtered = enrollments.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      e.full_name?.toLowerCase().includes(s) ||
      e.email?.toLowerCase().includes(s) ||
      e.course_title?.toLowerCase().includes(s) ||
      e.course_code?.toLowerCase().includes(s)
    );
  });

  const handleRevoke = async () => {
    if (!revokeTarget || !revokeReason.trim()) return;
    setRevoking(true);
    setRevokeMsg(null);
    try {
      await revokeEnrollment(revokeTarget.id, revokeReason);
      setRevokeMsg({ type: 'success', text: `Access revoked for ${revokeTarget.full_name}.` });
      setTimeout(() => {
        setRevokeTarget(null);
        setRevokeReason('');
        setRevokeMsg(null);
        fetchEnrollments();
      }, 1500);
    } catch (err: any) {
      setRevokeMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to revoke access.' });
    } finally {
      setRevoking(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      CONFIRMED: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      PENDING: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
      REVOKED: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600',
      REJECTED: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${map[status] || map['PENDING']}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Enrolled Trainees</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Students enrolled in your assigned courses — you can revoke access if needed
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} students</div>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by student, course..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No student enrollment records found</p>
        </div>
      ) : (
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold">
                  <th className="py-3 px-4">Trainee</th>
                  <th className="py-3 px-3">Course</th>
                  <th className="py-3 px-3">Education</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">{e.full_name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{e.email}</span>
                        {e.phone && <span>&bull; {e.phone}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{e.course_title}</div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        {e.course_code}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300">{e.education || 'Graduate'}</td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                      {e.city || 'N/A'}{e.state ? `, ${e.state}` : ''}
                    </td>
                    <td className="py-3 px-3">{statusBadge(e.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {e.status !== 'REVOKED' ? (
                        <button
                          onClick={() => { setRevokeTarget(e); setRevokeReason(''); setRevokeMsg(null); }}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors ml-auto"
                        >
                          <ShieldOff className="w-3 h-3" /> Revoke
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Revoke Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center justify-center">
                  <ShieldOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Revoke Access</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{revokeTarget.full_name}</p>
                </div>
              </div>
              <button
                onClick={() => setRevokeTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              This will revoke <strong>{revokeTarget.full_name}</strong>'s access to <strong>{revokeTarget.course_title}</strong>. Please provide a reason.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Reason for Revocation <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={revokeReason}
                onChange={e => setRevokeReason(e.target.value)}
                placeholder="e.g. Student missed mandatory sessions, misconduct, withdrew..."
                className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
            </div>

            {revokeMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                revokeMsg.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}>
                {revokeMsg.type === 'success'
                  ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                  : <AlertCircle className="w-4 h-4 shrink-0" />}
                {revokeMsg.text}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setRevokeTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking || !revokeReason.trim()}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                {revoking ? 'Revoking...' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
