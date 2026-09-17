import { useState, useEffect } from 'react';
import { getTrainerProfile, getTrainerCourses, getTrainerEnrollments } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { 
  GraduationCap, BookOpen, Users, KeyRound, ShieldCheck, 
  MapPin, CheckCircle2, Clock, ChevronRight, Phone, Mail
} from 'lucide-react';

export default function TrainerDashboard({ navigate }: { navigate: (page: string) => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrainerProfile(), getTrainerCourses(), getTrainerEnrollments()])
      .then(([pRes, cRes, eRes]) => {
        setProfile(pRes.data);
        setCourses(cRes.data || []);
        setEnrollments(eRes.data.enrollments || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-slate-900 text-white p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-amber-100 mb-2 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
              Faculty Portal &bull; {profile?.trainer_code || 'Certified Trainer'}
            </div>
            <h1 className="text-2xl font-bold">Welcome, {profile?.name || 'Trainer'}!</h1>
            <p className="text-xs text-amber-100/80 mt-1 max-w-xl">
              Manage your accredited courses, track student enrollment applications, and evaluate cohort competency progress.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('trainer/profile')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-gray-900 hover:bg-amber-50 text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              My Profile
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Assigned Courses</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{courses.length}</div>
        </Card>

        <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Enrolled Trainees</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{enrollments.length}</div>
        </Card>

        <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Faculty Score</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{profile?.capability_score || 85}/100</div>
        </Card>

        <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-xs">
          <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Teaching Domain</div>
          <div className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate">{profile?.domain || 'Technical'}</div>
        </Card>
      </div>

      {/* 2-Column Row: Assigned Courses & Recent Trainee Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Courses */}
        <Card className="p-5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              My Assigned Courses
            </h3>
            <button
              onClick={() => navigate('trainer/courses')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              View All &rarr;
            </button>
          </div>

          <div className="pt-3 space-y-3">
            {courses.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No courses currently assigned to your profile. Contact your government administrator.
              </div>
            ) : (
              courses.map(c => (
                <div key={c.id} className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      {c.course_code}
                    </span>
                    <Badge color="blue">{c.depth_level}</Badge>
                  </div>
                  <div className="font-bold text-xs text-gray-900 dark:text-white">{c.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                    <span>Enrolled: {c.enrolled_count} / {c.target_capacity}</span>
                    <span>Placement Track: {c.placement_rate}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Trainee Applications */}
        <Card className="p-5 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Recent Trainee Enrollments
            </h3>
            <button
              onClick={() => navigate('trainer/enrollments')}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              All Trainees &rarr;
            </button>
          </div>

          <div className="pt-3 divide-y divide-gray-100 dark:divide-gray-700">
            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">
                No students currently enrolled in your assigned courses.
              </div>
            ) : (
              enrollments.slice(0, 5).map(e => (
                <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{e.full_name}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                      {e.course_code} &bull; {e.city || 'City N/A'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    {e.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
