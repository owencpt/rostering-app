import React, { useState } from 'react';
import { Calendar, Settings, Users, User, Plus, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
// import AddStaffModal from './Modal/AddStaffModal';

const Navbar = ({ currentView, setCurrentView, isAdmin, currentStaffMember }) => {
  const { handleSignOut } = useAuth();
  const [showAddStaff, setShowAddStaff] = useState(false);

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">RosterPro</span>
              </div>
              
              <div className="flex space-x-4">
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        currentView === 'admin' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Admin</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('payment')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        currentView === 'payment' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Payment Breakdown</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCurrentView('staff')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    currentView === 'staff' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>My Schedule</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {currentStaffMember?.avatar}
                </div>
                <span className="text-sm text-gray-700">{currentStaffMember?.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {currentStaffMember?.role}
                </span>
              </div>

              {isAdmin && currentView === 'admin' && (
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Staff</span>
                </button>
              )}

              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* <AddStaffModal 
        isOpen={showAddStaff} 
        onClose={() => setShowAddStaff(false)} 
      /> */}
    </>
  );
};

export default Navbar;