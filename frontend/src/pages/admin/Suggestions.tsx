import { useState, useEffect } from 'react';
import { getAllSuggestions, respondToSuggestion } from '../../services/api';
import { Lightbulb, CheckCircle, Clock, XCircle, BookOpen, Plus, Zap, MessageSquare, Send, ChevronDown, ChevronUp, Filter } from 'lucide-react';

const CATEGORIES: Record<string, { label: string; icon: any; color: string }> = {
  COURSE_IMPROVEMENT: { label: 'Course Improvement', icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
  NEW_COURSE: { label: 'New Course', icon: Plus, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  SKILL_GAP: { label: 'Skill Gap', icon: Zap, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  OTHER: { label: 'Other', icon: MessageSquare, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
};

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'ACTIONED', label: 'Actioned' },
  { value: 'REJECTED', label: 'Not Actioned' },
];

interface Suggestion {
  id: number;
  employer_id: number;
  company_name: string;
  category: string;
  title: string;
  description: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

export default function AdminSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState('REVIEWED');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllSuggestions(statusFilter || undefined);
      setSuggestions(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleRespond = async (id: number) => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      await respondToSuggestion(id, { response: responseText, status: responseStatus });
      setRespondingId(null);
      setResponseText('');
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const counts = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 'PENDING').length,
    actioned: suggestions.filter(s => s.status === 'ACTIONED').length,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          Employer Suggestions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review and respond to industry feedback on courses and skill development.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Suggestions', value: counts.total, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
          { label: 'Pending Review', value: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
          { label: 'Actions Taken', value: counts.actioned, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-2xl p-4`}>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {STATUS_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border cursor-pointer transition-colors ${statusFilter === opt.value ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Loading suggestions...</div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-gray-500">
          <Lightbulb className="w-10 h-10 mb-3 opacity-40" />
          <p className="font-medium text-sm">No suggestions found</p>
          <p className="text-xs mt-1">Employers haven't submitted any suggestions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map(s => {
            const catConf = CATEGORIES[s.category] || CATEGORIES['OTHER'];
            const CatIcon = catConf.icon;
            const isExpanded = expandedId === s.id;
            const isResponding = respondingId === s.id;

            const statusColor: Record<string, string> = {
              PENDING: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
              REVIEWED: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
              ACTIONED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
              REJECTED: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            };

            return (
              <div key={s.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                {/* Card Header */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-1.5 rounded-lg border ${catConf.color} flex-shrink-0`}>
                      <CatIcon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s.title}</h3>
                          <div className="text-[11px] text-gray-400 mt-0.5">
                            {s.company_name} • {catConf.label} • {formatDate(s.created_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusColor[s.status] || statusColor['PENDING']}`}>
                            {s.status === 'PENDING' ? 'Pending' : s.status === 'REVIEWED' ? 'Reviewed' : s.status === 'ACTIONED' ? 'Actioned' : 'Not Actioned'}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-4 leading-relaxed">{s.description}</p>

                    {s.admin_response && (
                      <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Your Response {s.responded_at ? `• ${formatDate(s.responded_at)}` : ''}
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{s.admin_response}</p>
                      </div>
                    )}

                    {/* Response Form */}
                    {isResponding ? (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Action Status</label>
                          <div className="flex gap-2">
                            {['REVIEWED', 'ACTIONED', 'REJECTED'].map(st => (
                              <button
                                key={st}
                                onClick={() => setResponseStatus(st)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer transition-colors ${responseStatus === st ? (st === 'REJECTED' ? 'bg-red-600 text-white border-red-600' : st === 'ACTIONED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-blue-600 text-white border-blue-600') : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'}`}
                              >
                                {st === 'REVIEWED' ? 'Mark Reviewed' : st === 'ACTIONED' ? 'Mark Actioned' : 'Not Actioning'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          placeholder="Write your response to the employer..."
                          value={responseText}
                          onChange={e => setResponseText(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(s.id)}
                            disabled={submitting || !responseText.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {submitting ? 'Sending...' : 'Send Response'}
                          </button>
                          <button onClick={() => { setRespondingId(null); setResponseText(''); }} className="px-4 py-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRespondingId(s.id); setExpandedId(s.id); }}
                        className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {s.admin_response ? 'Update Response' : 'Respond to this Suggestion'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
