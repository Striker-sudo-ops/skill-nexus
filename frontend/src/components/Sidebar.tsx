import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, User, Briefcase, TrendingUp, FileText, 
  Building2, Users, Star, MessageSquare, School, MapPin, 
  BookOpen, GraduationCap, LogOut, ShieldAlert, PanelLeftClose,
  ClipboardList, Settings, Sparkles, Bookmark, Bell, Inbox, Lightbulb
} from 'lucide-react';


export default function Sidebar({ currentPage, navigate, onClose }: { currentPage: string, navigate: (p: string) => void, onClose?: () => void }) {
  const { isStudent, isAdmin, isTrainer, user, logout } = useAuth();

  const studentItems = [
    { id: 'student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'student/profile', icon: User, label: 'My Profile' },
    { id: 'student/courses', icon: BookOpen, label: 'Govt Courses' },
    { id: 'student/inbox', icon: Inbox, label: 'Inbox' },
    { id: 'student/recommended-jobs', icon: Sparkles, label: 'Suggested Jobs' },
    { id: 'student/jobs', icon: Briefcase, label: 'Browse Jobs' },
    { id: 'student/saved-jobs', icon: Bookmark, label: 'Saved Jobs' },
    { id: 'student/alerts', icon: Bell, label: 'Job Alerts' },
    { id: 'student/skills', icon: TrendingUp, label: 'Trending Skills' },
    { id: 'student/resume', icon: FileText, label: 'Resume Builder' },
  ];

  const employerItems = [
    { id: 'employer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'employer/profile', icon: Building2, label: 'Company Profile' },
    { id: 'employer/jobs', icon: Briefcase, label: 'Job Postings' },
    { id: 'employer/inbox', icon: Inbox, label: 'Inbox' },
    { id: 'employer/suggestions', icon: Lightbulb, label: 'Suggestions' },
    { id: 'employer/candidates', icon: Users, label: 'Search Candidates' },
    { id: 'employer/feedback', icon: Star, label: 'Rate Candidates' },
    { id: 'employer/consultations', icon: MessageSquare, label: 'Consultations' },
    { id: 'employer/institutes', icon: School, label: 'Training Institutes' },
  ];

  const adminItems = [
    { id: 'admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'admin/districts', icon: MapPin, label: 'District Intelligence' },
    { id: 'admin/courses', icon: BookOpen, label: 'Courses & Capacity' },
    { id: 'admin/enrollments', icon: ClipboardList, label: 'Enrollment Records' },
    { id: 'admin/trainers', icon: GraduationCap, label: 'Trainer Capability' },
    { id: 'admin/skills', icon: TrendingUp, label: 'Manage Skills' },
    { id: 'admin/jobs', icon: Briefcase, label: 'Manage Jobs' },
    { id: 'admin/suggestions', icon: Lightbulb, label: 'Employer Suggestions' },
    { id: 'admin/settings', icon: Settings, label: 'Settings' },
  ];


  const trainerItems = [
    { id: 'trainer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'trainer/profile', icon: User, label: 'My Profile' },
    { id: 'trainer/courses', icon: BookOpen, label: 'My Assigned Courses' },
    { id: 'trainer/enrollments', icon: Users, label: 'Trainee Enrollments' },
  ];

  let items = studentItems;
  let roleBadge = 'Student';
  let badgeColor = 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';

  if (isAdmin) {
    items = adminItems;
    roleBadge = 'Government Admin';
    badgeColor = 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  } else if (isTrainer) {
    items = trainerItems;
    roleBadge = 'Certified Trainer';
    badgeColor = 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300';
  } else if (!isStudent) {
    items = employerItems;
    roleBadge = 'Employer / Industry';
    badgeColor = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shadow-xs">
      {/* Brand Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs">
            SN
          </div>
          <div>
            <div className="font-bold text-base text-gray-900 dark:text-white leading-tight">Skill Nexus</div>
            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">INTELLIGENCE PLATFORM</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Role Indicator */}
      <div className="px-5 pt-3 pb-1">
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md ${badgeColor}`}>
          {roleBadge}
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                active 
                  ? 'bg-blue-600 text-white shadow-xs font-semibold' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold text-sm shadow-xs">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="font-medium text-xs text-gray-900 dark:text-white truncate">
              {user?.full_name || user?.company_name || user?.email?.split('@')[0]}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/50 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
