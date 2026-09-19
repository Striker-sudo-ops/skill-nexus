import { useState, useEffect } from 'react';
import { getAdminDistricts } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { MapPin, AlertCircle, TrendingUp, Building2, CheckCircle } from 'lucide-react';

export default function DistrictIntelligence() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

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

  const summary = data?.summary || {};
  const districts = data?.districts || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">District Intelligence & Capacity Allocation</h1>
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
                  <th className="py-3 px-4">District & State</th>
                  <th className="py-3 px-3">Primary Sector</th>
                  <th className="py-3 px-3">Demand Index</th>
                  <th className="py-3 px-3">Current Seats</th>
                  <th className="py-3 px-3">Deficit / Surplus</th>
                  <th className="py-3 px-3">Top Demand Skill</th>
                  <th className="py-3 px-3">Rec. Target</th>
                  <th className="py-3 px-4">AI Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {districts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-gray-400">
                      No district intelligence records found. Click &quot;Sync Live Data&quot; on the Overview dashboard to fetch real-world Maharashtra district telemetry.
                    </td>
                  </tr>
                ) : (
                  districts.map((d: any) => {
                    const isShortage = d.shortage_deficit > 0;
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
    </div>
  );
}
