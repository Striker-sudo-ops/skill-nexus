import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Landing from './pages/Landing';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import { Menu, X, Sparkles, UserCheck, Sun, Moon } from 'lucide-react';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import CourseCatalog from './pages/student/CourseCatalog';
import ResumeBuilder from './pages/student/ResumeBuilder';
import TrendingSkills from './pages/student/TrendingSkills';
import SkillDetail from './pages/student/SkillDetail';
import Quiz from './pages/student/Quiz';
import JobDiscovery from './pages/student/JobDiscovery';
import JobDetail from './pages/student/JobDetail';
import RecommendedJobs from './pages/student/RecommendedJobs';
import SavedJobs from './pages/student/SavedJobs';
import JobAlerts from './pages/student/JobAlerts';

// Employer Pages
import EmployerDashboard from './pages/employer/Dashboard';
import EmployerProfile from './pages/employer/CompanyProfile';
import JobPostings from './pages/employer/JobPostings';
import CandidatesPage from './pages/employer/Candidates';
import FeedbackPage from './pages/employer/Feedback';
import ConsultationsPage from './pages/employer/Consultations';
import InstitutesPage from './pages/employer/Institutes';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminDistricts from './pages/admin/Districts';
import AdminCourses from './pages/admin/Courses';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminTrainers from './pages/admin/Trainers';
import AdminCurriculum from './pages/admin/Curriculum';
import AdminSettings from './pages/admin/Settings';

// Trainer Pages
import TrainerDashboard from './pages/trainer/Dashboard';
import TrainerProfile from './pages/trainer/Profile';
import TrainerCourses from './pages/trainer/Courses';
import TrainerEnrollments from './pages/trainer/Enrollments';
import TrainerChangePassword from './pages/trainer/ChangePassword';


const AppContent = () => {
  const { isLoggedIn, user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentParams, setCurrentParams] = useState<any>({});
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showFirstTimePopup, setShowFirstTimePopup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sn_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sn_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sn_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (loading) return;
    if (!isLoggedIn) {
      setCurrentPage('landing');
    } else if (isLoggedIn && currentPage === 'landing') {
      if (user?.role === 'ADMIN') {
        setCurrentPage('admin/dashboard');
      } else if (user?.role === 'EMPLOYER') {
        setCurrentPage('employer/dashboard');
      } else if (user?.role === 'TRAINER') {
        setCurrentPage('trainer/dashboard');
      } else {
        setCurrentPage('student/dashboard');
      }
    }
  }, [isLoggedIn, user, loading, currentPage]);

  // First-time login prompt check (strictly once per student account)
  useEffect(() => {
    if (isLoggedIn && user?.id && user?.role === 'STUDENT') {
      const key = `sb_first_login_prompt_shown_${user.id}`;
      if (!localStorage.getItem(key)) {
        setShowFirstTimePopup(true);
      }
    }
  }, [isLoggedIn, user]);

  const handleDismissFirstTimePopup = (goToProfile: boolean) => {
    if (user?.id) {
      localStorage.setItem(`sb_first_login_prompt_shown_${user.id}`, 'true');
    }
    setShowFirstTimePopup(false);
    if (goToProfile) {
      navigate('student/profile');
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-gray-50 text-gray-500 font-medium">Loading Skill Nexus...</div>;
  }

  const navigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setCurrentParams(params);
  };

  if (!isLoggedIn) {
    return (
      <>
        <Landing openAuth={() => setAuthModalOpen(true)} />
        {isAuthModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      </>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">
      {/* First Time Login Profile Completion Popup */}
      {showFirstTimePopup && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <button
                onClick={() => handleDismissFirstTimePopup(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Welcome to Skill Nexus, {user?.full_name || 'Student'}!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                Take a moment to update your profile with your education, preferred locations, and skills. Our AI uses these details to match you with top job opportunities and recommend high-impact courses.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => handleDismissFirstTimePopup(true)}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Update Profile Now
              </button>
              <button
                onClick={() => handleDismissFirstTimePopup(false)}
                className="py-2.5 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium cursor-pointer transition-colors"
              >
                Remind Me Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Sidebar */}
      {isSidebarOpen && (
        <div className="relative shrink-0 h-full flex">
          <Sidebar 
            currentPage={currentPage} 
            navigate={navigate} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50 dark:bg-gray-950">
        {/* Top Floating / Minimal Bar with Burger Menu & Bright/Dark Mode Toggle */}
        <div className="h-11 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              title={isSidebarOpen ? 'Hide Menu' : 'Show Menu (Burger)'}
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden sm:inline">
                {isSidebarOpen ? 'Hide Menu' : 'Menu'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Bright / Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-2.5 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-medium border border-gray-200 dark:border-gray-700"
              title={isDarkMode ? 'Switch to Bright Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bright Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <div className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate hidden md:inline">
              Skill Nexus &bull; {currentPage.replace('/', ' > ')}
            </div>
          </div>
        </div>

        {/* Page Inner Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Student Routes */}
          {currentPage === 'student/dashboard' && <StudentDashboard navigate={navigate} />}
          {currentPage === 'student/profile' && <StudentProfile navigate={navigate} />}
          {currentPage === 'student/courses' && <CourseCatalog />}
          {currentPage === 'student/resume' && (
            <ResumeBuilder 
              isSidebarOpen={isSidebarOpen} 
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            />
          )}
          {currentPage === 'student/skills' && <TrendingSkills onNavigate={navigate} />}
          {currentPage === 'student/skill-detail' && <SkillDetail skillId={currentParams.skillId} onNavigate={navigate} />}
          {currentPage === 'student/quiz' && <Quiz skillId={currentParams.skillId} onNavigate={navigate} />}
          {currentPage === 'student/jobs' && <JobDiscovery onNavigate={navigate} currentParams={currentParams} />}
          {currentPage === 'student/recommended-jobs' && <RecommendedJobs onNavigate={navigate} />}
          {currentPage === 'student/job-detail' && <JobDetail jobId={currentParams.jobId} onNavigate={navigate} />}
          {currentPage === 'student/saved-jobs' && <SavedJobs onNavigate={navigate} />}
          {currentPage === 'student/alerts' && <JobAlerts onNavigate={navigate} />}
          
          {/* Employer Routes */}
          {currentPage === 'employer/dashboard' && <EmployerDashboard navigate={navigate} />}
          {currentPage === 'employer/profile' && <EmployerProfile />}
          {currentPage === 'employer/jobs' && <JobPostings />}
          {currentPage === 'employer/candidates' && <CandidatesPage />}
          {currentPage === 'employer/feedback' && <FeedbackPage />}
          {currentPage === 'employer/consultations' && <ConsultationsPage />}
          {currentPage === 'employer/institutes' && <InstitutesPage />}

          {/* Admin Routes */}
          {currentPage === 'admin/dashboard' && <AdminDashboard navigate={navigate} />}
          {currentPage === 'admin/districts' && <AdminDistricts />}
          {currentPage === 'admin/courses' && <AdminCourses />}
          {currentPage === 'admin/enrollments' && <AdminEnrollments />}
          {currentPage === 'admin/trainers' && <AdminTrainers />}
          {currentPage === 'admin/curriculum' && <AdminCurriculum />}
          {currentPage === 'admin/settings' && <AdminSettings />}

          {/* Trainer Routes */}
          {currentPage === 'trainer/dashboard' && <TrainerDashboard navigate={navigate} />}
          {currentPage === 'trainer/profile' && <TrainerProfile />}
          {currentPage === 'trainer/courses' && <TrainerCourses />}
          {currentPage === 'trainer/enrollments' && <TrainerEnrollments />}
          {currentPage === 'trainer/password' && <TrainerChangePassword />}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
