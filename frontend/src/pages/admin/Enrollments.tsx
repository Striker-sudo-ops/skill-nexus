import { useState, useEffect } from 'react';
import { getAdminEnrollments } from '../../services/api';
import { Card, Spinner } from '../../components/ui';
import { 
  Users, Search, CheckCircle2, XCircle, Clock, 
  MapPin, GraduationCap, Phone, Mail, ShieldOff
} from 'lucide-react';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    getAdminEnrollments()
      .then(res => setEnrollments(res.data.enrollments || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments
    .filter(e => statusFilter === 'ALL' || e.status === statusFilter)
    .filter(e => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        e.full_name?.toLowerCase().includes(s) ||
        e.email?.toLowerCase().includes(s) ||
        e.course_title?.toLowerCase().includes(s) ||
        e.course_code?.toLowerCase().includes(s) ||
        e.city?.toLowerCase().includes(s)
      );
    });

  const totalCount = enrollments.length;
  const pendingCount = enrollments.filter(e => e.status === 'PENDING').length;
  const confirmedCount = enrollments.filter(e => e.status === 'CONFIRMED').length;
  const revokedCount = enrollments.filter(e => e.status === 'REVOKED').length;

  const statusBadge = (status: string) => {
    if (status === 'CONFIRMED') return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-3 h-3" /> Confirmed
      </span>
    );
    if (status === 'REJECTED') return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1 w-fit">
        <XCircle className="w-3 h-3" /> Rejected
      </span>
    );
    if (status === 'REVOKED') return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 flex items-center gap-1 w-fit">
        <ShieldOff className="w-3 h-3" /> Revoked
      </span>
    );
    return (
      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trainee Course Enrollments</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Read-only view of all student course applications across accredited programs
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} records</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Total</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalCount}</div>
        </Card>
        <Card className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">Pending</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</div>
        </Card>
        <Card className="p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">Confirmed</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{confirmedCount}</div>
        </Card>
        <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Revoked</div>
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mt-1">{revokedCount}</div>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student, course, city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'PENDING', 'CONFIRMED', 'REVOKED'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No enrollment records found</p>
        </div>
      ) : (
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold">
                  <th className="py-3 px-4">Trainee Details</th>
                  <th className="py-3 px-3">Applied Course</th>
                  <th className="py-3 px-3">Education &amp; Location</th>
                  <th className="py-3 px-3">Applied Date</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-white">{e.full_name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{e.email}</span>
                        {e.phone && <span className="flex items-center gap-1">&bull; <Phone className="w-3 h-3" />{e.phone}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{e.course_title}</div>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                        {e.course_code}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{e.education || 'Graduate'}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{e.city || 'N/A'}{e.state ? `, ${e.state}` : ''}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400">
                      {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="py-3 px-3">{statusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
