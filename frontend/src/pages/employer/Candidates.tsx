import { useState, useEffect } from 'react';
import { searchCandidates, getSkills } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { Users, MapPin, GraduationCap, CheckCircle2, Search } from 'lucide-react';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState('ALL');
  const [selectedProficiency, setSelectedProficiency] = useState('ALL');
  const [locationQuery, setLocationQuery] = useState('');

  useEffect(() => {
    getSkills()
      .then(res => setSkillsList(res.data))
      .catch(err => console.error(err));
  }, []);

  const fetchCandidates = () => {
    setLoading(true);
    searchCandidates({
      skill: selectedSkill,
      location: locationQuery,
      proficiency: selectedProficiency
    })
      .then(res => setCandidates(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedSkill, selectedProficiency]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Trained Candidates</h1>
          <p className="text-xs text-gray-500 mt-0.5">Search and recruit pre-assessed candidates with verified skill credentials and completed government courses</p>
        </div>
        <Badge color="blue" className="text-xs py-1 px-3">
          {candidates.length} Qualified Candidates Found
        </Badge>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-gray-200 rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <select
            value={selectedSkill}
            onChange={e => setSelectedSkill(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
          >
            <option value="ALL">Filter by Skill: All Skills</option>
            {skillsList.map(s => (
              <option key={s.id} value={s.name}>{s.name} ({s.domain})</option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <select
            value={selectedProficiency}
            onChange={e => setSelectedProficiency(e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-800"
          >
            <option value="ALL">All Proficiencies</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="EXPERT">Expert</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px] flex gap-2">
          <input
            type="text"
            placeholder="Location (e.g. Pune, Bengaluru)..."
            value={locationQuery}
            onChange={e => setLocationQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchCandidates()}
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 text-gray-800"
          />
          <button
            onClick={fetchCandidates}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </div>
      </div>

      {/* Candidate Cards Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : candidates.length === 0 ? (
        <div className="p-12 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl">
          No candidates match the specified criteria. Try broadening your search filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {candidates.map(c => (
            <Card key={c.id} className="p-5 border border-gray-200 hover:border-blue-400 transition-all space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{c.full_name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{c.location}</span>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {c.profile_complete_pct}% Profile Complete
                </span>
              </div>

              {/* Education */}
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-lg">
                <GraduationCap className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate">{c.education}</span>
              </div>

              {/* Skills */}
              <div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Verified Skills:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {c.skills?.map((sk: any, idx: number) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-100 rounded-md text-[11px] font-medium flex items-center gap-1"
                    >
                      <span>{sk.name}</span>
                      <span className="text-[9px] px-1 bg-white rounded font-bold text-blue-600 uppercase">
                        {sk.proficiency?.slice(0, 3)}
                      </span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Completed Government Courses */}
              {c.completed_courses && (
                <div className="pt-1 border-t border-gray-100 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">Completed Govt Programs:</span>{' '}
                  <span className="font-mono text-purple-700 font-semibold">{c.completed_courses}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
