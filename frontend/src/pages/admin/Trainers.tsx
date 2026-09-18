import { useState, useEffect } from 'react';
import { getAdminTrainers, addAdminTrainer, removeAdminTrainer, getAdminCourses, updateTrainerCourses } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { 
  GraduationCap, AlertTriangle, CheckCircle, 
  X, Trash2, UserPlus, Search, KeyRound, Copy, Check, ShieldCheck,
  BookOpen, Info
} from 'lucide-react';

const DOMAINS = ['Mechanical', 'Electrical', 'Data Science', 'IT', 'Healthcare', 'Electronics', 'Civil', 'Textile', 'Robotics', 'Automotive EV'];

const EMPTY_FORM = {
  name: '',
  email: '',
  domain: 'IT',
  district: '',
  state: 'Maharashtra',
  skills: '',
  capability_score: 85,
  needs_upskilling: false,
  recommended_upskilling: '',
  courses_assigned: ''
};

export default function AdminTrainers() {
  const [data, setData] = useState<any>(null);
  const [coursesList, setCoursesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyUpskill, setOnlyUpskill] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<any>(null);

  // Assign courses modal for existing trainer
  const [assigningTrainer, setAssigningTrainer] = useState<any | null>(null);
  const [assignCourseCodes, setAssignCourseCodes] = useState<string[]>([]);
  const [assignSaving, setAssignSaving] = useState(false);

  // View details modal
  const [viewTrainer, setViewTrainer] = useState<any | null>(null);

  // New Trainer Credentials Modal State
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);


  const loadData = () => {
    setLoading(true);
    Promise.all([getAdminTrainers(), getAdminCourses()])
      .then(([trainersRes, coursesRes]) => {
        setData(trainersRes.data);
        setCoursesList(coursesRes.data || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const trainers = data?.trainers || [];
  const filtered = trainers
    .filter((t: any) => !onlyUpskill || t.needs_upskilling)
    .filter((t: any) => !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.domain?.toLowerCase().includes(search.toLowerCase()) || t.district?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.domain) {
      alert('Name, Email, and Domain are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        courses_assigned: selectedCourseCodes.join(', ')
      };
      const res = await addAdminTrainer(payload);
      setCreatedCredentials(res.data.credentials);
      setForm({ ...EMPTY_FORM });
      setSelectedCourseCodes([]);
      setShowAddForm(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to register trainer');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (trainer: any) => {
    setRemoving(trainer.id);
    try {
      await removeAdminTrainer(trainer.id);
      setConfirmRemove(null);
      if (viewTrainer?.id === trainer.id) setViewTrainer(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to remove trainer');
    } finally {
      setRemoving(null);
    }
  };

  const openAssignModal = (trainer: any) => {
    const existing = (trainer.courses_assigned || '')
      .split(',')
      .map((c: string) => c.trim())
      .filter(Boolean);
    setAssignCourseCodes(existing);
    setAssigningTrainer(trainer);
  };

  const handleSaveAssignedCourses = async () => {
    if (!assigningTrainer) return;
    setAssignSaving(true);
    try {
      await updateTrainerCourses(assigningTrainer.id, {
        courses_assigned: assignCourseCodes.join(', ')
      });
      setAssigningTrainer(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update assigned courses');
    } finally {
      setAssignSaving(false);
    }
  };

  const toggleCourseCode = (code: string, currentList: string[], setList: (codes: string[]) => void) => {
    if (currentList.includes(code)) {
      setList(currentList.filter(c => c !== code));
    } else {
      setList([...currentList, code]);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `Trainer Login Credentials:\nTrainer ID: ${createdCredentials.trainer_id}\nEmail: ${createdCredentials.email}\nDefault Password: ${createdCredentials.default_password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trainer Management & Faculty Registry</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Faculty competency index, domain alignment, credentials provisioning, and mandated upskilling pipelines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyUpskill(!onlyUpskill)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              onlyUpskill
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {onlyUpskill ? 'Needing Upskill' : 'All Faculty'}
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add New Trainer
          </button>
        </div>
      </div>

      {/* Generated Credentials Success Modal */}
      {createdCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Trainer Account Created!</h3>
              </div>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400">
              A trainer account has been provisioned. Please copy and provide these credentials to the faculty member. They can log in immediately and manage their assigned course trainees.
            </p>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Trainer ID:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{createdCredentials.trainer_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <span className="font-bold text-gray-900 dark:text-white">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Default Password:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{createdCredentials.default_password}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyCredentials}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="py-2.5 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Total Registered Trainers</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.total || 0}</div>
        </Card>
        <Card className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div className="text-[11px] font-medium text-amber-800 dark:text-amber-400">Requiring Upskilling</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{data?.needing_upskill_count || 0}</div>
        </Card>
        <Card className="p-4 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 col-span-2 md:col-span-1">
          <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400">Verified Industry-Ready</div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{(data?.total || 0) - (data?.needing_upskill_count || 0)}</div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search trainers by name, domain, district..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Add Trainer Form */}
      {showAddForm && (
        <Card className="p-5 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-900/10 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" /> Register & Provision Faculty Trainer
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Automatically creates portal login credentials for the trainer with an assigned Trainer ID.
              </p>
            </div>
            <button onClick={() => { setShowAddForm(false); setForm({ ...EMPTY_FORM }); }} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Full Name *</label>
                <input className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Trainer full name" required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Email (Login ID) *</label>
                <input type="email" className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="trainer@domain.com" required />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Primary Domain *</label>
                <select className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} required>
                  {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">District</label>
                <input className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="e.g. Pune" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">State</label>
                <input className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="e.g. Maharashtra" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Capability Score (0-100)</label>
                <input type="number" min={0} max={100} className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.capability_score} onChange={e => setForm(f => ({ ...f, capability_score: Number(e.target.value) }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Specialized Skills (comma-separated)</label>
                <input className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} placeholder="e.g. Python, Machine Learning, Data Analytics" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Needs Upskilling?</label>
                <select className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.needs_upskilling ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, needs_upskilling: e.target.value === 'yes' }))}>
                  <option value="no">No - Ready</option>
                  <option value="yes">Yes - Requires Upskilling</option>
                </select>
              </div>

              {/* Multi-Course Selector from Admin-created courses */}
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Assign Courses (Select from all accredited courses created by Admin)
                </label>
                <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 max-h-48 overflow-y-auto space-y-1.5">
                  {coursesList.length === 0 ? (
                    <p className="text-xs text-gray-400">No courses created yet. Please add a course first in Courses & Capacity.</p>
                  ) : (
                    coursesList.map((course: any) => {
                      const isChecked = selectedCourseCodes.includes(course.course_code);
                      return (
                        <label key={course.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourseCode(course.course_code, selectedCourseCodes, setSelectedCourseCodes)}
                            className="rounded text-blue-600"
                          />
                          <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{course.course_code}</span>
                          <span className="text-gray-600 dark:text-gray-400">— {course.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ml-auto">{course.domain}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                {selectedCourseCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedCourseCodes.map(code => (
                      <span key={code} className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                        {code}
                        <button type="button" onClick={() => setSelectedCourseCodes(prev => prev.filter(c => c !== code))} className="hover:text-red-500">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {form.needs_upskilling && (
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Recommended Upskilling Programme</label>
                <input className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.recommended_upskilling} onChange={e => setForm(f => ({ ...f, recommended_upskilling: e.target.value }))} placeholder="e.g. Industry 4.0 Advanced Certification" />
              </div>
            )}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => { setShowAddForm(false); setForm({ ...EMPTY_FORM }); }} className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer">
                {saving ? 'Creating Account & ID...' : 'Provision Trainer Account'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Confirm Remove Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Remove Trainer</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This action revokes their login account</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">
              Are you sure you want to remove <strong>{confirmRemove.name}</strong> ({confirmRemove.trainer_code || 'ID pending'}) from the trainer registry?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemove(null)} className="flex-1 py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">Cancel</button>
              <button
                onClick={() => handleRemove(confirmRemove)}
                disabled={removing === confirmRemove.id}
                className="flex-1 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer"
              >
                {removing === confirmRemove.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trainers Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No trainers found</p>
        </div>
      ) : (
        <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold">
                  <th className="py-3 px-4">Trainer ID & Name</th>
                  <th className="py-3 px-3">Contact & Login</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Domain</th>
                  <th className="py-3 px-3">Assigned Courses</th>
                  <th className="py-3 px-3">Capability</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {t.name}
                        {t.trainer_code && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-700">
                            {t.trainer_code}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[150px]">{t.skills}</div>
                    </td>

                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300 font-mono text-[11px]">
                      {t.email}
                    </td>

                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                      {t.district && <span className="font-medium">{t.district}, </span>}
                      <span className="text-gray-500 dark:text-gray-400">{t.state}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded font-medium text-[11px]">
                        {t.domain}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-gray-600 dark:text-gray-400 max-w-[130px] truncate">
                      {t.courses_assigned ? (
                        <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">{t.courses_assigned}</span>
                      ) : (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${t.capability_score >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${t.capability_score}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">{t.capability_score}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {t.needs_upskilling ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="w-3 h-3" /> Upskill Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle className="w-3 h-3" /> Certified
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setViewTrainer(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                          title="View Trainer Details"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openAssignModal(t)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors cursor-pointer"
                          title="Assign / Edit Courses"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmRemove(t)}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                          title="Remove trainer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Assign Courses to Existing Trainer Modal */}
      {assigningTrainer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Assign Courses to Trainer</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{assigningTrainer.name} ({assigningTrainer.trainer_code || assigningTrainer.email})</p>
              </div>
              <button onClick={() => setAssigningTrainer(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Select Accredited Courses (Multiple allowed):
              </label>
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/60 max-h-60 overflow-y-auto space-y-2">
                {coursesList.length === 0 ? (
                  <p className="text-xs text-gray-400">No courses in catalog.</p>
                ) : (
                  coursesList.map((course: any) => {
                    const isChecked = assignCourseCodes.includes(course.course_code);
                    return (
                      <label key={course.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-300 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCourseCode(course.course_code, assignCourseCodes, setAssignCourseCodes)}
                          className="mt-0.5 rounded text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{course.course_code}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{course.domain}</span>
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{course.title}</div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">{assignCourseCodes.length} course(s) selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setAssigningTrainer(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignedCourses}
                  disabled={assignSaving}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  {assignSaving ? 'Saving...' : 'Update Assigned Courses'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trainer Info Modal */}
      {viewTrainer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{viewTrainer.name}</h3>
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400">{viewTrainer.trainer_code || 'ID Pending'}</span>
              </div>
              <button onClick={() => setViewTrainer(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Email (Login):</span>
                <span className="font-mono text-gray-900 dark:text-white">{viewTrainer.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Domain:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{viewTrainer.domain}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Location:</span>
                <span className="text-gray-900 dark:text-white">{viewTrainer.district ? `${viewTrainer.district}, ` : ''}{viewTrainer.state}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Capability Score:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{viewTrainer.capability_score} / 100</span>
              </div>
              <div className="py-1">
                <span className="text-gray-500 block mb-1">Specialized Skills:</span>
                <p className="text-gray-800 dark:text-gray-200">{viewTrainer.skills || 'Not specified'}</p>
              </div>
              <div className="py-1">
                <span className="text-gray-500 block mb-1">Currently Assigned Courses:</span>
                {viewTrainer.courses_assigned ? (
                  <div className="flex flex-wrap gap-1">
                    {viewTrainer.courses_assigned.split(',').map((c: string) => (
                      <span key={c} className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {c.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">No courses currently assigned</span>
                )}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => { const tr = viewTrainer; setViewTrainer(null); openAssignModal(tr); }}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" /> Assign / Edit Courses
              </button>
              <button
                onClick={() => setViewTrainer(null)}
                className="py-2 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

