import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Sparkles
} from 'lucide-react';

export const GuidedTour = ({ activeTab, forceOpen = false, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const moduleKey = activeTab ? activeTab.replace(/-/g, '_') : 'dashboard';
  const tourStorageKey = `pm_tour_seen_${user?.id || 'guest'}_${moduleKey}`;

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Read steps from i18n
  const steps = t(`tour.modules.${moduleKey}`, { returnObjects: true }) || [];

  useEffect(() => {
    if (forceOpen) {
      setCurrentStep(0);
      setIsOpen(true);
      return;
    }

    // Check if seen on first visit
    const hasSeen = localStorage.getItem(tourStorageKey);
    if (!hasSeen && Array.isArray(steps) && steps.length > 0) {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setIsOpen(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [activeTab, forceOpen, tourStorageKey]);

  if (!isOpen || !Array.isArray(steps) || steps.length === 0) {
    return null;
  }

  const activeStepData = steps[currentStep] || steps[0];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(tourStorageKey, 'true');
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleFinish = () => {
    localStorage.setItem(tourStorageKey, 'true');
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="guided-tour-overlay fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-[2px] transition-all">
      <div className="bg-slate-900/98 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/50 max-w-lg w-full p-5 text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
        
        {/* Header with step counter & dismiss */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-950/80 rounded-lg text-cyan-400 border border-cyan-800/60">
              <Compass size={16} />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                {t('common.tour')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {t('tour.step_counter', { current: currentStep + 1, total: steps.length })}
              </span>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            title={t('tour.skip')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5 py-2.5">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-7 bg-cyan-400'
                  : idx < currentStep
                  ? 'w-2 bg-cyan-800'
                  : 'w-2 bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="py-2 space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" />
            {activeStepData?.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            {activeStepData?.description}
          </p>
        </div>

        {/* Footer actions */}
        <div className="pt-3 mt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          
          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20 w-3.5 h-3.5"
            />
            <span>{t('tour.dont_show_again')}</span>
          </label>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 ml-auto">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                <ChevronLeft size={14} />
                <span>{t('tour.back')}</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-md shadow-cyan-950/40 transition"
            >
              <span>{isLast ? t('tour.finish') : t('tour.next')}</span>
              {isLast ? <Check size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
