import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input, Card } from './ui';
import { User, Building2, Shield, Sparkles, X, GraduationCap } from 'lucide-react';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [role, setRole] = useState<'STUDENT' | 'EMPLOYER' | 'ADMIN'>('STUDENT');
  const [formData, setFormData] = useState({ email: '', password: '', full_name: '', company_name: '' });
  const { login, register } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'LOGIN') {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register({ ...formData, role });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAndLogin = async (email: string, pw: string) => {
    setFormData(prev => ({ ...prev, email, password: pw }));
    setError('');
    setLoading(true);
    try {
      await login({ email, password: pw });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
      <Card className="w-full max-w-md p-6 bg-white relative shadow-2xl border border-gray-100 rounded-2xl">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center mx-auto mb-3 font-bold text-lg shadow-md shadow-blue-200">
            SN
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'LOGIN' ? 'Sign in to Skill Nexus' : 'Create an Account'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">Smart Skill Intelligence & Training Platform</p>
        </div>
        
        <div className="flex mb-6 bg-gray-100 p-1 rounded-xl">
          <button 
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${mode === 'LOGIN' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`} 
            onClick={() => { setMode('LOGIN'); setError(''); }}
          >
            Sign In
          </button>
          <button 
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${mode === 'REGISTER' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'}`} 
            onClick={() => { setMode('REGISTER'); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* 1-Click Demo Login Shortcuts */}
        {mode === 'LOGIN' && (
          <div className="mb-5 bg-blue-50/70 border border-blue-100 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>1-Click Demo Access:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => fillAndLogin('demo.student@skillnexus.in', 'Demo@123')}
                className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:border-blue-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => fillAndLogin('demo.employer@skillnexus.in', 'Demo@123')}
                className="py-1.5 px-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-medium text-blue-700 hover:border-blue-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Employer</span>
              </button>
              <button
                type="button"
                onClick={() => fillAndLogin('admin@skillnexus.in', 'Admin@123')}
                className="py-1.5 px-2 bg-white hover:bg-purple-50 border border-purple-200 rounded-lg text-xs font-medium text-purple-700 hover:border-purple-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => fillAndLogin('demo.trainer@skillnexus.in', 'Trainer@123')}
                className="py-1.5 px-2 bg-white hover:bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-800 hover:border-amber-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                <span>Trainer</span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Select Role</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div 
                  className={`p-3 border rounded-xl cursor-pointer text-center transition-all ${role === 'STUDENT' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setRole('STUDENT')}
                >
                  <User className={`w-5 h-5 mx-auto mb-1 ${role === 'STUDENT' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-xs font-medium text-gray-900">Student</div>
                </div>
                <div 
                  className={`p-3 border rounded-xl cursor-pointer text-center transition-all ${role === 'EMPLOYER' ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600/20' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setRole('EMPLOYER')}
                >
                  <Building2 className={`w-5 h-5 mx-auto mb-1 ${role === 'EMPLOYER' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-xs font-medium text-gray-900">Employer</div>
                </div>
                <div 
                  className={`p-3 border rounded-xl cursor-pointer text-center transition-all ${role === 'ADMIN' ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-600/20' : 'border-gray-200 hover:border-gray-300'}`}
                  onClick={() => setRole('ADMIN')}
                >
                  <Shield className={`w-5 h-5 mx-auto mb-1 ${role === 'ADMIN' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div className="text-xs font-medium text-gray-900">Admin</div>
                </div>
              </div>
            </div>
          )}

          {mode === 'REGISTER' && role === 'STUDENT' && (
            <Input label="Full Name" required placeholder="e.g. Rahul Sharma" value={formData.full_name} onChange={(e: any) => setFormData({...formData, full_name: e.target.value})} />
          )}
          {mode === 'REGISTER' && role === 'EMPLOYER' && (
            <Input label="Company Name" required placeholder="e.g. Tata Motors" value={formData.company_name} onChange={(e: any) => setFormData({...formData, company_name: e.target.value})} />
          )}

          <Input label="Email Address" type="email" required placeholder="name@domain.com" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} />
          <Input label="Password" type="password" required placeholder="••••••••" value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full py-2.5">
            {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Sign In' : 'Create Account')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
