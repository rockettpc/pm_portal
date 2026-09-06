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
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
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
        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'equipment' && <EquipmentView />}
        {activeTab === 'work-orders' && <WorkOrdersView />}
        {activeTab === 'pm-schedules' && <PMSchedulesView />}
        {activeTab === 'parts-requests' && <PartsRequestsView />}
        {activeTab === 'parts-catalog' && <PartsCatalogView />}
        {activeTab === 'users' && ['admin', 'manager'].includes(user?.role) && <UserManagementView />}
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
