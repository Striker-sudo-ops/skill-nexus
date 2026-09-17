import { useState, useEffect } from 'react';
import { getJobById, getSkillGap, getJobSkillGap, getWhyRecommended, getSavedJobIds, saveJob, unsaveJob } from '../../services/api';
import { Button, Spinner, Badge, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle2, XCircle, ExternalLink, Bookmark, Sparkles, BookOpen, ArrowUpRight } from 'lucide-react';

function renderFormattedDescription(desc: string) {
  if (!desc) return null;

  const hasHtml = /<[a-z][\s\S]*>/i.test(desc);

  if (hasHtml) {
    const cleanHtml = desc
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    return (
      <div
        className="text-gray-700 text-sm leading-relaxed space-y-3 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>li]:mb-1 [&>h2]:text-base [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-4 [&>h2]:mb-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-gray-900 [&>h3]:mt-3 [&>h3]:mb-1.5 [&>h4]:text-sm [&>h4]:font-bold [&>h4]:text-gray-900 [&>h4]:mt-3 [&>h4]:mb-1.5 [&>strong]:font-semibold [&>strong]:text-gray-900 [&>b]:font-semibold [&>b]:text-gray-900 [&>a]:text-blue-600 [&>a]:underline"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  return (
    <div className="text-gray-700 text-sm leading-relaxed space-y-3 whitespace-pre-line">
      {desc}
    </div>
  );
}

export default function JobDetail({ jobId, onNavigate }: { jobId: number, onNavigate: (page: string, params?: any) => void }) {
  const { isLoggedIn, isStudent } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [gap, setGap] = useState<any>(null);
  const [whyRec, setWhyRec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      getJobById(jobId.toString()),
      isLoggedIn && isStudent ? getJobSkillGap(jobId.toString()).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      isLoggedIn && isStudent ? getWhyRecommended(jobId.toString()).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      isLoggedIn ? getSavedJobIds().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ]).then(([jobRes, gapRes, whyRes, savedRes]) => {
      // API returns { job: {...}, employer: {...}, company_name: "...", apply_url: "...", required_skills: [...], resources: [...] }
      const raw = jobRes.data;
      const jobObj = raw?.job || raw;
      const empObj = raw?.employer;
      setJob({
        ...jobObj,
        company_name: raw?.company_name || jobObj?.company_name || empObj?.company_name || 'Industry Partner',
        apply_url: raw?.apply_url || jobObj?.apply_url,
        required_skills: raw?.required_skills || [],
        resources: raw?.resources || [],
      });
      if (gapRes?.data) setGap(gapRes.data);
      if (whyRes?.data) setWhyRec(whyRes.data);
      if (Array.isArray(savedRes?.data)) {
        setIsSaved(savedRes.data.includes(Number(jobId)));
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [jobId, isLoggedIn, isStudent]);

  const handleToggleSave = async () => {
    if (!isLoggedIn) {
      alert('Please log in to bookmark this position.');
      return;
    }
    try {
      if (isSaved) {
        await unsaveJob(jobId);
        setIsSaved(false);
      } else {
        await saveJob(jobId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving job:', err);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (!job) return <div className="p-12 text-center">Job not found</div>;

  const postedDate = job.created_at ? new Date(job.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Button variant="ghost" onClick={() => onNavigate('student/jobs')} className="mb-4">&larr; Back to Jobs</Button>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{job.title}</h1>
        <p className="text-lg text-gray-600 mb-6">
          {job.company_name}
          {job.city && job.state && <span> &bull; {job.city}, {job.state}</span>}
          {postedDate && <span> &bull; Posted {postedDate}</span>}
        </p>
        
        <div className="flex gap-3 mb-8 flex-wrap">
          {job.job_type && <Badge color="blue">{job.job_type}</Badge>}
          {(job.salary_min || job.salary_max) && (
            <Badge color="green">₹{((job.salary_min || 450000)/100000).toFixed(1)} - {((job.salary_max || 950000)/100000).toFixed(1)} LPA</Badge>
          )}
          {job.openings_count && <Badge color="gray">{job.openings_count} Openings</Badge>}
        </div>

        <div className="mb-8 border-t border-b border-gray-100 py-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Job Description & Responsibilities</h2>
          {renderFormattedDescription(job.description)}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button 
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-sm" 
            onClick={() => {
              if (job.apply_url) {
                window.open(job.apply_url, '_blank', 'noopener,noreferrer');
              } else {
                window.open(`mailto:careers@skillnexus.in?subject=Application for ${encodeURIComponent(job.title)}`, '_blank');
              }
            }}
          >
            <span>{job.apply_url ? 'Apply on Company Website' : 'Apply Now'}</span>
            {job.apply_url && <ExternalLink className="w-4 h-4" />}
          </Button>

          {isLoggedIn && (
            <button
              onClick={handleToggleSave}
              className={`px-5 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ${
                isSaved
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current text-blue-600' : ''}`} />
              <span>{isSaved ? 'Saved in My Jobs' : 'Save Position'}</span>
            </button>
          )}

          {job.apply_url && (
            <span className="text-xs text-gray-500">
              Opens application portal for {job.company_name}
            </span>
          )}
        </div>
      </div>

      {/* Why This Job Is Recommended */}
      {whyRec && whyRec.reasons?.length > 0 && (
        <Card className="p-6 border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Why This Position Matches You</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Algorithmic alignment with your profile competencies and regional demand</p>
            </div>
          </div>

          <ul className="space-y-2 pt-1 text-xs text-gray-700 dark:text-gray-300">
            {whyRec.reasons.map((r: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Skill Match & Gap Analysis */}
      {gap && (
        <Card className="p-6 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-6 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Skill Gap & Readiness Analysis</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Comparison of your verified skills against employer requirements</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                (gap.match_pct || gap.match_percentage) >= 70
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {gap.match_pct || Math.round(gap.match_percentage || 0)}% Match
              </span>
              {gap.readiness_pct && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {gap.readiness_pct}% Job Ready
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Matched Skills */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Skills You Possess ({gap.matched_skills?.length || 0})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {gap.matched_skills?.map((s: any) => (
                  <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {s.name}
                    {s.proficiency && <span className="text-[10px] text-emerald-600 font-normal">({s.proficiency})</span>}
                  </span>
                ))}
                {!gap.matched_skills?.length && (
                  <span className="text-xs text-gray-400 italic">No direct profile skill matches recorded yet.</span>
                )}
              </div>
            </div>
            
            {/* Missing Skills */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-amber-500" />
                <span>Skills to Acquire ({gap.missing_skills?.length || 0})</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {gap.missing_skills?.map((s: any) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 px-2.5 py-1 rounded-lg text-xs font-medium border border-amber-200 dark:border-amber-800">
                    <span>{s.name}</span>
                    <button 
                      onClick={() => onNavigate('student/skill-detail', { skillId: s.id })} 
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Learn &rarr;
                    </button>
                  </span>
                ))}
                {!gap.missing_skills?.length && (
                  <span className="text-xs text-emerald-600 font-medium">You possess 100% of the required skills!</span>
                )}
              </div>
            </div>
          </div>

          {/* Recommended Technical Courses to bridge gap */}
          {gap.recommended_courses?.length > 0 && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Recommended Curricula to Bridge This Skill Gap
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {gap.recommended_courses.map((c: any) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-750 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                        {c.course_code || 'COURSE'}
                      </span>
                      <h5 className="font-bold text-xs text-gray-900 dark:text-white mt-1.5 line-clamp-1">{c.title}</h5>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{c.domain} &bull; {c.duration_weeks} weeks</p>
                    </div>

                    <button
                      onClick={() => onNavigate('student/courses')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1 cursor-pointer"
                    >
                      <span>View Course</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {job.required_skills?.some((s:any) => s.resources?.length > 0) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4">What you need to know</h2>
          <div className="grid gap-3">
            {job.required_skills.flatMap((s:any) => s.resources || []).filter((v:any,i:number,a:any)=>a.findIndex((t:any)=>(t.url === v.url))===i).map((r:any, i:number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="font-medium text-gray-800">{r.title}</span>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm font-bold hover:underline">Open &rarr;</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
