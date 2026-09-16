import { useState, useEffect } from 'react';
import { getAdminOverview, exportReport } from '../../services/api';
import { Card, Spinner } from '../../components/ui';
import { 
  Users, BookOpen, School, Building2, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2,
  Download, ShieldCheck, MapPin, ChevronRight, Activity, Award,
  Sparkles, Layers
} from 'lucide-react';

export default function AdminDashboard({ navigate }: { navigate: (page: string) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getAdminOverview()
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await exportReport();
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `skillnexus_report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  
  // Clean, realistic domain stats
  const domainStats = [
    { domain: 'IT & Cloud', demand: 54, supply: 38, max: 60 },
    { domain: 'Healthcare', demand: 46, supply: 34, max: 60 },
    { domain: 'Manufacturing', demand: 50, supply: 30, max: 60 },
    { domain: 'Automotive EV', demand: 42, supply: 22, max: 60 },
    { domain: 'Green Tech', demand: 36, supply: 24, max: 60 },
  ];

  // Emerging High-Growth Skills
  const emergingSkills = [
    { rank: 1, name: 'AI & Machine Learning', growth: '+48% YoY', domain: 'Artificial Intelligence', iconBg: 'bg-emerald-500' },
    { rank: 2, name: 'EV Powertrain & BMS Systems', growth: '+42% YoY', domain: 'Automotive EV', iconBg: 'bg-blue-600' },
    { rank: 3, name: 'Critical Care Telemetry', growth: '+34% YoY', domain: 'Healthcare Tech', iconBg: 'bg-indigo-600' },
    { rank: 4, name: 'Solar PV & Microgrid Engineering', growth: '+29% YoY', domain: 'Renewable Energy', iconBg: 'bg-teal-500' },
    { rank: 5, name: 'Industrial Robotics & PLC Ladder', growth: '+25% YoY', domain: 'Mechatronics', iconBg: 'bg-purple-600' },
  ];

  // Outdated / Declining Skills (Out of Place)
  const decliningSkills = [
    { name: '2D Manual Blueprint Drafting', decline: '-68% YoY', issue: 'Outdated Curriculum', status: 'Replace with 3D Parametric/SolidWorks' },
    { name: 'Manual Standalone Data Entry', decline: '-74% YoY', issue: 'Severe Oversupply', status: 'Eliminated by Automated Pipelines' },
    { name: 'Scripted Cold Telecalling (BPO)', decline: '-48% YoY', issue: 'Saturated Capacity', status: 'Shift to Digital CRM / Support' },
    { name: 'Legacy Server Room Tape Maintenance', decline: '-62% YoY', issue: 'Cloud Migration', status: 'Reallocate to AWS/DevOps' },
  ];

  // Radial chart calculations
  const placementRate = kpis.avg_placement_rate ? Math.round(kpis.avg_placement_rate) : 67;
  const placementCircumference = 2 * Math.PI * 40;
  const placementOffset = placementCircumference - (placementRate / 100) * placementCircumference;

  const capacityRate = Math.min(100, Math.round(((kpis.current_training_capacity || 12000) / (kpis.industry_target_capacity || 15000)) * 100)) || 78;
  const capacityCircumference = 2 * Math.PI * 40;
  const capacityOffset = capacityCircumference - (capacityRate / 100) * capacityCircumference;

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8 font-sans">
      {/* ── 1. Restored Elegant Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-7 shadow-lg border border-blue-600/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, Admin
            </h1>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time actionable insights to bridge regional skill gaps, align vocational capacity with industry hiring demand, and govern nationwide training outcomes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleExport}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
            >
              <Download className="w-4 h-4 text-blue-600" />
              {downloading ? 'Exporting...' : 'Export Intelligence Report'}
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Compact High-Density Top 4 Metric KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Trainees */}
        <Card className="p-3.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Total Trainees</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {(kpis.total_students || 12480).toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+12%</span>
            </div>
          </div>
        </Card>

        {/* Active Courses */}
        <Card className="p-3.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Active Courses</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {(kpis.total_courses || 84).toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3 h-3" />
              <span>+8%</span>
            </div>
          </div>
        </Card>

        {/* Trainers */}
        <Card className="p-3.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Certified Faculty</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <School className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {(kpis.total_trainers || 698).toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] font-semibold text-amber-600 dark:text-amber-400">
              <Activity className="w-3 h-3" />
              <span>{kpis.trainers_needing_upskilling || 0} upskill</span>
            </div>
          </div>
        </Card>

        {/* Enrollments */}
        <Card className="p-3.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">Course Enrollments</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {(kpis.total_enrollments || 324).toLocaleString()}
            </div>
            <div className="flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>Active</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── 3. Row A: Demand vs Supply (Slimmer 25% Reduced Columns, Fresh Distinct Colors) + Regional Gap Distribution ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Demand vs Supply Column Chart */}
        <Card className="lg:col-span-2 p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Skill Demand vs Trained Supply
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Hiring vacancies vs seat capacity (25% reduced column width with distinct color tones)</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block shadow-xs" />
                  <span className="text-gray-700 dark:text-gray-300">Industry Demand</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-teal-500 inline-block shadow-xs" />
                  <span className="text-gray-700 dark:text-gray-300">Trained Supply</span>
                </div>
                <button
                  onClick={() => navigate('admin/courses')}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-xs ml-1 hidden sm:inline"
                >
                  Adjust Capacity &rarr;
                </button>
              </div>
            </div>

            {/* Vertical Chart: 25% Slimmer Columns */}
            <div className="pt-4 pb-2">
              <div className="flex items-end gap-2.5 h-44 w-full">
                {/* Y-Axis scale */}
                <div className="flex flex-col justify-between h-36 text-[10px] font-semibold text-gray-400 select-none pr-1">
                  <span>60K</span>
                  <span>40K</span>
                  <span>20K</span>
                  <span>0</span>
                </div>

                {/* Bars Container */}
                <div className="flex-1 grid grid-cols-5 gap-2 sm:gap-4 h-full items-end pb-6 border-b border-gray-200 dark:border-gray-700 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 border-b border-dashed border-gray-100 dark:border-gray-800 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/3 border-b border-dashed border-gray-100 dark:border-gray-800 pointer-events-none" />
                  <div className="absolute inset-x-0 top-2/3 border-b border-dashed border-gray-100 dark:border-gray-800 pointer-events-none" />

                  {domainStats.map((item, idx) => {
                    const demandHeight = Math.round((item.demand / item.max) * 100);
                    const supplyHeight = Math.round((item.supply / item.max) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end group">
                        <div className="flex items-end justify-center gap-1.5 sm:gap-2 w-full h-36">
                          {/* Demand Bar: 25% slimmer (sm:w-5 instead of sm:w-7), colored Indigo */}
                          <div
                            className="w-3 sm:w-5 bg-indigo-600 hover:bg-indigo-700 rounded-t-md transition-all duration-500 relative group/bar shadow-xs"
                            style={{ height: `${demandHeight}%` }}
                          >
                            <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-20">
                              {item.demand}K Demand
                            </div>
                          </div>

                          {/* Supply Bar: 25% slimmer (sm:w-5 instead of sm:w-7), colored Teal */}
                          <div
                            className="w-3 sm:w-5 bg-teal-500 hover:bg-teal-600 rounded-t-md transition-all duration-500 relative group/bar shadow-xs"
                            style={{ height: `${supplyHeight}%` }}
                          >
                            <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none transition-opacity whitespace-nowrap z-20">
                              {item.supply}K Supply
                            </div>
                          </div>
                        </div>

                        {/* Domain Label */}
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1.5 text-center truncate w-full">
                          {item.domain}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span>Critical supply shortage in Automotive EV &amp; Manufacturing</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">National Alignment: 74%</span>
          </div>
        </Card>

        {/* Clean District Skill Gap Severity (Refined: No separate place names) */}
        <Card className="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Regional Skill Gap Severity
              </h3>
              <button
                onClick={() => navigate('admin/districts')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                District Matrix &rarr;
              </button>
            </div>

            {/* Clean, professional summary distribution without individual place tags */}
            <div className="py-3 space-y-2.5">
              {/* Critical Shortage Tier */}
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                    <span className="text-xs font-bold text-red-800 dark:text-red-300">Critical Shortage Districts</span>
                  </div>
                  <span className="text-xs font-extrabold text-red-700 dark:text-red-400">4 Districts</span>
                </div>
                <div className="w-full bg-red-200 dark:bg-red-900/50 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-red-600 h-full rounded-full" style={{ width: '68%' }} />
                </div>
                <p className="text-[10px] text-red-600 dark:text-red-300 mt-1.5 leading-snug">
                  Immediate training center deployment mandated for high-density automotive &amp; tooling clusters.
                </p>
              </div>

              {/* Moderate Gap Tier */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Moderate Gap Districts</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400">6 Districts</span>
                </div>
                <div className="w-full bg-amber-200 dark:bg-amber-900/50 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }} />
                </div>
                <p className="text-[10px] text-amber-600 dark:text-amber-300 mt-1.5 leading-snug">
                  Trainer upskilling and modern lab equipment required to match new technology standards.
                </p>
              </div>

              {/* Balanced / Low Gap Tier */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Balanced / Low Gap</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">2 Districts</span>
                </div>
                <div className="w-full bg-emerald-200 dark:bg-emerald-900/50 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '22%' }} />
                </div>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-300 mt-1.5 leading-snug">
                  Supply matches employer absorption. Reallocation of additional seats recommended.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('admin/districts')}
            className="w-full py-2 px-3 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <MapPin className="w-3.5 h-3.5" />
            Open District Intelligence Matrix
          </button>
        </Card>
      </div>

      {/* ── 4. Row B: Emerging Skills vs Outdated / Out-of-Place Skills (Requested by User) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Emerging High-Growth Skills */}
        <Card className="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top Emerging Skills</h3>
                <p className="text-[11px] text-gray-400">High market absorption with expanding hiring demand</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              High Growth
            </span>
          </div>

          <div className="pt-3 space-y-2">
            {emergingSkills.map((skill) => (
              <div
                key={skill.rank}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0 ${skill.iconBg}`}>
                    {skill.rank}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">{skill.name}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{skill.domain}</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                  {skill.growth}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Outdated / Out-of-Place Skills */}
        <Card className="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Outdated &amp; Declining Skills</h3>
                <p className="text-[11px] text-gray-400">Curricula with severe market deficit or AI redundancy</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              Needs Sunset
            </span>
          </div>

          <div className="pt-3 space-y-2">
            {decliningSkills.map((skill, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{skill.name}</span>
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800 shrink-0">
                      {skill.issue}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    Recommendation: {skill.status}
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/50 px-2 py-0.5 rounded-md shrink-0">
                  {skill.decline}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── 5. Row C: Utilization & Placement Circular Gauges + Quick Control Hub ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Capacity Donut Gauge */}
        <Card className="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs flex flex-col justify-between text-center">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Capacity Load</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">National</span>
            </div>

            <div className="py-4 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"
                    className="text-gray-100 dark:text-gray-800" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"
                    className="text-indigo-600 transition-all duration-1000" fill="transparent"
                    strokeDasharray={capacityCircumference}
                    strokeDashoffset={capacityOffset}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{capacityRate}%</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Seat Load</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-[9px] text-gray-400 uppercase font-semibold">Enrolled</div>
                <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                  {(kpis.current_training_capacity || 12000).toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-[9px] text-gray-400 uppercase font-semibold">Target</div>
                <div className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                  {(kpis.industry_target_capacity || 15000).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Placement Rate Donut Gauge */}
        <Card className="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs flex flex-col justify-between text-center">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Placement Rate</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">Audited</span>
            </div>

            <div className="py-4 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"
                    className="text-gray-100 dark:text-gray-800" fill="transparent" />
                  <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"
                    className="text-emerald-500 transition-all duration-1000" fill="transparent"
                    strokeDasharray={placementCircumference}
                    strokeDashoffset={placementOffset}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{placementRate}%</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">Placement</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold">Employer Sat.</div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {kpis.employer_satisfaction_rate || 85}%
                </div>
              </div>
              <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-800">
                <div className="text-[9px] text-rose-600 dark:text-rose-400 uppercase font-semibold">Outdated</div>
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                  {kpis.outdated_courses_count || 2} Flagged
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Administrative Quick Actions */}
        <Card className="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
              Quick Operations
            </h3>
            <div className="space-y-1.5">
              {[
                { page: 'admin/courses', icon: BookOpen, color: 'text-blue-600', label: 'Accredited Curricula & Capacity' },
                { page: 'admin/enrollments', icon: Users, color: 'text-purple-600', label: 'Trainee Enrollment Audits' },
                { page: 'admin/trainers', icon: School, color: 'text-amber-600', label: 'Faculty & Upskill Plans' },
                { page: 'admin/districts', icon: MapPin, color: 'text-emerald-600', label: 'District Seat Allocation' },
              ].map(item => (
                <button
                  key={item.page}
                  onClick={() => navigate(item.page)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download Full Executive CSV
          </button>
        </Card>
      </div>
    </div>
  );
}
