import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Wrench, Globe, LogOut, User, Shield, HardHat, Eye } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateLanguage } = useAuth();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'es' : 'en';
    updateLanguage(nextLang);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-300 border border-red-700/50 text-xs px-2.5 py-0.5 rounded-full font-medium"><Shield size={12} /> {t('roles.admin')}</span>;
      case 'manager':
        return <span className="inline-flex items-center gap-1 bg-purple-900/40 text-purple-300 border border-purple-700/50 text-xs px-2.5 py-0.5 rounded-full font-medium"><Shield size={12} /> {t('roles.manager')}</span>;
      case 'technician':
        return <span className="inline-flex items-center gap-1 bg-blue-900/40 text-blue-300 border border-blue-700/50 text-xs px-2.5 py-0.5 rounded-full font-medium"><Wrench size={12} /> {t('roles.technician')}</span>;
      case 'operator':
        return <span className="inline-flex items-center gap-1 bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 text-xs px-2.5 py-0.5 rounded-full font-medium"><HardHat size={12} /> {t('roles.operator')}</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium"><Eye size={12} /> {t('roles.viewer')}</span>;
    }
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Plant Title */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/20 p-2 rounded-lg border border-emerald-500/30 text-emerald-400">
              <Wrench size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-lg">CGI</span>
                <span className="text-slate-400 font-semibold text-sm tracking-wide">PM PORTAL</span>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border border-emerald-800">
                  Anaheim Plant
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t('nav.tagline')}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'equipment'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {user?.role === 'operator' ? t('nav.my_equipment') : t('nav.equipment')}
            </button>

            <button
              onClick={() => setActiveTab('work-orders')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'work-orders'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t('nav.work_orders')}
            </button>

            <button
              onClick={() => setActiveTab('pm-schedules')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'pm-schedules'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t('nav.pm_schedules')}
            </button>

            <button
              onClick={() => setActiveTab('parts-requests')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'parts-requests'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t('nav.parts_requests')}
            </button>

            <button
              onClick={() => setActiveTab('parts-catalog')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                activeTab === 'parts-catalog'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {t('nav.parts_catalog')}
            </button>

            {['admin', 'manager'].includes(user?.role) && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === 'users'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t('nav.users')}
              </button>
            )}
          </nav>

          {/* Right Action Bar: Language Toggle & User Profile */}
          <div className="flex items-center gap-3">
            {/* Bilingual Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-md border border-slate-700 transition"
              title="Switch language (Cambiar idioma)"
            >
              <Globe size={14} className="text-emerald-400" />
              <span className="font-semibold uppercase font-mono">{i18n.language}</span>
              <span className="text-slate-400 text-[10px]">
                {i18n.language === 'en' ? 'ES' : 'EN'}
              </span>
            </button>

            {/* User details */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-200">{user?.full_name}</div>
                <div>{getRoleBadge(user?.role)}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-md border border-transparent hover:border-red-800/40 transition"
              title={t('nav.logout')}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
