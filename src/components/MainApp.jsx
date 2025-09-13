import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoginPage from '../pages/LoginPage';
import Navbar from './Navbar';
import AdminPage from '../pages/AdminPage';
import PaymentPage from '../pages/PaymentPage';
import StaffPage from '../pages/StaffPage';

const MainApp = () => {
  const { user, currentStaffMember, loading } = useAuth();
  const [currentView, setCurrentView] = useState('staff');

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Calendar className="w-10 h-10 text-blue-600 mr-3 animate-pulse" />
            <span className="text-2xl font-bold text-gray-900">RosterPro</span>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const isAdmin = () => {
    return currentStaffMember?.role === 'admin' || currentStaffMember?.role === 'manager';
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'admin':
        return isAdmin() ? <AdminPage /> : <StaffPage />;
      case 'payment':
        return isAdmin() ? <PaymentPage /> : <StaffPage />;
      default:
        return <StaffPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        isAdmin={isAdmin()}
        currentStaffMember={currentStaffMember}
      />
      {renderCurrentView()}
    </div>
  );
};

export default MainApp;