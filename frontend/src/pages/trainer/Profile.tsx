import { useState, useEffect } from 'react';
import { getTrainerProfile, changePassword } from '../../services/api';
import { Card, Spinner } from '../../components/ui';
import { User, Mail, MapPin, Award, BookOpen, KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TrainerProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getTrainerProfile()
      .then(res => setProfile(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      await changePassword({ current_password: currentPwd, new_password: newPwd });
      setPwdMsg({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to change password.' });
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your trainer account details and credentials</p>
      </div>

      {/* Profile Card */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 space-y-6">
        {/* Avatar + Name */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow">
            {profile?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.name || '—'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
                {profile?.trainer_code || '—'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Certified Trainer</span>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Email</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{profile?.email || '—'}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
            <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Domain / Specialization</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{profile?.domain || '—'}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Location</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                {profile?.district ? `${profile.district}, ${profile?.state || ''}` : '—'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 bg-gray-50 dark:bg-gray-700/40 rounded-xl">
            <Award className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Capability Score</div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{profile?.capability_score ?? '—'}</div>
                {profile?.needs_upskilling && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded">
                    Upskill Recommended
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {profile?.skills && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills</div>
            <div className="flex flex-wrap gap-2">
              {profile.skills.split(',').map((s: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-medium"
                >
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Courses */}
        {profile?.courses_assigned && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Assigned Courses</div>
            <div className="flex flex-wrap gap-2">
              {profile.courses_assigned.split(',').map((c: string, i: number) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-mono font-bold"
                >
                  {c.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Change Password Section */}
      <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-700">
          <KeyRound className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { label: 'Current Password', val: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New Password', val: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(v => !v) },
            { label: 'Confirm New Password', val: confirmPwd, set: setConfirmPwd, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                {field.label}
              </label>
              <div className="relative">
                <input
                  type={field.show ? 'text' : 'password'}
                  value={field.val}
                  onChange={e => field.set(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={field.toggle}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          {pwdMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
              pwdMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}>
              {pwdMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              {pwdMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pwdLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60"
          >
            {pwdLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Card>
    </div>
  );
}
