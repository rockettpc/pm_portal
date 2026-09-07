import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Printer,
  X,
  Shield,
  HardHat,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Layers,
  FileText
} from 'lucide-react';

export const QuickReferenceModal = ({ isOpen, onClose, initialRole = null }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Allowed roles for preview
  const defaultRole = initialRole || (user?.role === 'operator' ? 'operator' : user?.role === 'technician' ? 'technician' : 'manager');
  const [selectedRole, setSelectedRole] = useState(defaultRole);

  if (!isOpen) return null;

  const roleData = t(`quickref.roles.${selectedRole}`, { returnObjects: true });
  const isManagerOrAdmin = ['admin', 'manager'].includes(user?.role);

  const handlePrint = () => {
    window.print();
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'operator':
        return <HardHat size={16} className="text-amber-400" />;
      case 'technician':
        return <Wrench size={16} className="text-cyan-400" />;
      case 'manager':
      default:
        return <Shield size={16} className="text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Dialog Shell */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Hidden on Print */}
        <div className="no-print p-4 sm:px-6 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <FileText className="text-cyan-400" size={20} />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {t('quickref.modal_title')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('quickref.emergency_notice')}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Role switcher for Admins and Managers */}
            {isManagerOrAdmin && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs mr-2">
                <span className="text-[11px] text-slate-400 px-2 font-medium">
                  {t('quickref.switch_role')}
                </span>
                <button
                  onClick={() => setSelectedRole('operator')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    selectedRole === 'operator'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('roles.operator')}
                </button>
                <button
                  onClick={() => setSelectedRole('technician')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    selectedRole === 'technician'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('roles.technician')}
                </button>
                <button
                  onClick={() => setSelectedRole('manager')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                    selectedRole === 'manager'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('roles.manager')}
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-950/50 transition"
              title="Print standard 8.5 x 11 reference sheet"
            >
              <Printer size={14} />
              <span>{t('quickref.print_btn')}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Printable 1-Page Reference Sheet */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-75px)] bg-slate-950 text-slate-200">
          <div className="printable-card bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-inner">
            
            {/* Plant Header */}
            <div className="border-b border-slate-700/80 pb-4 mb-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400 font-mono font-bold text-xs uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                    CGI Anaheim Plant
                  </span>
                  <span className="text-slate-400 text-xs font-medium">
                    Preventive Maintenance Portal
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-wide mt-1">
                  {roleData?.title}
                </h1>
                <p className="text-xs text-slate-400">
                  {t('quickref.plant_header')}
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 text-xs font-semibold text-slate-300">
                {getRoleIcon(selectedRole)}
                <span>{roleData?.badge}</span>
              </div>
            </div>

            {/* Two-Column Printable Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Column 1: Shift Routine Checklist & Emergency Contacts */}
              <div className="space-y-4">
                {/* Routine Checklist Box */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2.5">
                    <CheckCircle2 size={14} />
                    {roleData?.shift_checklist_title}
                  </h3>
                  <ul className="space-y-2">
                    {Array.isArray(roleData?.shift_checklist) &&
                      roleData.shift_checklist.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Urgency / Priority Reference Matrix */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2.5">
                    <AlertTriangle size={14} />
                    {roleData?.urgency_guide_title}
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(roleData?.urgency_guide) &&
                      roleData.urgency_guide.map((item, idx) => (
                        <div key={idx} className="text-xs border-l-2 border-amber-500/60 pl-2.5 py-0.5">
                          <span className="font-bold text-slate-100 font-mono text-[11px] block">
                            {item.level || item.kpi}
                          </span>
                          <span className="text-slate-400 text-[11px] leading-tight">
                            {item.desc}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Plant Contacts */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <Phone size={13} />
                    {roleData?.contacts_title || t('quickref.emergency_title', 'Key Contacts')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Array.isArray(roleData?.contacts) &&
                      roleData.contacts.map((contact, idx) => (
                        <div key={idx} className="bg-slate-900/80 p-2 rounded border border-slate-800">
                          <div className="font-semibold text-slate-200 text-[11px]">{contact.role}</div>
                          <div className="text-cyan-400 font-mono text-[10px]">{contact.ext}</div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Step-by-Step Operating Procedures */}
              <div className="space-y-4">
                {Array.isArray(roleData?.sections) &&
                  roleData.sections.map((section, sIdx) => (
                    <div key={sIdx} className="bg-slate-950/70 border border-slate-800 rounded-lg p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5 mb-2.5">
                        <Layers size={14} className="text-cyan-400" />
                        {section.heading}
                      </h3>
                      <ol className="space-y-1.5">
                        {Array.isArray(section.steps) &&
                          section.steps.map((step, idx) => (
                            <li key={idx} className="text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                              <span className="bg-cyan-950 text-cyan-400 font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border border-cyan-800/60 mt-0.5 shrink-0">
                                {idx + 1}
                              </span>
                              <span>{step}</span>
                            </li>
                          ))}
                      </ol>
                    </div>
                  ))}
              </div>
            </div>

            {/* Card Footer */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div>Custom Glass Industries, Inc. • QA & Plant Maintenance Protocol</div>
              <div>Anaheim, CA • Generated {new Date().toLocaleDateString(i18n.language === 'es' ? 'es-US' : 'en-US')}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
