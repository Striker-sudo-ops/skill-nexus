import { useState, useEffect } from 'react';
import { getCourses, getCourseById, enrollCourse, getMyEnrollment, getStudentProfile } from '../../services/api';
import { Card, Badge, Spinner } from '../../components/ui';
import { 
  BookOpen, Clock, Users, ArrowRight, Sparkles, CheckCircle2, 
  X, Info, Check, Briefcase, GraduationCap, MapPin, Send, AlertCircle, MessageSquare
} from 'lucide-react';
import CourseFeedbackForm from './CourseFeedbackForm';

export default function CourseCatalog() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  
  // Modal & Application state
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [matchingJobs, setMatchingJobs] = useState<any[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isEnrolledInSelected, setIsEnrolledInSelected] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState('');
  const [enrolledMap, setEnrolledMap] = useState<Record<string, string>>({});

  // Student Profile for auto-fill
  const [studentData, setStudentData] = useState<any>({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    education: '',
    city: '',
    state: '',
    motivation: ''
  });
  const [submittingApply, setSubmittingApply] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // Course Feedback state
  const [feedbackCourse, setFeedbackCourse] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    fetchCourses();
    fetchStudentProfile();
  }, []);

  const fetchCourses = () => {
    setLoading(true);
    getCourses()
      .then(res => {
        setCourses(res.data);
        // Check enrollments for each course
        res.data.forEach((c: any) => {
          getMyEnrollment(c.id).then(r => {
            if (r.data?.enrolled) {
              setEnrolledMap(prev => ({ ...prev, [c.id]: r.data.status || 'Enrolled' }));
            }
          }).catch(() => {});
        });
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const fetchStudentProfile = () => {
    getStudentProfile()
      .then(res => {
        const p = res.data;
        const stu = p.student || {};
        const edu = (p.education && p.education[0]) || {};
        const loc = (p.locations && p.locations[0]) || {};
        setStudentData({
          full_name: stu.full_name || '',
          email: p.user?.email || '',
          phone: stu.phone || '',
          dob: stu.dob || '',
          education: edu.degree ? `${edu.degree} in ${edu.field_of_study || 'General'}` : '',
          city: loc.city || '',
          state: loc.state || '',
          motivation: 'I want to build in-demand industry skills and advance my career.'
        });
      })
      .catch(() => {});
  };

  const openCourseDetail = async (courseId: number | string, startApply = false) => {
    setModalLoading(true);
    setShowApplyForm(startApply);
    setApplySuccess(false);
    setIsEnrolledInSelected(false);
    setMatchingJobs([]);

    try {
      const res = await getCourseById(courseId);
      // Correctly access res.data.course
      const courseData = res.data.course || res.data;
      setSelectedCourse(courseData);
      setMatchingJobs(res.data.matching_jobs || []);

      // Check enrollment
      const enrollRes = await getMyEnrollment(courseData.id);
      if (enrollRes.data?.enrolled) {
        setIsEnrolledInSelected(true);
        setEnrollmentStatus(enrollRes.data.status || 'PENDING');
        setEnrolledMap(prev => ({ ...prev, [courseData.id]: enrollRes.data.status || 'PENDING' }));
      }
    } catch (err) {
      console.error('Error fetching course details', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setSubmittingApply(true);
    try {
      await enrollCourse(selectedCourse.id, studentData);
      setIsEnrolledInSelected(true);
      setEnrollmentStatus('PENDING');
      setApplySuccess(true);
      setEnrolledMap(prev => ({ ...prev, [selectedCourse.id]: 'PENDING' }));
      setShowApplyForm(false);
      // Refresh list to show updated enrolled_count
      fetchCourses();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to submit application. Please try again.');
    } finally {
      setSubmittingApply(false);
    }
  };

  const domains = ['ALL', ...Array.from(new Set(courses.map(c => c.domain).filter(Boolean)))];
  const filteredCourses = selectedDomain === 'ALL'
    ? courses
    : courses.filter(c => c.domain === selectedDomain);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Government Certified Curricula</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            National skill development programmes aligned with high-growth industry demands and direct placement pathways
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Showing {filteredCourses.length} accredited courses
        </div>
      </div>

      {/* Domain Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {domains.map(domain => (
          <button
            key={domain}
            onClick={() => setSelectedDomain(domain)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedDomain === domain
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {domain}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">No courses available for this domain</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => {
            const isEnrolled = !!enrolledMap[course.id];
            return (
              <Card
                key={course.id}
                className="p-5 flex flex-col justify-between border border-gray-200 dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-xs"
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
                      {course.course_code}
                    </span>
                    <Badge color="blue">{course.depth_level}</Badge>
                  </div>

                  {/* Title & Domain */}
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {course.domain}
                    </span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mt-0.5 leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  {/* Skills Chips */}
                  <div className="flex flex-wrap gap-1">
                    {course.skills_offered?.split(',').slice(0, 3).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[11px] font-medium"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                    {(course.skills_offered?.split(',').length || 0) > 3 && (
                      <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-700/50 text-gray-400 rounded text-[11px]">
                        +{course.skills_offered.split(',').length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Metrics snapshot */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 text-center">
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">Industry Match</div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{course.industry_demand_alignment}%</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">Duration</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{course.duration_weeks} Wks</div>
                    </div>
                  </div>

                  {/* Meta stats */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {course.duration_weeks} Weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {course.enrolled_count} / {course.target_capacity} Enrolled
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4 flex items-center gap-2">
                  <button
                    onClick={() => openCourseDetail(course.id, false)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    More Info
                  </button>

                  {isEnrolled ? (
                    <span className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 select-none">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Enrolled
                    </span>
                  ) : (course.status === 'NOT_AVAILABLE' || course.status === 'CAPACITY_FULL' || course.status === 'OUTDATED' || course.is_outdated) ? (
                    <span className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 flex items-center justify-center gap-1.5 select-none">
                      {course.status === 'CAPACITY_FULL' ? 'Full' : course.status === 'OUTDATED' || course.is_outdated ? 'Outdated' : 'Not Available'}
                    </span>
                  ) : (
                    <button
                      onClick={() => openCourseDetail(course.id, true)}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Apply Now
                    </button>
                  )}
                </div>

              </Card>
            );
          })}
        </div>
      )}

      {/* Course Detail & 2-Step Application Modal */}
      {(selectedCourse || modalLoading) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
            {modalLoading ? (
              <div className="p-12 flex items-center justify-center"><Spinner /></div>
            ) : selectedCourse ? (
              <div>
                {/* Modal Header */}
                <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-600">
                        {selectedCourse.course_code}
                      </span>
                      <Badge color="blue">{selectedCourse.depth_level}</Badge>
                      <Badge color="green">{selectedCourse.domain}</Badge>
                      {isEnrolledInSelected && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Already Enrolled ({enrollmentStatus})
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCourse.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => { setSelectedCourse(null); setShowApplyForm(false); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {/* Success Alert if just applied */}
                  {applySuccess && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Application Submitted Successfully!</div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-400">
                          Your details have been registered with the training center. The assigned trainer will review your application.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Course Details Section */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Curriculum Overview</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {selectedCourse.description}
                    </p>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Demand Alignment</div>
                      <div className="text-xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">{selectedCourse.industry_demand_alignment}%</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 text-center">
                      <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold uppercase">Duration</div>
                      <div className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">{selectedCourse.duration_weeks} Wks</div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 text-center">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase">Enrolled</div>
                      <div className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{selectedCourse.enrolled_count} / {selectedCourse.target_capacity}</div>
                    </div>
                  </div>

                  {/* Skills Developed */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Competencies & Skills Gained</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCourse.skills_offered?.split(',').map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Associated Roles */}
                  {selectedCourse.related_job_roles && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Qualifying Employment Roles</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {selectedCourse.related_job_roles}
                      </p>
                    </div>
                  )}

                  {/* Matching Industry Jobs */}
                  {matchingJobs.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Active Job Openings Requiring These Skills ({matchingJobs.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchingJobs.map(job => (
                          <div key={job.id} className="p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 text-xs">
                            <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between">
                              <span className="truncate">{job.title}</span>
                              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 shrink-0 ml-2">{job.job_type}</span>
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-1 flex items-center gap-2">
                              <span>{job.city}, {job.state}</span>
                              {job.salary_max && (
                                <span>&bull; ₹{(job.salary_max / 100000).toFixed(1)} LPA</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Application Form Section */}
                  {showApplyForm && !isEnrolledInSelected && (
                    <div className="p-5 bg-blue-50/60 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Send className="w-4 h-4 text-blue-600" />
                            Enrollment Application Form
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Information auto-fetched from your student profile. Review and confirm to submit.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowApplyForm(false)}
                          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <form onSubmit={handleApplySubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              value={studentData.full_name}
                              onChange={e => setStudentData((s: any) => ({ ...s, full_name: e.target.value }))}
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Email Address *</label>
                            <input
                              type="email"
                              required
                              value={studentData.email}
                              onChange={e => setStudentData((s: any) => ({ ...s, email: e.target.value }))}
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Phone Number</label>
                            <input
                              type="tel"
                              value={studentData.phone}
                              onChange={e => setStudentData((s: any) => ({ ...s, phone: e.target.value }))}
                              placeholder="+91 9876543210"
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Highest Qualification</label>
                            <input
                              type="text"
                              value={studentData.education}
                              onChange={e => setStudentData((s: any) => ({ ...s, education: e.target.value }))}
                              placeholder="e.g. B.Tech Computer Science"
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">City</label>
                            <input
                              type="text"
                              value={studentData.city}
                              onChange={e => setStudentData((s: any) => ({ ...s, city: e.target.value }))}
                              placeholder="e.g. Pune"
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">State</label>
                            <input
                              type="text"
                              value={studentData.state}
                              onChange={e => setStudentData((s: any) => ({ ...s, state: e.target.value }))}
                              placeholder="e.g. Maharashtra"
                              className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-300 mb-1">Motivation / Learning Goals</label>
                          <textarea
                            rows={2}
                            value={studentData.motivation}
                            onChange={e => setStudentData((s: any) => ({ ...s, motivation: e.target.value }))}
                            className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Briefly state why you want to enroll in this course..."
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowApplyForm(false)}
                            className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submittingApply}
                            className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {submittingApply ? 'Submitting Application...' : 'Confirm & Apply for Course'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
                  <button
                    onClick={() => { setSelectedCourse(null); setShowApplyForm(false); }}
                    className="py-2.5 px-4 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  >
                    Close
                  </button>

                  {!isEnrolledInSelected && !showApplyForm && (
                    <button
                      onClick={() => setShowApplyForm(true)}
                      className="py-2.5 px-6 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Apply for this Course
                    </button>
                  )}

                  {isEnrolledInSelected && (
                    <span className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Status: Enrolled ({enrollmentStatus})
                    </span>
                  )}

                  {isEnrolledInSelected && (
                    <button
                      onClick={() => {
                        setFeedbackCourse({ id: selectedCourse.id, title: selectedCourse.title });
                        setSelectedCourse(null);
                      }}
                      className="py-2.5 px-4 rounded-xl text-xs font-medium border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Leave Feedback
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Course Feedback Modal */}
      {feedbackCourse && (
        <CourseFeedbackForm
          courseId={feedbackCourse.id}
          courseTitle={feedbackCourse.title}
          onClose={() => setFeedbackCourse(null)}
        />
      )}
    </div>
  );
}
