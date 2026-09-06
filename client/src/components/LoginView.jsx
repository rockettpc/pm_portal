import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Wrench, Shield, Lock, User, Globe, HardHat, CheckCircle } from 'lucide-react';

export const LoginView = () => {
  const { t, i18n } = useTranslation();
  const { login, updateLanguage } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || t('auth.invalid_creds'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (userVal, passVal) => {
    setUsername(userVal);
    setPassword(passVal);
    setError('');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'es' : 'en';
    updateLanguage(nextLang);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6">
      {/* Background ambient lighting matching CGI Cyan / Oceanic Blue */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Top Header & Language switcher */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-1 rounded-md tracking-wider">
              ANAHEIM GLASS PLANT
            </span>
          </div>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-2.5 py-1.5 rounded-md border border-slate-800 hover:border-slate-700 transition"
          >
            <Globe size={14} className="text-cyan-400" />
            <span className="font-semibold uppercase font-mono">{i18n.language === 'en' ? 'Español' : 'English'}</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img
                src="/cgi_logo.png"
                alt="Custom Glass Industries, Inc."
                className="h-16 sm:h-20 w-auto object-contain brightness-110 drop-shadow-md"
              />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {t('auth.title')}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {t('auth.subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-start gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('auth.login_field')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  placeholder="admin or user@cgi.internal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('auth.password_field')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-cyan-900/30 transition flex justify-center items-center gap-2 disabled:opacity-50 font-semibold"
            >
              {submitting ? t('auth.logging_in') : t('auth.login_btn')}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <CheckCircle size={14} className="text-cyan-400" />
              {t('auth.demo_title')}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin123')}
                className={`text-left p-2 rounded border transition ${
                  username === 'admin'
                    ? 'bg-slate-800 border-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1 text-red-400">
                  <Shield size={12} /> Admin
                </div>
                <div className="text-[10px] text-slate-500 font-mono">admin / admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('manager', 'manager123')}
                className={`text-left p-2 rounded border transition ${
                  username === 'manager'
                    ? 'bg-slate-800 border-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1 text-purple-400">
                  <Shield size={12} /> Manager (ES)
                </div>
                <div className="text-[10px] text-slate-500 font-mono">manager / manager123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('technician', 'tech123')}
                className={`text-left p-2 rounded border transition ${
                  username === 'technician'
                    ? 'bg-slate-800 border-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1 text-cyan-400">
                  <Wrench size={12} /> Technician
                </div>
                <div className="text-[10px] text-slate-500 font-mono">tech / tech123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('operator1', 'operator123')}
                className={`text-left p-2 rounded border transition ${
                  username === 'operator1'
                    ? 'bg-slate-800 border-cyan-500 text-white'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="font-bold flex items-center gap-1 text-amber-400">
                  <HardHat size={12} /> Operator (Scoped)
                </div>
                <div className="text-[10px] text-slate-500 font-mono">operator1 / operator123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
