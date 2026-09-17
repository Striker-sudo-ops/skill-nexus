import { useState, useEffect } from 'react';
import { getSkills, getSkillDomains } from '../../services/api';
import { Input, Select, Spinner, Badge, Card } from '../../components/ui';
import { TrendingUp, TrendingDown, Minus, Briefcase, BarChart2, DollarSign, BookOpen } from 'lucide-react';

const TREND_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string; bar: string }> = {
  HOT:    { label: 'HOT',    color: 'text-red-700 dark:text-red-400',    icon: TrendingUp,   bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',    bar: 'bg-red-500' },
  RISING: { label: 'RISING', color: 'text-orange-700 dark:text-orange-400', icon: TrendingUp, bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800', bar: 'bg-orange-500' },
  STABLE: { label: 'STABLE', color: 'text-gray-600 dark:text-gray-400',  icon: Minus,        bg: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',  bar: 'bg-gray-400' },
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function TrendingSkills({ onNavigate }: { onNavigate: (page: string, params?: any) => void }) {
  const [skills, setSkills] = useState<any[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('demand');

  useEffect(() => {
    fetchData();
    getSkillDomains().then(res => setDomains(res.data)).catch(() => {});
  }, [domainFilter, sort]);

  const fetchData = () => {
    setLoading(true);
    getSkills({ domain: domainFilter, sort }).then(res => {
      setSkills(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const filteredSkills = skills.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()));

  // Stats summary
  const hotCount = filteredSkills.filter((s: any) => s.trend === 'HOT').length;
  const risingCount = filteredSkills.filter((s: any) => s.trend === 'RISING').length;
  const avgSalary = filteredSkills.length
    ? Math.round(filteredSkills.reduce((a: number, s: any) => a + (s.median_salary || 0), 0) / filteredSkills.length / 100000 * 10) / 10
    : 0;
  const maxDemand = Math.max(...filteredSkills.map((s: any) => s.demand_score || 0), 1);
  const maxSalary = Math.max(...filteredSkills.map((s: any) => s.median_salary || 0), 1);
  const maxOpenings = Math.max(...filteredSkills.map((s: any) => s.total_openings || s.openings || 0), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trending Skills & Market Demand</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time skill demand index, salary benchmarks, and job openings across India</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-l-red-500 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">HOT Skills</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{hotCount}</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500">Critical demand</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-orange-500 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rising Skills</div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-0.5">{risingCount}</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500">Growing fast</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Salary</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">₹{avgSalary} L</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500">Median LPA</div>
        </Card>
        <Card className="p-3 border-l-4 border-l-emerald-500 dark:bg-gray-800 dark:border-gray-700">
          <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Skills</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{filteredSkills.length}</div>
          <div className="text-[10px] text-gray-400 dark:text-gray-500">In catalogue</div>
        </Card>
      </div>

      {/* Category Pills & Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setDomainFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              domainFilter === ''
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Categories
          </button>
          {domains.map((d: string) => (
            <button
              key={d}
              onClick={() => setDomainFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                domainFilter === d
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <Select
              value={sort}
              onChange={(e: any) => setSort(e.target.value)}
              options={[
                { label: 'Sort: Market Demand', value: 'demand' },
                { label: 'Sort: Highest Growth', value: 'growth' },
                { label: 'Sort: Median Salary', value: 'salary' },
                { label: 'Sort: Openings Count', value: 'openings' }
              ]}
            />
          </div>
          <div className="w-full md:w-72">
            <Input placeholder="Search skills by name..." value={search} onChange={(e: any) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : filteredSkills.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
          {search ? (
            <p className="text-sm font-medium">No skills match your search</p>
          ) : skills.length === 0 ? (
            <>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">No skill data yet</p>
              <p className="text-xs mt-1">Ask an admin to click <strong>Sync Live Data</strong> to populate skill trends from live market feeds.</p>
            </>
          ) : (
            <p className="text-sm font-medium">No skills match your filter</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSkills.map((s: any) => {
            const trend = s.trend || 'STABLE';
            const cfg = TREND_CONFIG[trend] || TREND_CONFIG.STABLE;
            const TrendIcon = cfg.icon;
            const openings = s.total_openings || s.openings || 0;
            const jobCount = s.job_count !== undefined ? s.job_count : openings;
            return (
              <Card key={s.id} className="p-5 flex flex-col gap-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{s.name}</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{s.domain}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.color}`}>
                    <TrendIcon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                </div>

                {/* Visual metrics */}
                <div className="space-y-3">
                  {/* Demand */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Demand Score</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{s.demand_score}<span className="font-normal text-gray-400">/100</span></span>
                    </div>
                    <MiniBar value={s.demand_score} max={100} color={s.demand_score > 80 ? 'bg-red-500' : s.demand_score > 60 ? 'bg-orange-500' : 'bg-blue-500'} />
                  </div>

                  {/* Salary */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Median Salary</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">₹{(s.median_salary / 100000).toFixed(1)} LPA</span>
                    </div>
                    <MiniBar value={s.median_salary} max={maxSalary} color="bg-emerald-500" />
                  </div>

                  {/* Openings */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Active Openings</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">{openings.toLocaleString()}</span>
                    </div>
                    <MiniBar value={openings} max={maxOpenings} color="bg-blue-500" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/60">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('student/skill-detail', { skillId: s.id })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Learn
                    </button>
                    <button
                      onClick={() => onNavigate('student/quiz', { skillId: s.id })}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Take Test
                    </button>
                  </div>
                  <button
                    onClick={() => onNavigate('student/jobs', { skill: s.name })}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    Browse Jobs ({jobCount}) &rarr;
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
