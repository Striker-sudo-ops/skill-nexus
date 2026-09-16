import { useState, useEffect } from 'react';
import { getAdminCourses, addAdminCourse } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { 
  BookOpen, AlertTriangle, CheckCircle, Sparkles, AlertCircle, 
  TrendingUp, X, Info, Users, Plus, Check
} from 'lucide-react';

const DOMAINS = ['IT', 'Data Science', 'Healthcare', 'Mechanical', 'Electrical', 'Electronics', 'Civil', 'Textile', 'Robotics', 'Automotive EV'];
const DEPTHS = ['Foundational', 'Intermediate', 'Advanced Industry-Ready'];

const EMPTY_COURSE = {
  course_code: '',
  title: '',
  description: '',
  domain: 'IT',
  depth_level: 'Intermediate',
  skills_offered: '',
  duration_weeks: 12,
  industry_demand_alignment: 85,
  target_capacity: 250,
  placement_rate: 80,
  employer_satisfaction: 85,
  related_job_roles: '',
  ai_analysis: ''
};

export default function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // Add Course Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_COURSE });
  const [submitting, setSubmitting] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const fetchCourses = () => {
    setLoading(true);
    getAdminCourses({ filter_type: filter === 'ALL' ? undefined : filter })
      .then(res => setCourses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_code || !form.title || !form.skills_offered) {
      alert('Course Code, Title, and Skills are required.');
      return;
    }
    setSubmitting(true);
    try {
      await addAdminCourse(form);
      setAddSuccess(true);
      setTimeout(() => {
        setAddSuccess(false);
        setShowAddModal(false);
        setForm({ ...EMPTY_COURSE });
        fetchCourses();
      }, 1200);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses & Capacity Audit</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Evaluate course relevance, industry alignment, placement rates, and dynamically create accredited curricula
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Course
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: 'All Courses', icon: null },
          { id: 'HIGH_DEMAND', label: 'High Industry Demand', icon: TrendingUp },
          { id: 'OUTDATED', label: 'Outdated Curricula', icon: AlertTriangle },
          { id: 'OVERSUPPLIED', label: 'Oversupplied Capacity', icon: AlertCircle }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No courses found for this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {courses.map(c => {
            const isHighDemand = c.industry_demand_alignment >= 90.0;
            return (
              <Card key={c.id} className="p-5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 transition-all flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                        {c.course_code}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                        {c.depth_level}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.is_outdated && (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Outdated
                        </span>
                      )}
                      {c.is_oversupplied && (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Oversupplied
                        </span>
                      )}
                      {isHighDemand && !c.is_outdated && (
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> High Demand
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{c.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{c.description}</p>
                  </div>

                  {/* Skills Chips */}
                  <div className="flex flex-wrap gap-1">
                    {c.skills_offered?.split(',').slice(0, 5).map((s: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] font-medium">
                        {s.trim()}
                      </span>
                    ))}
                    {(c.skills_offered?.split(',').length || 0) > 5 && (
                      <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded text-[11px]">
                        +{c.skills_offered.split(',').length - 5}
                      </span>
                    )}
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Alignment</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{c.industry_demand_alignment}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Placement</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{c.placement_rate}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Emp. Sat.</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{c.employer_satisfaction}%</div>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-600 dark:text-gray-400 mb-1 font-medium">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.enrolled_count} trainees enrolled</span>
                      <span>Capacity: {c.target_capacity}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.enrolled_count > c.target_capacity ? 'bg-red-500' : 'bg-blue-600'}`}
                        style={{ width: `${Math.min(100, (c.enrolled_count / c.target_capacity) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Details button */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 mt-3">
                  <button
                    onClick={() => setSelectedCourse(c)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    View Full Details
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add New Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Add Accredited Course
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white">Course Successfully Created!</h4>
                <p className="text-xs text-gray-500">The curriculum has been registered and is now live across the portal.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateCourse} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Course Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CRS-AI-204"
                      value={form.course_code}
                      onChange={e => setForm(f => ({ ...f, course_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Domain *</label>
                    <select
                      value={form.domain}
                      onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Course Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Applied Machine Learning & Predictive Analytics"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Description *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Provide an overview of the curriculum, objectives, and practical lab modules..."
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Depth Level</label>
                    <select
                      value={form.depth_level}
                      onChange={e => setForm(f => ({ ...f, depth_level: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {DEPTHS.map(dl => <option key={dl} value={dl}>{dl}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Duration (Weeks)</label>
                    <input
                      type="number"
                      min={1}
                      value={form.duration_weeks}
                      onChange={e => setForm(f => ({ ...f, duration_weeks: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Skills Offered (comma-separated) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Python, Deep Learning, Computer Vision, MLOps"
                      value={form.skills_offered}
                      onChange={e => setForm(f => ({ ...f, skills_offered: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Industry Demand Alignment %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.industry_demand_alignment}
                      onChange={e => setForm(f => ({ ...f, industry_demand_alignment: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Target Training Capacity</label>
                    <input
                      type="number"
                      min={10}
                      value={form.target_capacity}
                      onChange={e => setForm(f => ({ ...f, target_capacity: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Related Job Roles</label>
                    <input
                      type="text"
                      placeholder="e.g. Machine Learning Engineer, Data Scientist, AI Specialist"
                      value={form.related_job_roles}
                      onChange={e => setForm(f => ({ ...f, related_job_roles: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {submitting ? 'Creating Course...' : 'Publish Accredited Course'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                    {selectedCourse.course_code}
                  </span>
                  <Badge color="blue">{selectedCourse.depth_level}</Badge>
                  {selectedCourse.is_outdated && <Badge color="red">Outdated</Badge>}
                  {selectedCourse.is_oversupplied && <Badge color="orange">Oversupplied</Badge>}
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedCourse.title}</h2>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="ml-3 p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Description</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{selectedCourse.description}</p>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                  <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">Industry Alignment</div>
                  <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">{selectedCourse.industry_demand_alignment}%</div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 text-center">
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Placement Rate</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{selectedCourse.placement_rate}%</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 text-center">
                  <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase tracking-wider">Employer Satisfaction</div>
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">{selectedCourse.employer_satisfaction}%</div>
                </div>
              </div>

              {/* Skills Offered */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Skills Developed</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourse.skills_offered?.split(',').map((s: string, idx: number) => (
                    <span key={idx} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Roles */}
              {selectedCourse.related_job_roles && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Qualifies For Roles</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedCourse.related_job_roles}</p>
                </div>
              )}

              {/* Capacity */}
              <div>
                <div className="flex justify-between text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Training Capacity</span>
                  <span>{selectedCourse.enrolled_count} / {selectedCourse.target_capacity} filled</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedCourse.enrolled_count > selectedCourse.target_capacity ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (selectedCourse.enrolled_count / selectedCourse.target_capacity) * 100)}%` }}
                  />
                </div>
              </div>

              {/* AI Analysis */}
              {selectedCourse.ai_analysis && (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">AI Curriculum Analysis</div>
                    <p className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">{selectedCourse.ai_analysis}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => setSelectedCourse(null)}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
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
