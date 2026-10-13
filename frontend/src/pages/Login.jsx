import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const demoCredentials = {
  super_admin: { email: 'superadmin@school.com', password: 'SuperAdmin123!' },
  school_admin: { email: 'admin@school.com', password: 'Admin123!' },
  accountant: { email: 'accountant@school.com', password: 'Accountant123!' },
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDemoRole, setSelectedDemoRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleFillDemo = (roleKey) => {
    setSelectedDemoRole(roleKey);
    const creds = demoCredentials[roleKey];
    setEmail(creds.email);
    setPassword(creds.password);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials or connection error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-center items-center px-4 select-none relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-2xl shadow-xl shadow-blue-500/20 mb-3">
            B
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BSO School System</h1>
          <p className="text-xs text-slate-400 mt-1">Management & Fee Billing Enterprise Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-7 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-semibold text-white">System Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5">Enter your credentials to access the workspace</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>

          {/* Quick Role Fillers */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-blue-400" /> Quick Role Login:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800">
              {[
                { id: 'super_admin', label: 'Super Admin' },
                { id: 'school_admin', label: 'School Admin' },
                { id: 'accountant', label: 'Accountant' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleFillDemo(r.id)}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    selectedDemoRole === r.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-xl pl-9 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          BSO School Management System &bull; Version 1.0.0 &bull; Phase 2 Authentication
        </p>
      </div>
    </div>
  );
}
