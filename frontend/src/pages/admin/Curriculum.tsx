import { useState, useEffect } from 'react';
import { getCurriculumUpdates, actionCurriculumUpdate } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { Check, X, ShieldAlert, Clock, Building } from 'lucide-react';

export default function AdminCurriculum() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);

  const fetchUpdates = () => {
    setLoading(true);
    getCurriculumUpdates()
      .then(res => setUpdates(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleAction = async (id: number, action: 'APPROVE' | 'REJECT') => {
    setActioningId(id);
    try {
      await actionCurriculumUpdate(id, action);
      // Immediately update local state
      setUpdates(prev => prev.map(u => u.id === id ? { ...u, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : u));
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Evolution & Industry Review</h1>
          <p className="text-xs text-gray-500 mt-0.5">Track proposed syllabus amendments from industry bodies, evaluate justifications, and approve or reject in real time</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map(u => {
            const isPending = u.status === 'PENDING';
            const isApproved = u.status === 'APPROVED';

            return (
              <Card key={u.id} className="p-5 border border-gray-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-800 rounded border border-gray-200">
                      {u.course_code}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{u.title}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isPending ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {u.status}
                    </span>

                    {isPending && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          disabled={actioningId === u.id}
                          onClick={() => handleAction(u.id, 'APPROVE')}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          disabled={actioningId === u.id}
                          onClick={() => handleAction(u.id, 'REJECT')}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-gray-400" />
                  <span>Submitted by: <strong className="text-gray-700">{u.submitted_by}</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Proposed Amendments:
                    </div>
                    <p className="text-xs text-gray-800 leading-relaxed">{u.proposed_changes}</p>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider mb-1">
                      Industry Justification:
                    </div>
                    <p className="text-xs text-blue-950 leading-relaxed">{u.industry_justification}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
