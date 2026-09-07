import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  HelpCircle,
  X,
  Compass,
  FileText,
  ChevronDown,
  ChevronRight,
  Shield,
  HardHat,
  Wrench,
  Eye,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  BookOpen
} from 'lucide-react';

export const HelpPanel = ({
  isOpen,
  onClose,
  activeTab,
  onStartTour,
  onOpenQuickRef
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Selected module in help panel (defaults to current tab)
  const [selectedModule, setSelectedModule] = useState(activeTab || 'dashboard');
  const [expandedTask, setExpandedTask] = useState(0);

  // Synchronize when activeTab changes
  useEffect(() => {
    if (activeTab) {
      setSelectedModule(activeTab);
      setExpandedTask(0);
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  const moduleKey = selectedModule ? selectedModule.replace(/-/g, '_') : 'dashboard';
  const moduleData = t(`help.modules.${moduleKey}`, { returnObjects: true }) || {};

  const availableModules = [
    { id: 'dashboard', label: t('nav.dashboard'), roles: ['admin', 'manager', 'technician', 'viewer'] },
    { id: 'equipment', label: t('nav.equipment'), roles: ['admin', 'manager', 'technician', 'operator', 'viewer'] },
    { id: 'work-orders', label: t('nav.work_orders'), roles: ['admin', 'manager', 'technician', 'operator', 'viewer'] },
    { id: 'pm-schedules', label: t('nav.pm_schedules'), roles: ['admin', 'manager', 'technician', 'operator', 'viewer'] },
    { id: 'parts-requests', label: t('nav.parts_requests'), roles: ['admin', 'manager', 'technician', 'operator', 'viewer'] },
    { id: 'parts-catalog', label: t('nav.parts_catalog'), roles: ['admin', 'manager', 'technician', 'operator', 'viewer'] },
    { id: 'analytics', label: t('nav.analytics'), roles: ['admin', 'manager', 'technician'] },
    { id: 'users', label: t('nav.users'), roles: ['admin', 'manager'] },
  ].filter(m => !user?.role || m.roles.includes(user.role) || ['admin', 'manager'].includes(user?.role));

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

  const getRoleExplanation = () => {
    switch (user?.role) {
      case 'operator':
        return t('help.role_operator');
      case 'technician':
        return t('help.role_technician');
      case 'manager':
      case 'admin':
        return t('help.role_manager');
      default:
        return t('help.role_viewer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Slide-over Drawer */}
      <div className="relative w-full max-w-xl bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {t('help.panel_title')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('help.panel_subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            aria-label="Close Help Panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* User Role Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-slate-400 font-mono uppercase tracking-wider">
                {t('help.your_role')}
              </span>
              <div>{getRoleBadge(user?.role)}</div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {getRoleExplanation()}
            </p>
          </div>

          {/* Quick Learning Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('help.actions_heading')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Guided Walkthrough Button */}
              <button
                onClick={() => {
                  onClose();
                  if (onStartTour) onStartTour(selectedModule);
                }}
                className="flex items-start gap-3 p-3 bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/50 hover:border-cyan-500/60 rounded-xl text-left transition group"
              >
                <Compass className="text-cyan-400 mt-0.5 group-hover:scale-110 transition" size={18} />
                <div>
                  <div className="text-xs font-bold text-cyan-300">
                    {t('help.tour_button')}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    {t('help.tour_button_sub')}
                  </div>
                </div>
              </button>

              {/* Quick-Reference Card Button */}
              <button
                onClick={() => {
                  if (onOpenQuickRef) onOpenQuickRef();
                }}
                className="flex items-start gap-3 p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition group"
              >
                <FileText className="text-amber-400 mt-0.5 group-hover:scale-110 transition" size={18} />
                <div>
                  <div className="text-xs font-bold text-amber-300">
                    {t('help.quickref_button')}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                    {t('help.quickref_button_sub')}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Module Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t('help.select_module')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {availableModules.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => {
                    setSelectedModule(mod.id);
                    setExpandedTask(0);
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold text-center truncate transition ${
                    selectedModule === mod.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800/80'
                  }`}
                  title={mod.label}
                >
                  {mod.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current Module Overview */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="text-sm font-bold text-white">
                {moduleData?.name || selectedModule}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {moduleData?.summary}
            </p>
          </div>

          {/* How Do I... Tasks Accordion */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>{t('help.tasks_heading')}</span>
              <span className="text-[11px] text-cyan-400 font-mono">
                {Array.isArray(moduleData?.tasks) ? moduleData.tasks.length : 0} Guides
              </span>
            </h3>

            {Array.isArray(moduleData?.tasks) && moduleData.tasks.length > 0 ? (
              moduleData.tasks.map((task, idx) => {
                const isExpanded = expandedTask === idx;
                return (
                  <div
                    key={idx}
                    className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden transition"
                  >
                    {/* Accordion Trigger */}
                    <button
                      onClick={() => setExpandedTask(isExpanded ? -1 : idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-2.5 pr-2">
                        <CheckCircle2
                          size={15}
                          className={isExpanded ? 'text-cyan-400' : 'text-slate-500'}
                        />
                        <span className="text-xs font-bold text-slate-100">
                          {task.title}
                        </span>
                      </div>
                      <ChevronDown
                        size={15}
                        className={`text-slate-400 transition-transform duration-200 shrink-0 ${
                          isExpanded ? 'rotate-180 text-cyan-400' : ''
                        }`}
                      />
                    </button>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-950/60 space-y-3 animate-in fade-in duration-150">
                        {/* Target Role Badges */}
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          {task.target_roles?.includes('all') ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {t('help.all_roles_badge')}
                            </span>
                          ) : (
                            task.target_roles?.map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  r === 'operator'
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                    : r === 'technician'
                                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60'
                                    : 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                                }`}
                              >
                                {r === 'operator'
                                  ? t('help.operator_badge')
                                  : r === 'technician'
                                  ? t('help.technician_badge')
                                  : t('help.manager_badge')}
                              </span>
                            ))
                          )}
                        </div>

                        {/* Ordered Steps */}
                        <ol className="space-y-2 pt-1">
                          {Array.isArray(task.steps) &&
                            task.steps.map((step, sIdx) => (
                              <li
                                key={sIdx}
                                className="text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
                              >
                                <span className="bg-cyan-950 text-cyan-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border border-cyan-800/60 mt-0.5 shrink-0">
                                  {sIdx + 1}
                                </span>
                                <span>{step}</span>
                              </li>
                            ))}
                        </ol>

                        {/* Pro-Tip */}
                        {task.tip && (
                          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-2.5 text-xs text-cyan-200/90 flex items-start gap-2">
                            <Lightbulb size={14} className="text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-bold mr-1">{t('help.tip_label')}</span>
                              <span>{task.tip}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-slate-900 rounded-xl text-center text-xs text-slate-500">
                No guides found for this module.
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span>Anaheim Plant PM Portal</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold uppercase">{i18n.language}</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition"
          >
            {t('common.close')}
          </button>
        </div>

      </div>
    </div>
  );
};
