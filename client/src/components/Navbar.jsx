import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  ClipboardList,
  CalendarCheck,
  Inbox,
  Package,
  BarChart3,
  Users,
  ChevronDown,
  Menu,
  X,
  Globe,
  LogOut,
  Shield,
  HardHat,
  Eye,
  Wrench,
  HelpCircle,
  FileText
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenHelp, onOpenQuickRef }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateLanguage } = useAuth();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'es' : 'en';
    updateLanguage(nextLang);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-red-900/40 text-red-300 border border-red-700/50 text-[11px] px-2 py-0.5 rounded-full font-medium">
            <Shield size={11} /> {t('roles.admin')}
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-900/40 text-purple-300 border border-purple-700/50 text-[11px] px-2 py-0.5 rounded-full font-medium">
            <Shield size={11} /> {t('roles.manager')}
          </span>
        );
      case 'technician':
        return (
          <span className="inline-flex items-center gap-1 bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 text-[11px] px-2 py-0.5 rounded-full font-medium">
            <Wrench size={11} /> {t('roles.technician')}
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-900/40 text-amber-300 border border-amber-700/50 text-[11px] px-2 py-0.5 rounded-full font-medium">
            <HardHat size={11} /> {t('roles.operator')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-[11px] px-2 py-0.5 rounded-full font-medium">
            <Eye size={11} /> {t('roles.viewer')}
          </span>
        );
    }
  };

  const isMaintenanceActive = ['work-orders', 'pm-schedules'].includes(activeTab);
  const isPartsActive = ['parts-requests', 'parts-catalog'].includes(activeTab);
  const isManagementActive = ['analytics', 'users'].includes(activeTab);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-lg shadow-black/20" ref={navRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Plant Title */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => handleTabClick(user?.role === 'operator' ? 'equipment' : 'dashboard')}
            title="Custom Glass Industries, Inc."
          >
            <img
              src="/cgi_logo.png"
              alt="Custom Glass Industries, Inc."
              className="h-8 md:h-9 w-auto object-contain brightness-110 drop-shadow-sm group-hover:opacity-90 transition"
            />
            <div className="hidden sm:flex flex-col pl-2 border-l border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="bg-cyan-950/90 text-cyan-300 text-[10px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-cyan-800/60">
                  Anaheim Plant
                </span>
                <span className="text-slate-400 text-xs font-semibold tracking-wide">
                  PM PORTAL
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Wallboard (direct tab) */}
            {user?.role !== 'operator' && (
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  activeTab === 'dashboard'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <LayoutDashboard size={14} className={activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'} />
                <span>{t('nav.dashboard')}</span>
              </button>
            )}

            {/* Machinery / Equipment Registry */}
            <button
              onClick={() => handleTabClick('equipment')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                activeTab === 'equipment'
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
              }`}
            >
              <Cpu size={14} className={activeTab === 'equipment' ? 'text-cyan-400' : 'text-slate-400'} />
              <span>{user?.role === 'operator' ? t('nav.my_equipment') : t('nav.equipment')}</span>
            </button>

            {/* Group: Maintenance (Work Orders + PM Schedules) */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'maintenance' ? null : 'maintenance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  isMaintenanceActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <ClipboardList size={14} className={isMaintenanceActive ? 'text-cyan-400' : 'text-slate-400'} />
                <span>{t('nav.group_maintenance')}</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${openDropdown === 'maintenance' ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`}
                />
              </button>

              {openDropdown === 'maintenance' && (
                <div className="absolute left-0 mt-1.5 w-52 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50">
                  <button
                    onClick={() => handleTabClick('work-orders')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      activeTab === 'work-orders'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <ClipboardList size={14} className="text-cyan-400" />
                    <div className="text-left">
                      <div>{t('nav.work_orders')}</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTabClick('pm-schedules')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      activeTab === 'pm-schedules'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <CalendarCheck size={14} className="text-cyan-400" />
                    <div className="text-left">
                      <div>{t('nav.pm_schedules')}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Group: Parts & Supplies (Requests + Inventory) */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'parts' ? null : 'parts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  isPartsActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                }`}
              >
                <Package size={14} className={isPartsActive ? 'text-cyan-400' : 'text-slate-400'} />
                <span>{t('nav.group_parts')}</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-150 ${openDropdown === 'parts' ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`}
                />
              </button>

              {openDropdown === 'parts' && (
                <div className="absolute left-0 mt-1.5 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50">
                  <button
                    onClick={() => handleTabClick('parts-requests')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      activeTab === 'parts-requests'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Inbox size={14} className="text-cyan-400" />
                    <div className="text-left">
                      <div>{t('nav.parts_requests')}</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleTabClick('parts-catalog')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                      activeTab === 'parts-catalog'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Package size={14} className="text-cyan-400" />
                    <div className="text-left">
                      <div>{t('nav.parts_catalog')}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Group: Management (Analytics + Users) for Admins/Managers/Techs */}
            {['admin', 'manager', 'technician'].includes(user?.role) && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'management' ? null : 'management')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    isManagementActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <BarChart3 size={14} className={isManagementActive ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.group_management')}</span>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-150 ${openDropdown === 'management' ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`}
                  />
                </button>

                {openDropdown === 'management' && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50">
                    <button
                      onClick={() => handleTabClick('analytics')}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        activeTab === 'analytics'
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <BarChart3 size={14} className="text-cyan-400" />
                      <div className="text-left">
                        <div>{t('nav.analytics')}</div>
                      </div>
                    </button>

                    {['admin', 'manager'].includes(user?.role) && (
                      <button
                        onClick={() => handleTabClick('users')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          activeTab === 'users'
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Users size={14} className="text-cyan-400" />
                        <div className="text-left">
                          <div>{t('nav.users')}</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Right Action Bar: Language Toggle, User Profile, and Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Contextual Help Panel Trigger */}
            <button
              onClick={onOpenHelp}
              className="flex items-center gap-1.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-cyan-200 text-xs px-2.5 py-1.5 rounded-lg border border-cyan-800/60 hover:border-cyan-500/60 transition shadow-sm"
              title={t('common.help')}
            >
              <HelpCircle size={14} className="text-cyan-400" />
              <span className="font-semibold hidden sm:inline">{t('common.help')}</span>
            </button>

            {/* Bilingual Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              title="Switch language (Cambiar idioma)"
            >
              <Globe size={14} className="text-cyan-400" />
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
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg border border-transparent hover:border-red-800/40 transition"
              title={t('nav.logout')}
            >
              <LogOut size={16} />
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-4 space-y-1 shadow-2xl">
          <div className="px-2 pb-2 mb-2 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white">{user?.full_name}</div>
              <div className="text-[11px] text-slate-400">{user?.email}</div>
            </div>
            <div>{getRoleBadge(user?.role)}</div>
          </div>

          {user?.role !== 'operator' && (
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard size={16} className="text-cyan-400" />
              <span>{t('nav.dashboard')}</span>
            </button>
          )}

          <button
            onClick={() => handleTabClick('equipment')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'equipment'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Cpu size={16} className="text-cyan-400" />
            <span>{user?.role === 'operator' ? t('nav.my_equipment') : t('nav.equipment')}</span>
          </button>

          <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('nav.group_maintenance')}
          </div>

          <button
            onClick={() => handleTabClick('work-orders')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'work-orders'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <ClipboardList size={16} className="text-cyan-400" />
            <span>{t('nav.work_orders')}</span>
          </button>

          <button
            onClick={() => handleTabClick('pm-schedules')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'pm-schedules'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <CalendarCheck size={16} className="text-cyan-400" />
            <span>{t('nav.pm_schedules')}</span>
          </button>

          <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('nav.group_parts')}
          </div>

          <button
            onClick={() => handleTabClick('parts-requests')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'parts-requests'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Inbox size={16} className="text-cyan-400" />
            <span>{t('nav.parts_requests')}</span>
          </button>

          <button
            onClick={() => handleTabClick('parts-catalog')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'parts-catalog'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Package size={16} className="text-cyan-400" />
            <span>{t('nav.parts_catalog')}</span>
          </button>

          {['admin', 'manager', 'technician'].includes(user?.role) && (
            <>
              <div className="pt-2 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('nav.group_management')}
              </div>

              <button
                onClick={() => handleTabClick('analytics')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'analytics'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <BarChart3 size={16} className="text-cyan-400" />
                <span>{t('nav.analytics')}</span>
              </button>

              {['admin', 'manager'].includes(user?.role) && (
                <button
                  onClick={() => handleTabClick('users')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'users'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Users size={16} className="text-cyan-400" />
                  <span>{t('nav.users')}</span>
                </button>
              )}
            </>
          )}

          {/* Help & Quick-Ref in Mobile Menu */}
          <div className="pt-2 border-t border-slate-800/80 mt-2 space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenHelp) onOpenHelp();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40 border border-cyan-900/40 transition"
            >
              <HelpCircle size={16} className="text-cyan-400" />
              <span>{t('common.help')}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenQuickRef) onOpenQuickRef();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-950/40 border border-amber-900/40 transition"
            >
              <FileText size={16} className="text-amber-400" />
              <span>{t('quickref.modal_title')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

