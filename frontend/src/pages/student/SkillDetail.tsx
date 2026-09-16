import { useState, useEffect } from 'react';
import { getSkillById } from '../../services/api';
import { Button, Spinner, Badge, Card } from '../../components/ui';
import { Video, BookOpen, FileText } from 'lucide-react';

export default function SkillDetail({ skillId, onNavigate }: { skillId: number, onNavigate: (page: string, params?: any) => void }) {
  const [skill, setSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!skillId) {
      setLoading(false);
      return;
    }
    getSkillById(skillId.toString()).then(res => {
      setSkill(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [skillId]);

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;
  if (!skill) return <div className="p-12 text-center">Skill not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h1 className="text-4xl font-extrabold mb-4">{skill.name}</h1>
        <div className="flex justify-center gap-2 mb-6">
          <Badge color="blue">{skill.domain}</Badge>
          <Badge color={skill.trend === 'HOT' ? 'red' : 'gray'}>{skill.trend}</Badge>
        </div>
        <Button onClick={() => onNavigate('student/quiz', { skillId })} className="w-full md:w-auto px-12 py-3 text-lg bg-indigo-600 hover:bg-indigo-700">Take Skill Test</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Median Salary</div>
          <div className="font-bold text-xl">₹{(skill.median_salary/100000).toFixed(1)} LPA</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Total Openings</div>
          <div className="font-bold text-xl">{skill.openings_count || 0}</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Demand Score</div>
          <div className="font-bold text-xl">{skill.demand_score}/100</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Trend</div>
          <div className="font-bold text-xl">{skill.trend}</div>
        </Card>
      </div>

      {skill.description && (
        <div className="bg-white p-6 rounded-xl border border-gray-100">
          <h2 className="text-lg font-bold mb-2">About</h2>
          <p className="text-gray-700">{skill.description}</p>
        </div>
      )}

      {skill.resources?.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Resources</h2>
          <div className="grid gap-4">
            {skill.resources.map((r:any, i:number) => (
              <Card key={i} className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    {r.type === 'VIDEO' ? (
                      <Video className="w-5 h-5" />
                    ) : r.type === 'COURSE' ? (
                      <BookOpen className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-medium text-gray-800">{r.title}</span>
                </div>
                <a href={r.url} target="_blank" rel="noreferrer" className="text-blue-600 font-medium hover:underline">Open &rarr;</a>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
