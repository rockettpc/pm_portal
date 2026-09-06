import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { EquipmentView } from './components/EquipmentView';
import { UserManagementView } from './components/UserManagementView';

const MainLayout = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('equipment');

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
        {activeTab === 'equipment' && <EquipmentView />}
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
