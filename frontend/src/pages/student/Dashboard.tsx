import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getStudentProfile, getRecommendedJobs, getTrendingSkills, getLastSync } from '../../services/api';
import { Card, Badge, Button, Spinner } from '../../components/ui';
import { MapPin, Briefcase, TrendingUp, IndianRupee, BookOpen, FileText, ArrowUpRight, Sparkles } from 'lucide-react';

export default function Dashboard({ navigate }: { navigate: (p: string, params?: any) => void }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncInfo, setLastSyncInfo] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      getStudentProfile().catch(() => ({ data: {} })),
      getRecommendedJobs().catch(() => ({ data: [] })),
      getTrendingSkills({ limit: 6 }).catch(() => ({ data: [] })),
      getLastSync().catch(() => ({ data: null }))
    ]).then(([profRes, jobsRes, _trendRes, syncRes]) => {
      setProfile(profRes.data);
      setJobs(jobsRes.data || []);
      setLastSyncInfo(syncRes?.data || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>;
  }

  const stuData = profile?.profile || profile || {};
  const completion = [
    stuData.full_name,
    stuData.phone,
    profile?.education?.length,
    profile?.skills?.length,
    profile?.completed_courses?.length
  ].filter(Boolean).length * 20;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-lg border border-blue-600/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Student Career & Skill Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
            Hello, {user?.full_name || 'Student'}!
          </h1>
          <p className="text-blue-100/80 text-xs sm:text-sm leading-relaxed">
            Welcome to your technical career hub. Explore AI-aligned openings, verify in-demand competencies, and accelerate your placement journey.
          </p>
        </div>

        <div className="w-full sm:w-64 relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
          <div className="flex justify-between text-xs font-semibold mb-1.5 text-white">
            <span className="text-blue-200">Profile Strength:</span>
            <span className="text-white font-bold">{completion}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all rounded-full shadow-xs" style={{ width: `${completion}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-blue-200">
            <span>{completion < 100 ? 'Complete for top matches' : 'Profile fully optimized!'}</span>
            {completion < 100 && (
              <button 
                onClick={() => navigate('student/profile')}
                className="font-bold text-white underline hover:text-blue-200 cursor-pointer ml-1"
              >
                Complete &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow accents */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'My Profile', desc: 'Personal, education & skills', icon: <Briefcase className="w-5 h-5"/>, action: () => navigate('student/profile') },
          { label: 'Govt Courses', desc: 'AI aligned technical curricula', icon: <BookOpen className="w-5 h-5"/>, action: () => navigate('student/courses') },
          { label: 'Browse Jobs', desc: 'Verified industry openings', icon: <MapPin className="w-5 h-5"/>, action: () => navigate('student/jobs') },
          { label: 'Resume Builder', desc: 'IEEE LaTeX standard format', icon: <FileText className="w-5 h-5"/>, action: () => navigate('student/resume') },
        ].map((btn, i) => (
          <button 
            key={i} 
            onClick={btn.action} 
            className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-start text-left group cursor-pointer"
          >
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors mb-2">
              {btn.icon}
            </div>
            <span className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{btn.label}</span>
            <span className="text-[11px] text-gray-400 mt-0.5">{btn.desc}</span>
          </button>
        ))}
      </div>

      {/* Recommended Jobs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-gray-900">Recommended jobs to you</h2>
              {lastSyncInfo && !lastSyncInfo.never_synced && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced {lastSyncInfo.hours_ago === 0 ? 'just now' : `${lastSyncInfo.hours_ago}h ago`}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Matched based on your verified skills, education, and completed coursework</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('student/recommended-jobs')} className="text-xs font-semibold">
            View Suggested Jobs &rarr;
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((item: any) => {
            const j = item.job || item;
            const title = j.title || 'Technical Specialist';
            const company = j.company_name || 'Industry Partner';
            const city = j.city || 'India';
            const state = j.state || '';
            const matchPct = item.skill_match_pct ?? j.skill_match_pct;
            const salaryMin = j.salary_min;
            const salaryMax = j.salary_max;
            const jobType = j.job_type || 'FULL_TIME';
            const jobId = j.id || item.id;

            return (
              <Card key={jobId} className="p-5 border border-gray-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 leading-snug line-clamp-1">{title}</h3>
                      <p className="text-xs font-medium text-gray-600 mt-0.5">{company}</p>
                    </div>
                    {matchPct !== undefined && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        matchPct >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        matchPct >= 40 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {Math.round(matchPct)}% Match
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {city}{state ? `, ${state}` : ''}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                      {jobType}
                    </span>
                  </div>

                  {salaryMin && (
                    <div className="text-xs font-semibold text-emerald-800 bg-emerald-50/70 px-2 py-1 rounded">
                      ₹{(salaryMin / 100000).toFixed(1)} - {(salaryMax / 100000).toFixed(1)} LPA
                    </div>
                  )}

                  {/* Required skills chips with match indicator */}
                  {item.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.required_skills.slice(0, 4).map((sk: any, sIdx: number) => {
                        const skillName = sk.name || sk;
                        const isMatched = sk.matched || (item.matched_skills && item.matched_skills.includes(skillName)) || (profile?.skills || []).some((s: any) => (s.name || '').toLowerCase() === skillName.toLowerCase());
                        return (
                          <span
                            key={sIdx}
                            className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              isMatched
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                                : 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            <span>{skillName}</span>
                          </span>
                        );
                      })}
                      {item.required_skills.length > 4 && (
                        <span className="text-[10px] text-gray-400 self-center pl-0.5">
                          +{item.required_skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate('student/job-detail', { jobId })}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Details & Apply</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Card>
            );
          })}

          {jobs.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-white border border-gray-200 rounded-2xl p-6 space-y-2">
              <Sparkles className="w-8 h-8 text-blue-600 mx-auto" />
              <div className="font-bold text-sm text-gray-900">No matching jobs found yet</div>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Update your verified skills or complete government courses in your profile to trigger AI job recommendations!
              </p>
              <Button onClick={() => navigate('student/profile')} className="mt-2 text-xs">
                Update Profile & Skills
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
