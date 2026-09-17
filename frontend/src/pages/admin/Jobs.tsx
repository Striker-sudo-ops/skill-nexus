import { useState, useEffect, useCallback } from "react";
import { getAdminJobs, deleteAdminJob, deactivateAdminJob } from "../../services/api";
import { Card, Spinner } from "../../components/ui";
import { Search, Trash2, EyeOff, RefreshCw, CheckCircle2, XCircle, X, ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const SOURCES = ["indgovtjobs", "freejobalert", "remoteok", "jobicy", "remotive", "ncs", "mahaswayam"];

function SourceBadge({ src }: { src: string }) {
  const s = (src || "").toLowerCase();
  if (s.includes("indgovt")) return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Govt</span>;
  if (s.includes("freejobalert")) return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">PSU</span>;
  if (s.includes("remoteok")) return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">RemoteOK</span>;
  if (s.includes("jobicy")) return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">Jobicy</span>;
  if (s.includes("remotive")) return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800">Remotive</span>;
  if (s.includes("ncs")) return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">NCS</span>;
  if (s.includes("maha")) return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Mahaswayam</span>;
  return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{src}</span>;
}

export default function AdminJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchJobs = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params: any = { page: pg, per_page: 50 };
      if (q) params.q = q;
      if (filterSource) params.source = filterSource;
      if (filterActive === "active") params.is_active = true;
      if (filterActive === "inactive") params.is_active = false;
      const res = await getAdminJobs(params);
      setJobs(res.data?.jobs || []);
      setTotal(res.data?.total || 0);
      setPages(res.data?.pages || 1);
      setPage(pg);
    } catch {
      showToast("Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  }, [q, filterSource, filterActive]);

  useEffect(() => {
    const t = setTimeout(() => fetchJobs(1), q ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  const handleDelete = async (job: any) => {
    if (!window.confirm(`Permanently delete "${job.title}"?\n\nThis cannot be undone. The job will be gone from all student views and saved lists.`)) return;
    setActionId(job.id);
    try {
      await deleteAdminJob(job.id);
      showToast(`"${job.title}" permanently deleted`);
      fetchJobs(page);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to delete job", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDeactivate = async (job: any) => {
    setActionId(job.id);
    try {
      await deactivateAdminJob(job.id);
      showToast(`"${job.title}" marked as inactive (hidden from students)`);
      fetchJobs(page);
    } catch (err: any) {
      showToast(err?.response?.data?.detail || "Failed to deactivate job", "error");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border ${toast.type === "success" ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700" : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700"}`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Job Database Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {total} total jobs — search, review, deactivate or permanently delete invalid entries
          </p>
        </div>
        <button onClick={() => fetchJobs(page)} className="self-start sm:self-auto p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Info banner */}
      <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
        <span className="font-bold shrink-0">Note:</span>
        <span>
          <strong>Deactivate</strong> hides the job from students but keeps it in DB (recoverable on next sync).
          <strong className="ml-1">Delete</strong> permanently removes it. Deleted jobs will NOT come back even after a sync.
        </span>
      </div>

      {/* Filters */}
      <Card className="p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search job title, company, description..." value={q} onChange={e => setQ(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="">All Sources</option>
              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="">All Status</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">No jobs found matching your filters</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title & Company</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {jobs.map((job: any) => (
                  <tr key={job.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!job.is_active ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">#{job.id}</td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="font-semibold text-gray-900 dark:text-white text-xs leading-snug line-clamp-2">{job.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 truncate">{job.company_name}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell"><SourceBadge src={job.source} /></td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{job.city || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      {job.is_active
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Active</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 border border-gray-300 dark:border-gray-700">Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {job.apply_url && (
                          <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors" title="Open job link">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {job.is_active && (
                          <button onClick={() => handleDeactivate(job)} disabled={actionId === job.id} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer disabled:opacity-50" title="Hide from students (deactivate)">
                            {actionId === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button onClick={() => handleDelete(job)} disabled={actionId === job.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50" title="Permanently delete">
                          {actionId === job.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-xs text-gray-500 dark:text-gray-400">Showing page {page} of {pages} ({total} total jobs)</span>
          <div className="flex items-center gap-2">
            <button onClick={() => fetchJobs(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 px-2">{page} / {pages}</span>
            <button onClick={() => fetchJobs(page + 1)} disabled={page >= pages} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
