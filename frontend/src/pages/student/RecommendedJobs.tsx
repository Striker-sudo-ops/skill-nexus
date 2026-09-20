import { useState, useEffect } from 'react';
import { getRecommendedJobs, getStudentProfile, getSavedJobIds, saveJob, unsaveJob } from '../../services/api';
import { Card, Spinner } from '../../components/ui';
import { 
  Sparkles, MapPin, Briefcase, IndianRupee, ArrowUpRight, 
  CheckCircle2, AlertCircle, Compass, RefreshCw, UserCheck, Bookmark
} from 'lucide-react';

export default function RecommendedJobs({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [jobsRes, profRes, savedRes] = await Promise.all([
        getRecommendedJobs().catch(() => ({ data: [] })),
        getStudentProfile().catch(() => ({ data: {} })),
        getSavedJobIds().catch(() => ({ data: [] }))
      ]);
      setJobs(jobsRes.data || []);
      setProfile(profRes.data);
      if (Array.isArray(savedRes?.data)) {
        setSavedIds(savedRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const studentSkills = profile?.skills || [];
  const studentLocations = profile?.locations || [];
  const primaryLoc = studentLocations.find((l: any) => l.is_primary) || studentLocations[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-7 rounded-2xl shadow-lg border border-blue-600/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-2 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            AI Career Matcher &bull; Personalized Feed
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Recommended Jobs for You
          </h1>
          <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            AI-matched job openings curated dynamically using your verified technical skills, qualifications, and preferred work locations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Re-calculate Matches'}</span>
          </button>
        </div>
      </div>

      {/* Criteria Info Strip */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-medium">Active Skills:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {studentSkills.length > 0 ? `${studentSkills.length} Verified Skills` : 'No skills added yet'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium">Matching Location:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {primaryLoc ? `${primaryLoc.city}, ${primaryLoc.state}` : 'Pan-India (Preferred location not set)'}
            </span>
          </div>
        </div>

        {studentSkills.length === 0 && (
          <button
            onClick={() => onNavigate('student/profile')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
          >
            <span>Update profile to boost matching</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Recommended Jobs Grid */}
      {jobs.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">No Direct Matches Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Add your technical skills and preferred job locations in your profile to allow the AI recommendation engine to match you with top industry openings.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('student/profile')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Update Profile &amp; Skills
            </button>
            <button
              onClick={() => onNavigate('student/jobs')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Browse All Jobs
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((item: any) => {
            const j = item.job || item;
            const title = j.title || 'Technical Specialist';
            const company = j.company_name || 'Skill Nexus Partner';
            const city = j.city || 'India';
            const state = j.state || '';
            const matchPct = item.skill_match_pct ?? j.skill_match_pct;
            const salaryMin = j.salary_min;
            const salaryMax = j.salary_max;
            const jobType = j.job_type || 'FULL_TIME';
            const jobId = j.id || item.id;
            const reqSkills = item.required_skills || [];
            const distance = item.distance_km;

            return (
              <Card
                key={jobId}
                className="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between space-y-4 rounded-xl shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  {/* Job Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug truncate" title={title}>
                        {title}
                      </h3>
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                        {company}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {matchPct !== undefined && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                            matchPct >= 70
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : matchPct >= 40
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {Math.round(matchPct)}% Match
                        </span>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const isSaved = savedIds.includes(jobId);
                          if (isSaved) {
                            await unsaveJob(jobId).catch(() => {});
                            setSavedIds(prev => prev.filter(id => id !== jobId));
                          } else {
                            await saveJob(jobId).catch(() => {});
                            setSavedIds(prev => [...prev, jobId]);
                          }
                        }}
                        title={savedIds.includes(jobId) ? 'Remove from saved' : 'Save job'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          savedIds.includes(jobId)
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                            : 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                        }`}
                      >
                        <Bookmark className={`w-4 h-4 ${savedIds.includes(jobId) ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Chips: Location, Proximity, Job Type */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{city}{state ? `, ${state}` : ''}</span>
                    </span>

                    {distance !== undefined && distance > 0 && (
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded">
                        {Math.round(distance)} km away
                      </span>
                    )}

                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">
                      {jobType.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Salary */}
                  {salaryMin && (
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-900 dark:text-white pt-1">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        ₹{(salaryMin / 100000).toFixed(1)} - {(salaryMax / 100000).toFixed(1)} LPA
                      </span>
                    </div>
                  )}

                  {/* Required / Matched Skills */}
                  {reqSkills.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
                        Matching Skill Profile
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {reqSkills.slice(0, 4).map((s: any, idx: number) => {
                          const skillName = s.name || s;
                          const hasSkill = s.matched || (item.matched_skills && item.matched_skills.includes(skillName)) || studentSkills.some((sk: any) =>
                            (sk.name || '').toLowerCase() === skillName.toLowerCase()
                          );
                          return (
                            <span
                              key={idx}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${
                                hasSkill
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              {skillName}
                            </span>
                          );
                        })}
                        {reqSkills.length > 4 && (
                          <span className="text-[10px] text-gray-400 self-center pl-1">
                            +{reqSkills.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply / Detail Button */}
                <button
                  onClick={() => onNavigate('student/job-detail', { jobId })}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <span>View Job Details &amp; Apply</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
