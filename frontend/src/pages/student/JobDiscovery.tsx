import { useState, useEffect } from 'react';
import { getJobs, getJobCount } from '../../services/api';
import { Button, Input, Select, Spinner, Badge, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { Search, MapPin, Briefcase, IndianRupee, ArrowUpRight } from 'lucide-react';

export default function JobDiscovery({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const { isLoggedIn } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  
  useEffect(() => {
    fetchJobs(1);
    getJobCount().then(res => setTotalCount(res.data?.total_india || res.data?.count || 0)).catch(() => {});
  }, [type, city]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchJobs(1), 400);
    return () => clearTimeout(timeout);
  }, [q]);

  const fetchJobs = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await getJobs({ q, job_type: type, city, page: pageNum, per_page: 20 });
      const rawData = res.data || [];
      if (pageNum === 1) setJobs(rawData);
      else setJobs(prev => [...prev, ...rawData]);
      setPage(pageNum);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <Search className="w-5 h-5 text-blue-600" />
          <h1 className="text-lg font-bold text-gray-900">Explore Industry Openings & Roles</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input 
            placeholder="Search by role, skills, keywords..." 
            value={q} 
            onChange={(e: any) => setQ(e.target.value)} 
          />
          <Select 
            value={type} 
            onChange={(e: any) => setType(e.target.value)} 
            options={[
              { label: 'All Job Types', value: '' },
              { label: 'Full Time', value: 'FULL_TIME' },
              { label: 'Internship', value: 'INTERNSHIP' },
              { label: 'Part Time', value: 'PART_TIME' }
            ]} 
          />
          <Input 
            placeholder="City (e.g. Pune, Bengaluru)..." 
            value={city} 
            onChange={(e: any) => setCity(e.target.value)} 
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-1">
        <span>Showing {jobs.length} active opportunities {city ? `in ${city}` : ''}</span>
        {totalCount > 0 && <span>({totalCount} total openings across India)</span>}
      </div>

      {loading && page === 1 ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl p-6 space-y-2">
          <Briefcase className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="font-bold text-sm text-gray-800">No jobs matched your query</h3>
          <p className="text-xs text-gray-500">Try adjusting your keyword, job type or city filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((item: any) => {
            const j = item.job || item;
            const jobId = j.id || item.id;
            const title = j.title || 'Technical Specialist';
            const company = j.company_name || 'Skill Nexus Partner';
            const locationStr = `${j.city || 'India'}${j.state ? `, ${j.state}` : ''}`;
            const jobType = j.job_type || 'FULL_TIME';
            const salaryMin = j.salary_min;
            const salaryMax = j.salary_max;
            const matchPct = item.skill_match_pct ?? j.skill_match_pct;
            const skills = item.required_skills || j.skills || [];

            return (
              <Card key={jobId} className="p-5 border border-gray-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 line-clamp-1">{title}</h3>
                      <p className="text-xs font-semibold text-gray-600 mt-0.5">{company}</p>
                    </div>

                    {matchPct !== undefined && isLoggedIn && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        matchPct >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        matchPct >= 40 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {Math.round(matchPct)}% Match
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {locationStr}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium">
                      {jobType}
                    </span>
                    {j.openings_count && (
                      <span className="text-gray-400 text-[11px]">
                        &bull; {j.openings_count} openings
                      </span>
                    )}
                  </div>

                  {salaryMin && (
                    <div className="text-xs font-semibold text-emerald-800 bg-emerald-50/60 px-2 py-1 rounded inline-block">
                      ₹{(salaryMin / 100000).toFixed(1)} - {(salaryMax / 100000).toFixed(1)} LPA
                    </div>
                  )}

                  {/* Skills tags */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {skills.slice(0, 4).map((s: any, idx: number) => (
                        <span key={idx} className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-100">
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

                <button
                  onClick={() => onNavigate('student/job-detail', { jobId })}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>View Details & Apply</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="secondary" onClick={() => fetchJobs(page + 1)}>
            Load More Opportunities
          </Button>
        </div>
      )}
    </div>
  );
}
