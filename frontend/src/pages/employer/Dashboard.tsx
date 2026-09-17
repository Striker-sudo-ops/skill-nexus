import { useState, useEffect } from 'react';
import { getEmployerProfile, getEmployerJobs } from '../../services/api';
import { Button, Spinner, Card, Badge } from '../../components/ui';

export default function EmployerDashboard({ navigate }: { navigate: (page: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getEmployerProfile().catch(() => ({data:{}})),
      getEmployerJobs().catch(() => ({data:[]}))
    ]).then(([p, j]) => {
      setProfile(p.data);
      setJobs(j.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

  const totalOpenings = jobs.reduce((sum, j) => sum + (j.openings_count || 0), 0);
  const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-lg border border-blue-600/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3 border border-white/10">
            <span>Employer Talent Hub &bull; Industry Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Welcome, {profile?.company_name || 'Employer Partner'}!
          </h1>
          <p className="text-blue-100/80 text-xs sm:text-sm leading-relaxed">
            Manage your verified job postings, search industry-trained candidates, and coordinate with regional training institutes.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => navigate('employer/profile')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-md transition-colors border border-white/15 cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            onClick={() => navigate('employer/jobs')}
            className="px-4 py-2 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Post New Job
          </button>
        </div>

        {/* Decorative background glow accents */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-gray-500 mb-2">Total Active Jobs</div>
          <div className="text-3xl font-bold">{activeJobs}</div>
        </Card>
        <Card className="p-6">
          <div className="text-gray-500 mb-2">Total Openings</div>
          <div className="text-3xl font-bold">{totalOpenings}</div>
        </Card>
        <Card className="p-6">
          <div className="text-gray-500 mb-2">Industry</div>
          <div className="text-xl font-bold">{profile.industry || 'Not set'}</div>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Job Postings</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 font-medium text-gray-500">Title</th>
                <th className="p-4 font-medium text-gray-500">City</th>
                <th className="p-4 font-medium text-gray-500">Openings</th>
                <th className="p-4 font-medium text-gray-500">Status</th>
                <th className="p-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.slice(0, 5).map(job => (
                <tr key={job.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{job.title}</td>
                  <td className="p-4 text-gray-600">{job.city}</td>
                  <td className="p-4 text-gray-600">{job.openings_count}</td>
                  <td className="p-4">
                    <Badge color={job.status === 'ACTIVE' ? 'green' : 'gray'}>{job.status}</Badge>
                  </td>
                  <td className="p-4">
                    <Button variant="ghost" onClick={() => navigate('employer/jobs')}>Edit</Button>
                  </td>
                </tr>
              ))}
              {!jobs.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No job postings yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
