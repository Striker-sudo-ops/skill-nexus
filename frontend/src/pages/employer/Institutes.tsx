import { useState, useEffect } from 'react';
import { getTrainingInstitutes } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { School, MapPin, Mail, Star, Users, CheckCircle } from 'lucide-react';

export default function InstitutesPage() {
  const [institutes, setInstitutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [districtQuery, setDistrictQuery] = useState('');
  const [domainQuery, setDomainQuery] = useState('');

  const fetchInstitutes = () => {
    setLoading(true);
    getTrainingInstitutes({ district: districtQuery, domain: domainQuery })
      .then(res => setInstitutes(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vocational & Technical Training Institutes</h1>
          <p className="text-xs text-gray-500 mt-0.5">Discover partner training institutes, polytechnics, and skill centers producing relevant industry talent</p>
        </div>
        <Badge color="blue" className="text-xs py-1 px-3">
          {institutes.length} Accredited Institutes
        </Badge>
      </div>

      {/* Filter Row */}
      <div className="p-4 bg-white border border-gray-200 rounded-xl flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by district (e.g. Pune, Chennai)..."
          value={districtQuery}
          onChange={e => setDistrictQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchInstitutes()}
          className="flex-1 min-w-[200px] text-xs border border-gray-300 rounded-lg p-2"
        />
        <input
          type="text"
          placeholder="Filter by domain (e.g. Robotics, EV, Solar)..."
          value={domainQuery}
          onChange={e => setDomainQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchInstitutes()}
          className="flex-1 min-w-[200px] text-xs border border-gray-300 rounded-lg p-2"
        />
        <button
          onClick={fetchInstitutes}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
        >
          Search Institutes
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutes.map(inst => (
            <Card key={inst.id} className="p-5 border border-gray-200 hover:border-blue-400 transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                    <School className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{inst.rating}</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm text-gray-900 leading-snug">{inst.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{inst.district}, {inst.state}</span>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                    {inst.focus_domain}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Annual Graduates:</span>
                  <strong className="text-gray-900">{inst.annual_graduates} students</strong>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Verified Placement Rate:</span>
                  <strong className="text-emerald-700 font-bold">{inst.placement_rate}%</strong>
                </div>
                <a
                  href={`mailto:${inst.contact_email}`}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-gray-50 hover:bg-blue-50 text-blue-700 rounded-lg font-medium border border-gray-200 hover:border-blue-200 transition-colors mt-2"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Placement Cell</span>
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
