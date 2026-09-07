import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  ClipboardList,
  CalendarCheck,
  Package,
  Inbox,
  BarChart3,
  Users,
  ShieldAlert,
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
  FileText,
  Camera,
  User,
  Settings
} from 'lucide-react';

export const Navbar = ({
  activeTab,
  setActiveTab,
  onOpenHelp,
  onOpenQuickRef,
  onOpenScanQR
}) => {
  const { t, i18n } = useTranslation();
  const { user, logout, updateLanguage } = useAuth();

  const [openDropdown, setOpenDropdown] = useState(null); // 'parts' | 'admin' | 'profile' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Close dropdowns when clicking outside
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 bg-red-950 text-red-300 border border-red-800/80 text-[10px] px-2 py-0.5 rounded-full font-semibold">
            <Shield size={10} /> {t('roles.admin')}
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-950 text-purple-300 border border-purple-800/80 text-[10px] px-2 py-0.5 rounded-full font-semibold">
            <Shield size={10} /> {t('roles.manager')}
          </span>
        );
      case 'technician':
        return (
          <span className="inline-flex items-center gap-1 bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-[10px] px-2 py-0.5 rounded-full font-semibold">
            <Wrench size={10} /> {t('roles.technician')}
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-950 text-amber-300 border border-amber-800/80 text-[10px] px-2 py-0.5 rounded-full font-semibold">
            <HardHat size={10} /> {t('roles.operator')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full font-semibold">
            <Eye size={10} /> {t('roles.viewer')}
          </span>
        );
    }
  };

  const isPartsActive = ['parts-requests', 'parts-catalog'].includes(activeTab);
  const isAdminActive = ['analytics', 'users', 'audit-log'].includes(activeTab);

  const getInitial = (name) => {
    return (name || 'U')[0].toUpperCase();
  };

  return (
    <header
      className="bg-slate-950/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-md shadow-black/30"
      ref={navRef}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* Brand Logo & Plant Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
            onClick={() => handleTabClick(user?.role === 'operator' ? 'equipment' : 'dashboard')}
            title="Custom Glass Industries, Inc."
          >
            <img
              src="/cgi_logo.png"
              alt="Custom Glass Industries, Inc."
              className="h-7 sm:h-8 w-auto object-contain brightness-110 drop-shadow-sm transition hover:opacity-90"
            />
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-cyan-800/60 hidden sm:inline">
                Anaheim
              </span>
              <span className="text-slate-300 text-xs font-bold tracking-wide font-mono">
                PM PORTAL
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            
            {/* Operator Direct Simplified Tabs (Only 3 essential tabs) */}
            {user?.role === 'operator' ? (
              <>
                <button
                  onClick={() => handleTabClick('equipment')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    activeTab === 'equipment'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Cpu size={14} className={activeTab === 'equipment' ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.my_equipment')}</span>
                </button>

                <button
                  onClick={() => handleTabClick('work-orders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    activeTab === 'work-orders'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <ClipboardList size={14} className={activeTab === 'work-orders' ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.work_orders')}</span>
                </button>

                <button
                  onClick={() => handleTabClick('parts-requests')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    activeTab === 'parts-requests'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Inbox size={14} className={activeTab === 'parts-requests' ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.parts_requests')}</span>
                </button>
              </>
            ) : (
              /* Non-Operator Navigation: Direct Core Tabs + Clean Dropdowns */
              <>
                {/* 1. Wallboard */}
                <button
                  onClick={() => handleTabClick('dashboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    activeTab === 'dashboard'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <LayoutDashboard size={14} className={activeTab === 'dashboard' ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.dashboard')}</span>
                </button>

                {/* 2. Equipment */}
                <button
                  onClick={() => handleTabClick('equipment')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    activeTab === 'equipment'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <Cpu size={14} className={activeTab === 'equipment' ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.equipment')}</span>
                </button>

                {/* 3. Work Orders (Direct 1-Click Access) */}
                <button
                  onClick={() => handleTabClick('work-orders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    activeTab === 'work-orders'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <ClipboardList size={14} className={activeTab === 'work-orders' ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.work_orders')}</span>
                </button>

                {/* 4. PM Schedules (Direct 1-Click Access) */}
                <button
                  onClick={() => handleTabClick('pm-schedules')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                    activeTab === 'pm-schedules'
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  <CalendarCheck size={14} className={activeTab === 'pm-schedules' ? 'text-cyan-400' : 'text-slate-400'} />
                  <span>{t('nav.pm_schedules')}</span>
                </button>

                {/* 5. Parts & Supplies (Requests + Inventory) */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'parts' ? null : 'parts')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                      isPartsActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <Package size={14} className={isPartsActive ? 'text-cyan-400' : 'text-slate-400'} />
                    <span>{t('nav.group_parts')}</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-150 ${
                        openDropdown === 'parts' ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                  </button>

                  {openDropdown === 'parts' && (
                    <div className="absolute left-0 mt-1.5 w-48 bg-slate-900/98 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => handleTabClick('parts-requests')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                          activeTab === 'parts-requests'
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Inbox size={14} className="text-cyan-400" />
                        <span>{t('nav.parts_requests')}</span>
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
                        <span>{t('nav.parts_catalog')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Admin & Management (For Admins and Managers) */}
                {['admin', 'manager'].includes(user?.role) && (
                  <div className="relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'admin' ? null : 'admin')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                        isAdminActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <Settings size={14} className={isAdminActive ? 'text-cyan-400' : 'text-slate-400'} />
                      <span>{t('nav.group_management')}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-150 ${
                          openDropdown === 'admin' ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                        }`}
                      />
                    </button>

                    {openDropdown === 'admin' && (
                      <div className="absolute left-0 mt-1.5 w-52 bg-slate-900/98 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => handleTabClick('analytics')}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                            activeTab === 'analytics'
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <BarChart3 size={14} className="text-cyan-400" />
                          <span>{t('nav.analytics')}</span>
                        </button>

                        <button
                          onClick={() => handleTabClick('users')}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                            activeTab === 'users'
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <Users size={14} className="text-cyan-400" />
                          <span>{t('nav.users')}</span>
                        </button>

                        <button
                          onClick={() => handleTabClick('audit-log')}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                            activeTab === 'audit-log'
                              ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          <ShieldAlert size={14} className="text-cyan-400" />
                          <span>{t('nav.audit_log')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </nav>

          {/* Right Action Bar: Streamlined & Minimalist */}
          <div className="flex items-center gap-2">
            
            {/* Quick QR Scanner Icon Button */}
            <button
              onClick={onOpenScanQR}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-900 rounded-lg transition"
              title={t('qr.scanner_title')}
            >
              <Camera size={16} />
            </button>

            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 font-mono transition"
              title="Switch language (EN / ES)"
            >
              <Globe size={13} className="text-cyan-400" />
              <span className="font-bold uppercase text-[11px]">{i18n.language}</span>
            </button>

            {/* Unified User Profile Dropdown (Replaces multiple individual buttons) */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-xs font-bold text-cyan-300">
                  {getInitial(user?.full_name)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-none truncate max-w-[100px]">
                    {user?.full_name?.split(' ')[0]}
                  </div>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-slate-400 transition-transform duration-150 ${
                    openDropdown === 'profile' ? 'rotate-180 text-cyan-400' : ''
                  }`}
                />
              </button>

              {openDropdown === 'profile' && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900/98 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* User Profile Header */}
                  <div className="p-2.5 mb-1.5 border-b border-slate-800/80">
                    <div className="text-xs font-bold text-white truncate">
                      {user?.full_name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {user?.email}
                    </div>
                    <div className="mt-2">{getRoleBadge(user?.role)}</div>
                  </div>

                  {/* Help & Support Actions */}
                  <div className="space-y-0.5 py-1">
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        if (onOpenHelp) onOpenHelp();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <HelpCircle size={14} className="text-cyan-400" />
                      <span>{t('common.help')}</span>
                    </button>

                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        if (onOpenQuickRef) onOpenQuickRef();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    >
                      <FileText size={14} className="text-amber-400" />
                      <span>{t('quickref.modal_title')}</span>
                    </button>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-1.5 border-t border-slate-800/80 mt-1">
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition"
                    >
                      <LogOut size={14} />
                      <span>{t('nav.logout')}</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer (Clean & Organized) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-950/98 px-4 py-4 space-y-1 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          <div className="px-2 pb-3 mb-2 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{user?.full_name}</div>
              <div className="text-[11px] text-slate-400 font-mono">{user?.email}</div>
            </div>
            <div>{getRoleBadge(user?.role)}</div>
          </div>

          {/* Navigation Links for Mobile */}
          {user?.role === 'operator' ? (
            <>
              <button
                onClick={() => handleTabClick('equipment')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'equipment' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Cpu size={16} className="text-cyan-400" />
                <span>{t('nav.my_equipment')}</span>
              </button>

              <button
                onClick={() => handleTabClick('work-orders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'work-orders' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <ClipboardList size={16} className="text-cyan-400" />
                <span>{t('nav.work_orders')}</span>
              </button>

              <button
                onClick={() => handleTabClick('parts-requests')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'parts-requests' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Inbox size={16} className="text-cyan-400" />
                <span>{t('nav.parts_requests')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'dashboard' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard size={16} className="text-cyan-400" />
                <span>{t('nav.dashboard')}</span>
              </button>

              <button
                onClick={() => handleTabClick('equipment')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'equipment' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Cpu size={16} className="text-cyan-400" />
                <span>{t('nav.equipment')}</span>
              </button>

              <button
                onClick={() => handleTabClick('work-orders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'work-orders' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <ClipboardList size={16} className="text-cyan-400" />
                <span>{t('nav.work_orders')}</span>
              </button>

              <button
                onClick={() => handleTabClick('pm-schedules')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'pm-schedules' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <CalendarCheck size={16} className="text-cyan-400" />
                <span>{t('nav.pm_schedules')}</span>
              </button>

              <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                {t('nav.group_parts')}
              </div>

              <button
                onClick={() => handleTabClick('parts-requests')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'parts-requests' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Inbox size={16} className="text-cyan-400" />
                <span>{t('nav.parts_requests')}</span>
              </button>

              <button
                onClick={() => handleTabClick('parts-catalog')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'parts-catalog' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Package size={16} className="text-cyan-400" />
                <span>{t('nav.parts_catalog')}</span>
              </button>

              {['admin', 'manager'].includes(user?.role) && (
                <>
                  <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    {t('nav.group_management')}
                  </div>

                  <button
                    onClick={() => handleTabClick('analytics')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'analytics' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <BarChart3 size={16} className="text-cyan-400" />
                    <span>{t('nav.analytics')}</span>
                  </button>

                  <button
                    onClick={() => handleTabClick('users')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'users' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <Users size={16} className="text-cyan-400" />
                    <span>{t('nav.users')}</span>
                  </button>

                  <button
                    onClick={() => handleTabClick('audit-log')}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      activeTab === 'audit-log' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <ShieldAlert size={16} className="text-cyan-400" />
                    <span>{t('nav.audit_log')}</span>
                  </button>
                </>
              )}
            </>
          )}

          {/* Quick Utility Actions in Mobile */}
          <div className="pt-3 border-t border-slate-800/80 mt-2 space-y-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenScanQR) onOpenScanQR();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 hover:bg-cyan-950/40 transition"
            >
              <Camera size={16} className="text-cyan-400" />
              <span>{t('nav.scan_qr')}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenHelp) onOpenHelp();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-900 transition"
            >
              <HelpCircle size={16} className="text-cyan-400" />
              <span>{t('common.help')}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenQuickRef) onOpenQuickRef();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-amber-300 hover:bg-amber-950/40 transition"
            >
              <FileText size={16} className="text-amber-400" />
              <span>{t('quickref.modal_title')}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-950/30 transition"
            >
              <LogOut size={16} />
              <span>{t('nav.logout')}</span>
            </button>
          </div>

        </div>
      )}
    </header>
  );
};
