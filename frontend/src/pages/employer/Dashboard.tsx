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
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {profile.company_name || 'Employer'}!</h1>
          <p className="text-gray-600">Manage your job postings and company profile.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => navigate('employer/profile')}>Edit Profile</Button>
          <Button onClick={() => navigate('employer/jobs')}>Post New Job</Button>
        </div>
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
