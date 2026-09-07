import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { EquipmentView } from './components/EquipmentView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { PMSchedulesView } from './components/PMSchedulesView';
import { PartsRequestsView } from './components/PartsRequestsView';
import { PartsCatalogView } from './components/PartsCatalogView';
import { UserManagementView } from './components/UserManagementView';
import { HelpPanel } from './components/HelpPanel';
import { GuidedTour } from './components/GuidedTour';
import { QuickReferenceModal } from './components/QuickReferenceModal';
import { AuditLogView } from './components/AuditLogView';
import { QRScannerModal } from './components/QRScannerModal';
import { HelpCircle, FileText } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-950/50 border border-red-800/80 p-8 rounded-2xl text-center my-12 max-w-lg mx-auto shadow-2xl">
          <div className="text-red-400 font-bold text-base mb-2">Module Encountered an Error</div>
          <p className="text-xs text-slate-300 font-mono mb-4 bg-black/40 p-2.5 rounded border border-red-900/40">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg border border-slate-700 transition"
          >
            Reload Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isQuickRefOpen, setIsQuickRefOpen] = useState(false);
  const [tourModule, setTourModule] = useState(null);
  const [forceTour, setForceTour] = useState(false);
  const [globalQrScannerOpen, setGlobalQrScannerOpen] = useState(false);
  const [targetAssetId, setTargetAssetId] = useState(null);

  React.useEffect(() => {
    if (user?.role === 'operator') {
      setActiveTab('equipment');
    } else if (['admin', 'manager'].includes(user?.role)) {
      setActiveTab('dashboard');
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3" />
        Initializing CGI PM Portal...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const handleStartTour = (targetModule) => {
    setTourModule(targetModule || activeTab);
    setForceTour(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenQuickRef={() => setIsQuickRefOpen(true)}
        onOpenScanQR={() => setGlobalQrScannerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary>
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'equipment' && <EquipmentView targetAssetId={targetAssetId} />}
          {activeTab === 'work-orders' && <WorkOrdersView />}
          {activeTab === 'pm-schedules' && <PMSchedulesView />}
          {activeTab === 'parts-requests' && <PartsRequestsView />}
          {activeTab === 'parts-catalog' && <PartsCatalogView />}
          {activeTab === 'users' && ['admin', 'manager'].includes(user?.role) && <UserManagementView />}
          {activeTab === 'audit-log' && ['admin', 'manager'].includes(user?.role) && <AuditLogView />}
        </ErrorBoundary>
      </main>

      {/* Floating Quick Action Bar (Shop Floor Accessible) */}
      <div className="fixed bottom-5 right-5 z-30 flex items-center gap-2 no-print floating-help-btn">
        <button
          onClick={() => setIsQuickRefOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-amber-200 text-xs font-semibold rounded-full border border-slate-700/80 hover:border-amber-500/50 shadow-xl backdrop-blur-md transition group"
          title={t('quickref.modal_title')}
        >
          <FileText size={15} className="text-amber-400 group-hover:scale-110 transition" />
          <span className="hidden sm:inline font-mono">{t('common.quick_ref')}</span>
        </button>

        <button
          onClick={() => setIsHelpOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-full border border-cyan-400/80 shadow-2xl shadow-cyan-950/60 transition group"
          title={t('common.help')}
        >
          <HelpCircle size={16} className="text-slate-950 group-hover:rotate-12 transition" />
          <span>{t('common.help')}</span>
        </button>
      </div>

      {/* In-App Contextual Help Slide-Over Panel */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        activeTab={activeTab}
        onStartTour={handleStartTour}
        onOpenQuickRef={() => setIsQuickRefOpen(true)}
      />

      {/* Interactive Guided Tour */}
      <GuidedTour
        activeTab={tourModule || activeTab}
        forceOpen={forceTour}
        onClose={() => {
          setForceTour(false);
          setTourModule(null);
        }}
      />

      {/* Role-Specific Printable One-Page Quick-Reference Card */}
      <QuickReferenceModal
        isOpen={isQuickRefOpen}
        onClose={() => setIsQuickRefOpen(false)}
      />

      {/* Global Camera QR Code Scanner */}
      <QRScannerModal
        isOpen={globalQrScannerOpen}
        onClose={() => setGlobalQrScannerOpen(false)}
        onScanSuccess={(scannedAssetId) => {
          setTargetAssetId(scannedAssetId);
          setActiveTab('equipment');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
