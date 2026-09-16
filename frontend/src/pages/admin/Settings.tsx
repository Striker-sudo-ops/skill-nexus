import { useState } from 'react';
import { Card } from '../../components/ui';
import { Settings, Globe, Bell, Shield, Palette, Save, CheckCircle2 } from 'lucide-react';

export default function AdminSettings() {
  const [saved, setSaved] = useState(false);
  const [portalName, setPortalName] = useState('Skill Nexus');
  const [contactEmail, setContactEmail] = useState('admin@skillnexus.in');
  const [features, setFeatures] = useState({
    studentRegistration: true,
    employerAccess: true,
    courseEnrollment: true,
    resumeParser: true,
    jobRecommendations: true,
    trainerPortal: true,
  });

  const handleSave = () => {
    // In production, this would call an API endpoint.
    // For now, just show confirmation.
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleFeature = (key: keyof typeof features) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-600" />
          Portal Settings
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Configure system-wide settings for the Skill Nexus platform
        </p>
      </div>

      {/* General Settings */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
          <Globe className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">General Configuration</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Portal Name
            </label>
            <input
              type="text"
              value={portalName}
              onChange={e => setPortalName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Admin Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Feature Toggles */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
          <Shield className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Feature Toggles</h2>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">Enable or disable platform features</span>
        </div>

        <div className="space-y-3">
          {[
            { key: 'studentRegistration', label: 'Student Registration', desc: 'Allow new students to register accounts' },
            { key: 'employerAccess', label: 'Employer Access', desc: 'Employer portal for job posting and candidate search' },
            { key: 'courseEnrollment', label: 'Course Enrollment', desc: 'Students can apply for government skill courses' },
            { key: 'resumeParser', label: 'Resume Parser', desc: 'AI-powered resume parsing and profile extraction' },
            { key: 'jobRecommendations', label: 'Job Recommendations', desc: 'AI job matching for student profiles' },
            { key: 'trainerPortal', label: 'Trainer Portal', desc: 'Trainer login and course management access' },
          ].map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30"
            >
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{item.label}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</div>
              </div>
              <button
                onClick={() => toggleFeature(item.key as keyof typeof features)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ml-4 ${
                  features[item.key as keyof typeof features] ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    features[item.key as keyof typeof features] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
          <Palette className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Dark / Bright mode can be toggled from the top bar. Colour palette is configured at system level and applies portal-wide.
        </p>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-700 dark:text-blue-300">
          Use the Dark Mode / Bright Mode toggle in the top navigation bar to switch themes instantly.
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
          <Bell className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          System notification settings. Email notification integrations can be configured here.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'New enrollment alerts', defaultOn: true },
            { label: 'Trainer provisioning alerts', defaultOn: true },
            { label: 'Skill gap weekly digest', defaultOn: false },
            { label: 'Course completion notifications', defaultOn: false },
          ].map((n, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{n.label}</span>
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.defaultOn ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}`}>
                {n.defaultOn ? 'ON' : 'OFF'}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save */}
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Settings saved
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs cursor-pointer transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
