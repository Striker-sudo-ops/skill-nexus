import { useState, useEffect } from 'react';
import { submitSuggestion, getMySuggestions } from '../../services/api';
import { Lightbulb, Send, CheckCircle, Clock, XCircle, AlertCircle, BookOpen, Zap, MessageSquare, Plus } from 'lucide-react';

const CATEGORIES = [
  { value: 'COURSE_IMPROVEMENT', label: 'Course Improvement', icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  { value: 'NEW_COURSE', label: 'Suggest New Course', icon: Plus, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  { value: 'SKILL_GAP', label: 'Skill Gap Noticed', icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  { value: 'OTHER', label: 'Other Feedback', icon: MessageSquare, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PENDING: { label: 'Pending Review', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  REVIEWED: { label: 'Reviewed', icon: CheckCircle, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  ACTIONED: { label: 'Action Taken', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  REJECTED: { label: 'Not Actioned', icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
};

interface Suggestion {
  id: number;
  category: string;
  title: string;
  description: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

export default function EmployerSuggestions() {
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
  });

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const res = await getMySuggestions();
      setMySuggestions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  const handleSubmit = async () => {
    if (!form.category || !form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await submitSuggestion(form);
      setSuccessMsg('Your suggestion has been sent to the government admin!');
      setForm({ category: '', title: '', description: '' });
      setShowForm(false);
      await loadSuggestions();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            Suggestions to Government
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Share course improvement ideas, skill gap insights, or new course suggestions with the government admin.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Suggestion
        </button>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Suggestion Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Submit a Suggestion</h3>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2.5">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const selected = form.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all ${selected ? cat.color + ' ring-2 ring-offset-1 ring-current' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
            <input
              type="text"
              placeholder="Brief title for your suggestion..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea
              placeholder="Describe your suggestion in detail. Include any observations from industry, candidate interviews, or skill gaps you've noticed..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={5}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.category || !form.title.trim() || !form.description.trim()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm({ category: '', title: '', description: '' }); }}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* My Suggestions List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">My Submitted Suggestions</h3>
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : mySuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-gray-500">
            <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
            <p className="font-medium text-sm">No suggestions yet</p>
            <p className="text-xs mt-1">Click "New Suggestion" to share your insights with the government.</p>
          </div>
        ) : (
          mySuggestions.map(s => {
            const statusConf = STATUS_CONFIG[s.status] || STATUS_CONFIG['PENDING'];
            const StatusIcon = statusConf.icon;
            const catConf = CATEGORIES.find(c => c.value === s.category);
            const CatIcon = catConf?.icon || MessageSquare;
            return (
              <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CatIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s.title}</h4>
                      <div className="text-[11px] text-gray-400 mt-0.5">{catConf?.label || s.category} • {formatDate(s.created_at)}</div>
                    </div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold flex-shrink-0 ${statusConf.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConf.label}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{s.description}</p>

                {s.admin_response && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                    <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Government Response {s.responded_at ? `• ${formatDate(s.responded_at)}` : ''}
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">{s.admin_response}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
