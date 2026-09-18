import { useState, useEffect } from 'react';
import { getTrainerCourses } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { BookOpen, Users, Award, X, Clock, Target, ChevronRight } from 'lucide-react';

export default function TrainerCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    getTrainerCourses()
      .then(res => setCourses(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Assigned Curricula</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Accredited government courses where you are assigned as lead instructor
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No courses currently assigned to your account.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(c => (
            <Card key={c.id} className="p-5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600">
                  {c.course_code}
                </span>
                <Badge color="blue">{c.depth_level}</Badge>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase">{c.domain}</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{c.title}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-center text-xs">
                <div>
                  <div className="text-[10px] text-gray-400">Duration</div>
                  <div className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {c.duration_weeks} Weeks
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Class Enrollment</div>
                  <div className="font-bold text-gray-900 dark:text-white mt-0.5">{c.enrolled_count} / {c.target_capacity}</div>
                </div>

              </div>

              <button
                onClick={() => setSelected(c)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                View Course Details
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                  {selected.course_code}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-2">{selected.title}</h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase mt-0.5">{selected.domain}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase mb-1">
                  <Users className="w-3.5 h-3.5" /> Enrollment
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {selected.enrolled_count}
                  <span className="text-xs text-gray-400 font-normal"> / {selected.target_capacity}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase mb-1">
                  <BookOpen className="w-3.5 h-3.5" /> Duration
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {selected.duration_weeks} Weeks
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase mb-1">
                  <Target className="w-3.5 h-3.5" /> Depth Level
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">{selected.depth_level || '—'}</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase mb-1">
                  <Clock className="w-3.5 h-3.5" /> Fill Rate
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {selected.target_capacity > 0
                    ? `${Math.round((selected.enrolled_count / selected.target_capacity) * 100)}%`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Capacity bar */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Class capacity fill</span>
                <span>{selected.enrolled_count} / {selected.target_capacity}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((selected.enrolled_count / selected.target_capacity) * 100))}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setSelected(null)}
              className="w-full py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
