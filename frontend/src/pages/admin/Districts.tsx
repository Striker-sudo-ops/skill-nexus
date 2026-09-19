import { useState, useEffect } from 'react';
import { getAdminDistricts, getDistrictAIStrategy } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { MapPin, AlertCircle, TrendingUp, Brain, X, Zap, Target, ChevronRight } from 'lucide-react';

interface AIStrategy {
  source: string;
  recommended_action: string;
  ai_rationale: string;
  target_roles: string[];
  urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'STABLE';
}

interface AIModal {
  districtId: number;
  districtName: string;
  loading: boolean;
  data: {
    district: string;
    state: string;
    primary_sector: string;
    current_capacity: number;
    recommended_seats: number;
    shortage_deficit: number;
    top_demand_skill: string;
    demand_index: number;
    active_jobs_count: number;
    ai_strategy: AIStrategy;
  } | null;
  error: string | null;
}

export default function DistrictIntelligence() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [aiModal, setAiModal] = useState<AIModal | null>(null);

  const fetchData = () => {
    setLoading(true);
    getAdminDistricts({ state: selectedState, status: selectedStatus })
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [selectedState, selectedStatus]);

  const openAIStrategy = (districtId: number, districtName: string) => {
    setAiModal({ districtId, districtName, loading: true, data: null, error: null });
    getDistrictAIStrategy(districtId)
      .then(res => setAiModal(prev => prev ? { ...prev, loading: false, data: res.data } : null))
      .catch(() => setAiModal(prev => prev ? { ...prev, loading: false, error: 'Failed to generate AI strategy. Please check your Gemini API key in Render settings.' } : null));
  };

  const urgencyColors: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-300',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
    MODERATE: 'bg-amber-100 text-amber-700 border-amber-300',
    STABLE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  };

  const summary = data?.summary || {};
  const districts = data?.districts || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">District Intelligence &amp; Capacity Allocation</h1>
          <p className="text-xs text-gray-500 mt-0.5">District-wise skill demand analysis, skilled workforce shortages, and targeted training plans</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color="red" className="text-xs py-1 px-3">
            {summary.new_centres_needed || 0} New Training Centres Recommended
          </Badge>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3.5 border border-gray-200">
          <div className="text-[11px] font-medium text-gray-500">Monitored Districts</div>
          <div className="text-xl font-bold text-gray-900 mt-1">{summary.total_monitored || 0}</div>
        </Card>
        <Card className="p-3.5 border border-red-200 bg-red-50/30">
          <div className="text-[11px] font-medium text-red-700">Critical Shortage Districts</div>
          <div className="text-xl font-bold text-red-600 mt-1">{summary.critical_shortage_count || 0}</div>
        </Card>
        <Card className="p-3.5 border border-amber-200 bg-amber-50/30">
          <div className="text-[11px] font-medium text-amber-700">High Demand Clusters</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{summary.high_demand_count || 0}</div>
        </Card>
        <Card className="p-3.5 border border-gray-200 bg-gray-50/50">
          <div className="text-[11px] font-medium text-gray-600">Oversupply Districts</div>
          <div className="text-xl font-bold text-gray-700 mt-1">{summary.oversupply_count || 0}</div>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
        <span className="text-xs font-semibold text-gray-700">Filter By:</span>
        <select
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
        >
          <option value="ALL">All States</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Haryana">Haryana</option>
          <option value="Gujarat">Gujarat</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="Bihar">Bihar</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-gray-800"
        >
          <option value="ALL">All Statuses</option>
          <option value="CRITICAL_SHORTAGE">Critical Shortage</option>
          <option value="HIGH_DEMAND">High Demand</option>
          <option value="BALANCED">Balanced</option>
          <option value="OVERSUPPLY">Oversupply</option>
        </select>
      </div>

      {/* Main Districts Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <Card className="overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                  <th className="py-3 px-4">District &amp; State</th>
                  <th className="py-3 px-3">Primary Sector</th>
                  <th className="py-3 px-3">Demand Index</th>
                  <th className="py-3 px-3">Current Seats</th>
                  <th className="py-3 px-3">Deficit / Surplus</th>
                  <th className="py-3 px-3">Top Demand Skill</th>
                  <th className="py-3 px-3">Rec. Target</th>
                  <th className="py-3 px-4">Recommended Action</th>
                  <th className="py-3 px-3">AI Strategy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {districts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-gray-400">
                      No district intelligence records found. Click &quot;Sync Live Data&quot; on the Overview dashboard to fetch real-world Maharashtra district telemetry.
                    </td>
                  </tr>
                ) : (
                  districts.map((d: any) => {
                    return (
                      <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{d.district}</div>
                          <div className="text-[11px] text-gray-400">{d.state}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-700">{d.primary_sector}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-14 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${d.demand_index >= 90 ? 'bg-red-500' : d.demand_index >= 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                style={{ width: `${d.demand_index}%` }}
                              />
                            </div>
                            <span className="font-semibold text-gray-800">{d.demand_index}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-700">{(d.current_capacity || 0).toLocaleString()}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-md ${
                            d.status === 'CRITICAL_SHORTAGE' || d.status === 'HIGH_DEMAND' || d.shortage_deficit > 0
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : d.status === 'BALANCED' || d.shortage_deficit === 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}>
                            {d.shortage_deficit > 0
                              ? `+${d.shortage_deficit.toLocaleString()} Deficit`
                              : d.shortage_deficit === 0 || d.status === 'BALANCED'
                              ? 'Balanced (0)'
                              : `${Math.abs(d.shortage_deficit).toLocaleString()} Surplus`}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-800">{d.top_demand_skill}</td>
                        <td className="py-3 px-3 font-bold text-blue-700">{(d.recommended_seats || 0).toLocaleString()} seats</td>
                        <td className="py-3 px-4">
                          <div className="text-xs text-gray-900 font-medium">{d.recommended_action}</div>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() => openAIStrategy(d.id, d.district)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg px-2.5 py-1.5 transition-colors"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            AI Strategy
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Action Plan Guidance */}
      {districts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 border-l-4 border-l-red-500">
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Capacity Expansion Priorities
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Districts with critical workforce deficits require immediate sanctions for modern vocational training centers and lab facilities to support regional industry demand.
            </p>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500">
            <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Capacity Rationalization / Reallocation
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Districts with balanced capacity or surplus should reallocate training seats and curriculum funding toward high-growth technical domains.
            </p>
          </Card>
        </div>
      )}

      {/* AI Strategy Modal */}
      {aiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">AI Workforce Strategy</h2>
                  <p className="text-[11px] text-gray-500">{aiModal.districtName}, Maharashtra</p>
                </div>
              </div>
              <button
                onClick={() => setAiModal(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {aiModal.loading ? (
                <div className="h-48 flex flex-col items-center justify-center gap-3">
                  <Spinner />
                  <p className="text-sm text-gray-500">Generating AI strategy with Gemini...</p>
                </div>
              ) : aiModal.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {aiModal.error}
                </div>
              ) : aiModal.data ? (
                <div className="space-y-5">
                  {/* Source + Urgency */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      {aiModal.data.ai_strategy.source}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${urgencyColors[aiModal.data.ai_strategy.urgency] || urgencyColors['MODERATE']}`}>
                      {aiModal.data.ai_strategy.urgency} URGENCY
                    </span>
                  </div>

                  {/* District Stats Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-medium text-blue-600 mb-1">Current Capacity</div>
                      <div className="text-lg font-bold text-blue-700">{(aiModal.data.current_capacity || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-blue-500">ITI Seats</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${aiModal.data.shortage_deficit > 0 ? 'bg-red-50' : aiModal.data.shortage_deficit === 0 ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                      <div className={`text-[10px] font-medium mb-1 ${aiModal.data.shortage_deficit > 0 ? 'text-red-600' : aiModal.data.shortage_deficit === 0 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                        {aiModal.data.shortage_deficit > 0 ? 'Deficit' : aiModal.data.shortage_deficit === 0 ? 'Balanced' : 'Surplus'}
                      </div>
                      <div className={`text-lg font-bold ${aiModal.data.shortage_deficit > 0 ? 'text-red-700' : aiModal.data.shortage_deficit === 0 ? 'text-emerald-700' : 'text-indigo-700'}`}>
                        {aiModal.data.shortage_deficit > 0 ? `+${aiModal.data.shortage_deficit.toLocaleString()}` : Math.abs(aiModal.data.shortage_deficit).toLocaleString()}
                      </div>
                      <div className={`text-[10px] ${aiModal.data.shortage_deficit > 0 ? 'text-red-500' : aiModal.data.shortage_deficit === 0 ? 'text-emerald-500' : 'text-indigo-500'}`}>
                        Skill Gap
                      </div>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3 text-center">
                      <div className="text-[10px] font-medium text-violet-600 mb-1">Active Jobs</div>
                      <div className="text-lg font-bold text-violet-700">{aiModal.data.active_jobs_count}</div>
                      <div className="text-[10px] text-violet-500">Open Postings</div>
                    </div>
                  </div>

                  {/* Recommended Action */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">Recommended Action</div>
                        <div className="text-sm font-semibold text-gray-900">{aiModal.data.ai_strategy.recommended_action}</div>
                      </div>
                    </div>
                  </div>

                  {/* AI Rationale */}
                  <div>
                    <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">AI Analysis</div>
                    <p className="text-sm text-gray-700 leading-relaxed">{aiModal.data.ai_strategy.ai_rationale}</p>
                  </div>

                  {/* Target Roles */}
                  {aiModal.data.ai_strategy.target_roles?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-gray-600" />
                        <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Priority Training Roles</div>
                      </div>
                      <div className="space-y-2">
                        {aiModal.data.ai_strategy.target_roles.map((role, i) => (
                          <div key={i} className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <ChevronRight className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                            <span className="text-sm text-gray-800 font-medium">{role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
