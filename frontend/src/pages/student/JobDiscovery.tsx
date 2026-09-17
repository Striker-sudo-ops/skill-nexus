import { useState, useEffect } from 'react';
import { getJobs, getJobCount } from '../../services/api';
import { Button, Input, Select, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { Search, MapPin, Briefcase, IndianRupee, ArrowUpRight, Filter, X, Sparkles } from 'lucide-react';

interface JobDiscoveryProps {
  onNavigate: (page: string, params?: any) => void;
  currentParams?: any;
}

export default function JobDiscovery({ onNavigate, currentParams }: JobDiscoveryProps) {
  const { isLoggedIn } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  
  const [q, setQ] = useState(currentParams?.skill || currentParams?.q || '');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [experience, setExperience] = useState('');
  const [salaryRange, setSalaryRange] = useState('');

  // If incoming skill changes via navigation
  useEffect(() => {
    if (currentParams?.skill) {
      setQ(currentParams.skill);
    }
  }, [currentParams?.skill]);

  useEffect(() => {
    fetchJobs(1);
    getJobCount().then(res => setTotalCount(res.data?.total_india || res.data?.count || 0)).catch(() => {});
  }, [type, city, sector, experience, salaryRange]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchJobs(1), 400);
    return () => clearTimeout(timeout);
  }, [q]);

  const parseFilters = () => {
    let experience_min: number | undefined = undefined;
    let experience_max: number | undefined = undefined;
    if (experience === '0-1') { experience_min = 0; experience_max = 1; }
    else if (experience === '2-4') { experience_min = 2; experience_max = 4; }
    else if (experience === '5+') { experience_min = 5; }

    let salary_min: number | undefined = undefined;
    let salary_max: number | undefined = undefined;
    if (salaryRange === '3-6') { salary_min = 300000; salary_max = 600000; }
    else if (salaryRange === '6-10') { salary_min = 600000; salary_max = 1000000; }
    else if (salaryRange === '10-15') { salary_min = 1000000; salary_max = 1500000; }
    else if (salaryRange === '15+') { salary_min = 1500000; }

    return { experience_min, experience_max, salary_min, salary_max };
  };

  const fetchJobs = async (pageNum: number) => {
    setLoading(true);
    try {
      const { experience_min, experience_max, salary_min, salary_max } = parseFilters();
      const res = await getJobs({
        q,
        job_type: type || undefined,
        city: city || undefined,
        sector: sector || undefined,
        experience_min,
        experience_max,
        salary_min,
        salary_max,
        page: pageNum,
        per_page: 20
      });
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

  const handleResetFilters = () => {
    setQ('');
    setType('');
    setCity('');
    setSector('');
    setExperience('');
    setSalaryRange('');
  };

  const hasActiveFilters = Boolean(q || type || city || sector || experience || salaryRange);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search & Filter Header Card */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Explore Industry Openings & Roles</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Live roles from Maharashtra industrial clusters and technical employers</p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        {/* Pre-filtered skill notification banner */}
        {currentParams?.skill && q === currentParams.skill && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Showing openings requiring skill: <strong>{currentParams.skill}</strong>
            </span>
            <button 
              onClick={() => setQ('')}
              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer ml-2"
            >
              Clear
            </button>
          </div>
        )}

        {/* Primary Row: Keyword Search, Job Type, City */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input 
            placeholder="Search role, skills, company..." 
            value={q} 
            onChange={(e: any) => setQ(e.target.value)} 
          />
          <Select 
            value={type} 
            onChange={(e: any) => setType(e.target.value)} 
            options={[
              { label: 'All Job Types', value: '' },
              { label: 'Full-Time', value: 'Full-Time' },
              { label: 'Full-Time (Remote)', value: 'Full-Time (Remote)' },
              { label: 'Internship', value: 'INTERNSHIP' },
              { label: 'Part Time', value: 'PART_TIME' }
            ]} 
          />
          <Input 
            placeholder="Filter city (e.g. Pune, Mumbai)..." 
            value={city} 
            onChange={(e: any) => setCity(e.target.value)} 
          />
        </div>

        {/* Secondary Filter Row: Sector, Experience, Salary Range */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-gray-100 dark:border-gray-700/60">
          <Select 
            value={sector} 
            onChange={(e: any) => setSector(e.target.value)} 
            options={[
              { label: 'All Sectors', value: '' },
              { label: 'IT & Software', value: 'IT' },
              { label: 'Automotive & EV', value: 'Automotive' },
              { label: 'Manufacturing & Heavy Eng.', value: 'Manufacturing' },
              { label: 'Healthcare & Biotech', value: 'Healthcare' },
              { label: 'Renewable Energy', value: 'Renewable' },
              { label: 'BFSI & FinTech', value: 'BFSI' }
            ]} 
          />
          <Select 
            value={experience} 
            onChange={(e: any) => setExperience(e.target.value)} 
            options={[
              { label: 'All Experience Levels', value: '' },
              { label: 'Entry Level (0 - 1 years)', value: '0-1' },
              { label: 'Mid Level (2 - 4 years)', value: '2-4' },
              { label: 'Senior (5+ years)', value: '5+' }
            ]} 
          />
          <Select 
            value={salaryRange} 
            onChange={(e: any) => setSalaryRange(e.target.value)} 
            options={[
              { label: 'All Salary Ranges', value: '' },
              { label: '₹3L - ₹6L LPA', value: '3-6' },
              { label: '₹6L - ₹10L LPA', value: '6-10' },
              { label: '₹10L - ₹15L LPA', value: '10-15' },
              { label: '₹15L+ LPA', value: '15+' }
            ]} 
          />
        </div>
      </div>
      
      {/* Live Count Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium px-1">
        <span>Showing {jobs.length} active opportunities {city ? `in ${city}` : ''} {sector ? `(${sector})` : ''}</span>
        {totalCount > 0 && <span>({totalCount} total positions tracked across India)</span>}
      </div>

      {loading && page === 1 ? (
        <div className="flex justify-center py-20"><Spinner className="w-8 h-8" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-2">
          <Briefcase className="w-8 h-8 text-gray-400 mx-auto" />
          {hasActiveFilters ? (
            <>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">No jobs matched your filter criteria</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Try adjusting your keyword, sector, experience, or city filters.</p>
              <button
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 cursor-pointer"
              >
                Clear all filters
              </button>
            </>
          ) : (
            <>
              <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">No live job listings yet</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ask an admin to click <strong>Sync Live Data</strong> to fetch real job postings from industry portals.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((item: any) => {
            const j = item.job || item;
            const jobId = j.id || item.id;
            const title = j.title || 'Technical Specialist';
            const company = j.company_name || 'Skill Nexus Partner';
            const locationStr = `${j.city || 'India'}${j.state ? `, ${j.state}` : ''}`;
            const jobType = j.job_type || 'Full-Time';
            const salaryMin = j.salary_min;
            const salaryMax = j.salary_max;
            const matchPct = item.skill_match_pct ?? j.skill_match_pct;
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
