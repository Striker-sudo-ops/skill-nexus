import { useState, useEffect } from 'react';
import { getJobById, getSkillGap } from '../../services/api';
import { Button, Spinner, Badge, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function JobDetail({ jobId, onNavigate }: { jobId: number, onNavigate: (page: string, params?: any) => void }) {
  const { isLoggedIn, isStudent } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [gap, setGap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      getJobById(jobId.toString()),
      isLoggedIn && isStudent ? getSkillGap(jobId.toString()).catch(()=>({data:null})) : Promise.resolve({data:null})
    ]).then(([jobRes, gapRes]) => {
      setJob(jobRes.data);
      if(gapRes.data) setGap(gapRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [jobId, isLoggedIn, isStudent]);

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (!job) return <div className="p-12 text-center">Job not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Button variant="ghost" onClick={() => onNavigate('student/jobs')} className="mb-4">&larr; Back to Jobs</Button>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{job.title}</h1>
        <p className="text-lg text-gray-600 mb-6">{job.company_name} &bull; {job.city}, {job.state} &bull; Posted {new Date(job.created_at).toLocaleDateString()}</p>
        
        <div className="flex gap-3 mb-8">
          <Badge color="blue">{job.job_type}</Badge>
          <Badge color="green">₹{(job.salary_min/100000).toFixed(1)} - {(job.salary_max/100000).toFixed(1)} LPA</Badge>
          <Badge color="gray">{job.openings_count} Openings</Badge>
        </div>

        <div className="prose max-w-none text-gray-700 whitespace-pre-line mb-8">
          {job.description}
        </div>

        <Button className="px-8 py-3 bg-indigo-600" onClick={() => window.open(`mailto:hr@example.com?subject=Application for ${job.title}`)}>Apply Now</Button>
      </div>

      {gap && (
        <Card className="p-6 border-2 border-indigo-100">
          <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
            Skill Match Analysis
            <Badge color={gap.match_percentage >= 70 ? 'green' : 'orange'}>{Math.round(gap.match_percentage)}% Match</Badge>
          </h2>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Skills you have</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {gap.matched_skills?.map((s:any) => <Badge key={s.id} color="green">{s.name}</Badge>)}
              {!gap.matched_skills?.length && <span className="text-sm text-gray-500">None</span>}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>Skills to acquire</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {gap.missing_skills?.map((s:any) => (
                <div key={s.id} className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full text-sm font-medium border border-red-200">
                  {s.name}
                  <button onClick={() => onNavigate('student/skill-detail', { skillId: s.id })} className="text-xs bg-red-600 text-white px-2 py-0.5 rounded hover:bg-red-700">Learn &rarr;</button>
                </div>
              ))}
              {!gap.missing_skills?.length && <span className="text-sm text-gray-500">None</span>}
            </div>
          </div>
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
