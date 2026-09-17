import { useState, useEffect, useCallback } from 'react';
import { getAdminSkills, createAdminSkill, updateAdminSkill, deleteAdminSkill } from '../../services/api';
import { Card, Spinner } from '../../components/ui';
import {
  Plus, Search, Trash2, Edit3, CheckCircle2, XCircle, X,
  TrendingUp, TrendingDown, Minus, Flame, RefreshCw, ChevronDown
} from 'lucide-react';

const DOMAINS = ['IT', 'Data Science', 'Healthcare', 'Mechanical', 'Electrical', 'Electronics', 'Manufacturing', 'BFSI', 'Renewable Energy', 'Civil', 'Automotive', 'General'];
const TRENDS  = ['HOT', 'RISING', 'STABLE', 'DECLINING'];

function TrendBadge({ trend }: { trend: string }) {
  if (trend === 'HOT')      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"><Flame className="w-3 h-3"/>HOT</span>;
  if (trend === 'RISING')   return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><TrendingUp className="w-3 h-3"/>RISING</span>;
  if (trend === 'STABLE')   return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><Minus className="w-3 h-3"/>STABLE</span>;
  if (trend === 'DECLINING') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700"><TrendingDown className="w-3 h-3"/>DECLINING</span>;
  return null;
}

const DEFAULT_FORM = { name: '', domain: 'IT', description: '', demand_score: 70, median_salary: 600000, trend: 'RISING' };

export default function AdminSkills() {
  const [skills, setSkills]         = useState<any[]>([]);
  const [domains, setDomains]       = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [filterTrend, setFilterTrend]   = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any | null>(null);
  const [form, setForm]             = useState({ ...DEFAULT_FORM });
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState<number | null>(null);
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [totalJobs, setTotalJobs]   = useState(0);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterDomain !== 'ALL') params.domain = filterDomain;
      if (filterTrend !== 'ALL') params.trend = filterTrend;
      if (search) params.search = search;
      const res = await getAdminSkills(params);
      setSkills(res.data?.skills || []);
      setDomains(res.data?.domains || DOMAINS);
      setTotalJobs(res.data?.skills?.reduce((a: number, s: any) => a + (s.job_count || 0), 0) || 0);
    } catch {
      showToast('Failed to load skills', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterDomain, filterTrend, search]);

  useEffect(() => {
    const t = setTimeout(fetchSkills, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchSkills]);

  const openAdd = () => { setForm({ ...DEFAULT_FORM }); setEditingSkill(null); setShowAddModal(true); };
  const openEdit = (skill: any) => {
    setForm({ name: skill.name, domain: skill.domain || 'IT', description: skill.description || '', demand_score: skill.demand_score ?? 70, median_salary: skill.median_salary ?? 600000, trend: skill.trend || 'RISING' });
    setEditingSkill(skill); setShowAddModal(true);
  };
  const closeModal = () => { setShowAddModal(false); setEditingSkill(null); setForm({ ...DEFAULT_FORM }); };

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Skill name is required', 'error'); return; }
    if (!form.domain.trim()) { showToast('Domain is required', 'error'); return; }
    if (form.demand_score < 0 || form.demand_score > 100) { showToast('Demand score must be 0-100', 'error'); return; }
    setSaving(true);
    try {
      if (editingSkill) { await updateAdminSkill(editingSkill.id, form); showToast(`Skill "${form.name}" updated`); }
      else { await createAdminSkill(form); showToast(`Skill "${form.name}" added to database`); }
      closeModal(); fetchSkills();
    } catch (err: any) { showToast(err?.response?.data?.detail || 'Failed to save skill', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (skill: any) => {
    if (!window.confirm(`Delete skill "${skill.name}"? This will also remove it from all job listings and student profiles.`)) return;
    setDeleting(skill.id);
    try { await deleteAdminSkill(skill.id); showToast(`Skill "${skill.name}" deleted`); fetchSkills(); }
    catch (err: any) { showToast(err?.response?.data?.detail || 'Failed to delete skill', 'error'); }
    finally { setDeleting(null); }
  };

  const demandColor = (score: number) => {
    if (score >= 85) return 'bg-red-500';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border ${toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700' : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Skill Database Management</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{skills.length} skills tracked · {totalJobs} total job references · Add, edit, or remove skills</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchSkills} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors shadow-sm cursor-pointer"><Plus className="w-4 h-4" />Add New Skill</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Skills', value: skills.length, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'HOT Skills', value: skills.filter(s => s.trend === 'HOT').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
          { label: 'RISING Skills', value: skills.filter(s => s.trend === 'RISING').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Declining', value: skills.filter(s => s.trend === 'DECLINING').length, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' },
        ].map(kpi => (
          <Card key={kpi.label} className={`p-3.5 border border-gray-200 dark:border-gray-800 ${kpi.bg} rounded-xl`}>
            <div className={`text-xl font-black ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">{kpi.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search skill name..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="relative">
            <select value={filterDomain} onChange={e => setFilterDomain(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="ALL">All Domains</option>
              {(domains.length ? domains : DOMAINS).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterTrend} onChange={e => setFilterTrend(e.target.value)} className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="ALL">All Trends</option>
              {TRENDS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </Card>

      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner className="w-8 h-8" /></div>
        ) : skills.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No skills found</p>
            <p className="text-xs mt-1">Adjust filters or add a new skill</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Skill</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Domain</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Demand</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Salary</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Jobs</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trend</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {skills.map((skill: any) => (
                  <tr key={skill.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">{skill.name}</div>
                      {skill.description && <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[200px]">{skill.description}</div>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">{skill.domain}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${demandColor(skill.demand_score)}`} style={{ width: `${skill.demand_score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{Math.round(skill.demand_score)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rs.{((skill.median_salary || 0) / 100000).toFixed(1)}L</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{skill.job_count} jobs</span>
                    </td>
                    <td className="px-4 py-3"><TrendBadge trend={skill.trend} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => openEdit(skill)} className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer" title="Edit skill"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(skill)} disabled={deleting === skill.id} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50" title="Delete skill">
                          {deleting === skill.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-[9000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{editingSkill ? `Edit: ${editingSkill.name}` : 'Add New Skill'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editingSkill ? 'Update skill properties and save' : 'This skill will be tracked in telemetry and matched to jobs'}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Skill Name *</label>
                <input type="text" placeholder="e.g. Generative AI, Flutter, Robotics..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Domain / Sector *</label>
                <div className="relative">
                  <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="w-full appearance-none px-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="font-normal text-gray-400">(optional)</span></label>
                <textarea placeholder="Brief description of this skill..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Demand Score (0-100)</label>
                  <input type="number" min={0} max={100} value={form.demand_score} onChange={e => setForm(f => ({ ...f, demand_score: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Market Trend</label>
                  <div className="relative">
                    <select value={form.trend} onChange={e => setForm(f => ({ ...f, trend: e.target.value }))} className="w-full appearance-none px-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                      {TRENDS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Median Salary (Rs/year) <span className="ml-1 text-gray-400 font-normal">= Rs.{(form.median_salary / 100000).toFixed(1)}L LPA</span></label>
                <input type="number" step={50000} min={0} value={form.median_salary} onChange={e => setForm(f => ({ ...f, median_salary: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="text-[11px] text-gray-400 bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-2">
                <strong>Note:</strong> After saving, the next "Sync Live Data" will dynamically update the demand score and trend from GitHub telemetry.
              </div>
            </div>
            <div className="flex items-center gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold cursor-pointer transition-colors flex items-center justify-center gap-2">
                {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</> : (editingSkill ? 'Save Changes' : 'Add Skill')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
