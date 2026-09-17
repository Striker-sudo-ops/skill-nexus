import { useState, useEffect } from 'react';
import { getSavedJobs, unsaveJob } from '../../services/api';
import { Button, Card, Spinner } from '../../components/ui';
import { Bookmark, MapPin, ArrowUpRight, Trash2, Briefcase } from 'lucide-react';

interface SavedJobsProps {
  onNavigate: (page: string, params?: any) => void;
}

export default function SavedJobs({ onNavigate }: SavedJobsProps) {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const res = await getSavedJobs();
      setSavedJobs(res.data || []);
    } catch (err) {
      console.error('Error fetching saved jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (jobId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await unsaveJob(jobId);
      setSavedJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err) {
      console.error('Error unsaving job:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Saved Jobs</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                {savedJobs.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Keep track of roles you want to apply to or follow up on
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('student/jobs')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <span>Explore More Jobs</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : savedJobs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-3">
          <Bookmark className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <h3 className="font-bold text-base text-gray-800 dark:text-gray-200">No saved jobs yet</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            When browsing industry openings, click the bookmark icon on any job card to save it here for quick access.
          </p>
          <button
            onClick={() => onNavigate('student/jobs')}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            Browse Job Discovery
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((item: any) => {
            const j = item.job || item;
            const jobId = j.id || item.id;
            const title = j.title || 'Technical Specialist';
            const company = j.company_name || 'Skill Nexus Partner';
            const locationStr = `${j.city || 'India'}${j.state ? `, ${j.state}` : ''}`;
            const jobType = j.job_type || 'Full-Time';
            const salaryMin = j.salary_min;
            const salaryMax = j.salary_max;
            const skills = item.required_skills || j.skills || [];
            const experienceYears = j.experience_years;
            const source = item.source || j.source;

            return (
              <Card key={jobId} className="p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-3 dark:bg-gray-800">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1">{title}</h3>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-0.5">{company}</p>
                    </div>

                    <button
                      onClick={(e) => handleUnsave(jobId, e)}
                      title="Remove from saved"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {locationStr}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">
                      {jobType}
                    </span>
                    {experienceYears !== undefined && experienceYears !== null && (
                      <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">
                        {experienceYears === 0 ? 'Fresher' : `${experienceYears}+ yrs exp`}
                      </span>
                    )}
                    {source && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        via {source.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {salaryMin && (
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded inline-block border border-emerald-200/50">
                      ₹{(salaryMin / 100000).toFixed(1)} - {(salaryMax / 100000).toFixed(1)} LPA
                    </div>
                  )}

                  {/* Skills tags */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {skills.slice(0, 4).map((s: any, idx: number) => (
                        <span key={idx} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-medium border border-blue-100 dark:border-blue-800">
                          {s.name || s}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="text-[10px] text-gray-400 self-center">
                          +{skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onNavigate('student/job-detail', { jobId })}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>View Details</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  {j.apply_url && (
                    <a
                      href={j.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>Apply ↗</span>
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
