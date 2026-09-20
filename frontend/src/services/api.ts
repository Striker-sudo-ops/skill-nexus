import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/+$/, '');
const API_URL = rawApiUrl.endsWith('/api/v1') ? rawApiUrl : `${rawApiUrl}/api/v1`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const loginUser = (data: any) => api.post('/auth/login', data);
export const registerUser = (data: any) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');
export const changePassword = (data: any) => api.post('/auth/change-password', data);

// â”€â”€ Skills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getSkills = (params?: any) => api.get('/skills', { params });
export const getSkillDetail = (id: string | number) => api.get(`/skills/${id}`);
export const getSkillById = (id: string | number) => api.get(`/skills/${id}`);
export const getTrendingSkills = (params?: any) => api.get('/skills', { params });
export const getSkillDomains = () => api.get('/skills/domains');

// â”€â”€ Jobs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getJobs = (params?: any) => api.get('/jobs', { params });
export const getJobDetail = (id: string | number) => api.get(`/jobs/${id}`);
export const getJobById = (id: string | number) => api.get(`/jobs/${id}`);
export const getJobCount = (params?: any) => api.get('/jobs', { params });
export const createJob = (data: any) => api.post('/jobs', data);
export const getSavedJobs = () => api.get('/jobs/saved');
export const getSavedJobIds = () => api.get('/jobs/saved/ids');
export const saveJob = (jobId: string | number) => api.post(`/jobs/${jobId}/save`);
export const unsaveJob = (jobId: string | number) => api.delete(`/jobs/${jobId}/save`);
export const getJobSkillGap = (jobId: string | number) => api.get(`/jobs/${jobId}/skill-gap`);
export const getWhyRecommended = (jobId: string | number) => api.get(`/jobs/${jobId}/why-recommended`);
export const getSalaryInsights = () => api.get('/analytics/salary-insights');
export const applyToJob = (jobId: string | number, data: any) => api.post(`/jobs/${jobId}/apply`, data);
export const getMyJobApplication = (jobId: string | number) => api.get(`/jobs/${jobId}/my-application`);
export const getEmployerApplications = (params?: any) => api.get('/applications/employer', { params });
export const getJobApplications = (jobId: string | number) => api.get(`/applications/employer/${jobId}`);
export const contactCandidate = (appId: string | number, data: any) => api.post(`/applications/${appId}/contact`, data);
export const rejectCandidate = (appId: string | number, data: any) => api.post(`/applications/${appId}/reject`, data);

// â”€â”€ Job Alerts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getJobAlerts = () => api.get('/job-alerts');
export const createJobAlert = (data: any) => api.post('/job-alerts', data);
export const deleteJobAlert = (alertId: string | number) => api.delete(`/job-alerts/${alertId}`);
export const getJobAlertMatches = (alertId: string | number) => api.get(`/job-alerts/${alertId}/matches`);

// â”€â”€ Student â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getStudentProfile = () => api.get('/students/profile');
export const updateStudentProfile = (data: any) => api.put('/students/profile', data);
export const addStudentLocations = (data: any) => api.post('/students/locations', data);
export const addStudentEducation = (data: any) => api.post('/students/education', data);
export const addStudentSkills = (data: any) => api.post('/students/skills', data);
export const addStudentInterests = (data: any) => api.post('/students/interests', data);
export const uploadResume = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/students/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const parseResume = (formData: FormData) => {
  return api.post('/students/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getRecommendedJobs = () => api.get('/students/recommended-jobs');
export const getSkillGap = (params?: any) => api.get('/students/skill-gap', { params });

// Student courses & certs
export const completeCourse = (data: any) => api.post('/students/courses/complete', data);
export const addCertificate = (data: any) => api.post('/students/certificates', data);
export const syncSkills = () => api.post('/students/sync-skills', {});

// â”€â”€ Quiz â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getQuizQuestions = (skillId: string | number) => api.get(`/quiz/${skillId}/questions`);
export const submitQuizAttempt = (data: any) => api.post('/quiz/submit', data);
export const submitQuiz = (skillId: string | number, data: any) => api.post(`/quiz/${skillId}/submit`, data);

// â”€â”€ Courses â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getCourses = (params?: any) => api.get('/courses', { params });
export const getCourseById = (id: string | number) => api.get(`/courses/${id}`);
export const enrollCourse = (id: string | number, data: any) => api.post(`/courses/${id}/enroll`, data);
export const getMyEnrollment = (id: string | number) => api.get(`/courses/${id}/my-enrollment`);
export const getMyEnrollments = () => api.get('/courses/my-enrollments');

// â”€â”€ Employer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getEmployerProfile = () => api.get('/employers/profile');
export const updateEmployerProfile = (data: any) => api.put('/employers/profile', data);
export const getEmployerJobs = () => api.get('/employers/jobs');
export const postEmployerJob = (data: any) => api.post('/employers/jobs', data);
export const updateEmployerJob = (id: any, data: any) => api.put(`/employers/jobs/${id}`, data);
export const deleteEmployerJob = (id: any) => api.delete(`/employers/jobs/${id}`);
export const searchCandidates = (params?: any) => api.get('/employers/candidates', { params });
export const submitCandidateFeedback = (data: any) => api.post('/employers/feedback', data);
export const getEmployerFeedbacks = () => api.get('/employers/feedback');
export const submitConsultation = (data: any) => api.post('/employers/consultations', data);
export const getConsultations = () => api.get('/employers/consultations');
export const getTrainingInstitutes = (params?: any) => api.get('/employers/training-institutes', { params });

// â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getAdminOverview = () => api.get('/admin/overview');
export const getAdminDistricts = (params?: any) => api.get('/admin/districts', { params });
export const getAdminCourses = (params?: any) => api.get('/admin/courses', { params });
export const addAdminCourse = (data: any) => api.post('/admin/courses', data);
export const getAdminTrainers = () => api.get('/admin/trainers');
export const addAdminTrainer = (data: any) => api.post('/admin/trainers', data);
export const removeAdminTrainer = (id: number) => api.delete(`/admin/trainers/${id}`);
export const getAdminEnrollments = (params?: any) => api.get('/admin/enrollments', { params });
export const updateEnrollmentStatus = (id: number, status: string) => api.put(`/admin/enrollments/${id}/status`, { status });
export const getCurriculumUpdates = () => api.get('/admin/curriculum-updates');
export const actionCurriculumUpdate = (id: number, action: string) => api.post(`/admin/curriculum-updates/${id}/action`, { action });
export const exportReport = () => api.get('/admin/export-report', { responseType: 'blob' });
export const syncLiveTelemetry = () => api.post('/admin/sync-live-data', {}, { timeout: 180000 });
export const wipeTelemetry = () => api.post('/admin/wipe-telemetry');
export const getLastSync = () => api.get('/admin/last-sync');
export const getDistrictAIStrategy = (districtId: number) => api.get(`/admin/districts/${districtId}/ai-strategy`);
export const getSourceStats = () => api.get('/admin/source-stats');
export const getAdminSkills = (params?: any) => api.get('/admin/skills', { params });
export const createAdminSkill = (data: any) => api.post('/admin/skills', data);
export const updateAdminSkill = (id: number, data: any) => api.put(`/admin/skills/${id}`, data);
export const deleteAdminSkill = (id: number) => api.delete(`/admin/skills/${id}`);
export const getAdminJobs = (params?: any) => api.get('/admin/jobs', { params });
export const deleteAdminJob = (id: number) => api.delete(`/admin/jobs/${id}`);
export const deactivateAdminJob = (id: number) => api.patch(`/admin/jobs/${id}/deactivate`);

export const updateCourseStatus = (id: number, data: any) => api.put(`/admin/courses/${id}/status`, data);
export const deleteAdminCourse = (id: number) => api.delete(`/admin/courses/${id}`);
export const updateTrainerCourses = (id: number, data: any) => api.put(`/admin/trainers/${id}/courses`, data);




// â”€â”€ Trainer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const getTrainerProfile = () => api.get('/trainer/profile');
export const getTrainerCourses = () => api.get('/trainer/courses');
export const getTrainerEnrollments = () => api.get('/trainer/enrollments');
export const revokeEnrollment = (id: number, reason: string) => api.put(`/trainer/enrollments/${id}/revoke`, { reason });

// ðŸ“¬ Inbox Messaging
export const sendMessage = (data: any) => api.post('/messages/send', data);
export const getInbox = () => api.get('/messages/inbox');
export const getSentMessages = () => api.get('/messages/sent');
export const getConversation = (otherUserId: number) => api.get(`/messages/conversation/${otherUserId}`);
export const markMessageRead = (messageId: number) => api.put(`/messages/${messageId}/read`);
export const getUnreadCount = () => api.get('/messages/unread-count');
export const getContacts = () => api.get('/messages/contacts');

// ðŸ’¡ Employer Suggestions to Government
export const submitSuggestion = (data: any) => api.post('/suggestions', data);
export const getMySuggestions = () => api.get('/suggestions/my');
export const getAllSuggestions = (status?: string) => api.get('/suggestions', { params: status ? { status } : {} });
export const respondToSuggestion = (id: number, data: any) => api.put(`/suggestions/${id}/respond`, data);

// ðŸ“‹ Course Feedback & Placement Rating
export const submitCourseFeedback = (data: any) => api.post('/courses/feedback', data);
export const getCourseFeedback = (courseId: number) => api.get(`/courses/${courseId}/feedback`);
export const getAllCourseFeedback = () => api.get('/courses/feedback/all');
export const checkFeedbackStatus = (courseId: number) => api.get(`/courses/feedback/check/${courseId}`);
export const overridePlacementRate = (courseId: number, rate: number) => api.put(`/courses/${courseId}/placement-rate`, { placement_rate: rate });

// 🎓 Student search (for employer inbox)
export const getAdminStudents = (q?: string) => api.get('/admin/students', { params: q ? { q } : {} });

export default api;

