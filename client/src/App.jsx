import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState(() => {
    return 'dashboard';
  });

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary>
          {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'equipment' && <EquipmentView />}
          {activeTab === 'work-orders' && <WorkOrdersView />}
          {activeTab === 'pm-schedules' && <PMSchedulesView />}
          {activeTab === 'parts-requests' && <PartsRequestsView />}
          {activeTab === 'parts-catalog' && <PartsCatalogView />}
          {activeTab === 'users' && ['admin', 'manager'].includes(user?.role) && <UserManagementView />}
        </ErrorBoundary>
      </main>
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
