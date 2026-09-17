import { useState, useEffect } from 'react';
import { getJobAlerts, createJobAlert, deleteJobAlert, getJobAlertMatches } from '../../services/api';
import { Button, Input, Select, Card, Spinner } from '../../components/ui';
import { Bell, Plus, Trash2, MapPin, Briefcase, Sparkles, X, ChevronRight, ArrowUpRight } from 'lucide-react';

interface JobAlertsProps {
  onNavigate: (page: string, params?: any) => void;
}

export default function JobAlerts({ onNavigate }: JobAlertsProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [sector, setSector] = useState('');

  // Matches preview modal
  const [activeAlertMatches, setActiveAlertMatches] = useState<any[] | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [selectedAlertTitle, setSelectedAlertTitle] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await getJobAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skills && !location && !title) {
      alert('Please specify at least a title, skill, or location for your alert.');
      return;
    }
    setCreating(true);
    try {
      await createJobAlert({
        title: title || undefined,
        skills: skills || undefined,
        location: location || undefined,
        job_type: jobType || undefined,
        sector: sector || undefined
      });
      setShowModal(false);
      setTitle('');
      setSkills('');
      setLocation('');
      setJobType('');
      setSector('');
      fetchAlerts();
    } catch (err) {
      console.error('Error creating alert:', err);
      alert('Failed to create alert.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (alertId: number) => {
    if (!window.confirm('Delete this job alert?')) return;
    try {
      await deleteJobAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleViewMatches = async (alertItem: any) => {
    setSelectedAlertTitle(alertItem.title);
    setLoadingMatches(true);
    try {
      const res = await getJobAlertMatches(alertItem.id);
      setActiveAlertMatches(res.data || []);
    } catch (err) {
      console.error('Error loading matches:', err);
    } finally {
      setLoadingMatches(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Job Intelligence Alerts</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                {alerts.length} Active
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Set custom triggers to track matching industry roles across India & Maharashtra
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Job Alert</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-3">
          <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">No active job alerts</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Create an alert for your preferred skills (e.g. Python, Machine Learning) and target cities to easily monitor matching opportunities.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Your First Alert
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((a: any) => (
            <Card key={a.id} className="p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-4 dark:bg-gray-800">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug">{a.title}</h3>
                    <span className="text-[11px] text-gray-400">Created {new Date(a.created_at).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    title="Delete alert"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Criteria Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {a.location && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {a.location}
                    </span>
                  )}
                  {a.job_type && (
                    <span className="text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                      {a.job_type}
                    </span>
                  )}
                  {a.sector && (
                    <span className="text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full border border-purple-100 dark:border-purple-800">
                      {a.sector}
                    </span>
                  )}
                </div>

                {/* Skills */}
                {a.skills && (
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-500 dark:text-gray-400 text-[11px]">Skills: </span>
                    {a.skills}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  a.matching_jobs_count > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {a.matching_jobs_count} Matching Roles
                </span>

                <button
                  onClick={() => handleViewMatches(a)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors cursor-pointer"
                >
                  <span>View Matches</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Create New Job Alert</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Alert Name / Title</label>
                <Input 
                  placeholder="e.g. Pune Python Developer, EV Calibration" 
                  value={title} 
                  onChange={(e: any) => setTitle(e.target.value)} 
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Skills (comma-separated)</label>
                <Input 
                  placeholder="e.g. Python, Machine Learning, Docker" 
                  value={skills} 
                  onChange={(e: any) => setSkills(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Location</label>
                  <Input 
                    placeholder="e.g. Pune, Mumbai, Remote" 
                    value={location} 
                    onChange={(e: any) => setLocation(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
                  <Select 
                    value={jobType} 
                    onChange={(e: any) => setJobType(e.target.value)} 
                    options={[
                      { label: 'Any Type', value: '' },
                      { label: 'Full-Time', value: 'Full-Time' },
                      { label: 'Full-Time (Remote)', value: 'Full-Time (Remote)' },
                      { label: 'Internship', value: 'INTERNSHIP' }
                    ]} 
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Industry Sector</label>
                <Select 
                  value={sector} 
                  onChange={(e: any) => setSector(e.target.value)} 
                  options={[
                    { label: 'Any Sector', value: '' },
                    { label: 'IT & Software', value: 'IT' },
                    { label: 'Automotive & EV', value: 'Automotive' },
                    { label: 'Manufacturing & Engineering', value: 'Manufacturing' },
                    { label: 'Healthcare', value: 'Healthcare' },
                    { label: 'Renewable Energy', value: 'Renewable' }
                  ]} 
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Saving...' : 'Save Alert'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Matches Preview Modal */}
      {activeAlertMatches !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-gray-200 dark:border-gray-700 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white">Matching Openings</h3>
                <p className="text-xs text-gray-500">Alert: {selectedAlertTitle}</p>
              </div>
              <button 
                onClick={() => setActiveAlertMatches(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {loadingMatches ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : activeAlertMatches.length === 0 ? (
                <p className="text-center py-8 text-xs text-gray-500">No active positions currently match this alert criteria.</p>
              ) : (
                activeAlertMatches.map((j: any) => (
                  <div key={j.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{j.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">{j.company_name} &bull; {j.city}</p>
                      {j.salary_min && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                          ₹{(j.salary_min/100000).toFixed(1)} - {(j.salary_max/100000).toFixed(1)} LPA
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setActiveAlertMatches(null);
                        onNavigate('student/job-detail', { jobId: j.id });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-xs"
                    >
                      View Role
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
