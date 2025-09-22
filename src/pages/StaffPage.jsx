import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useRoster } from '../context/RosterContext';
import { useAuth } from '../context/AuthContext';


// Mock data - will come from context later
// const mockStaff = { id: 1, name: 'John Doe', role: 'admin', avatar: 'JD' };
// const shifts = [
//   { id: 1, staffId: 1, date: '2025-01-15', startTime: '09:00', endTime: '17:00', role: 'manager' },
//   { id: 2, staffId: 1, date: '2025-01-16', startTime: '10:00', endTime: '18:00', role: 'server' }
// ];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

const getWeekDates = (weekStart) => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });
};

const StaffPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

    // Get data from contexts
  const { shifts, currentWeekStart, getWeekDates, formatDate } = useRoster();
  const { currentStaffMember } = useAuth();
  
  const today = formatDate(new Date());
  const userShifts = shifts.filter(shift => shift.staffId === currentStaffMember.id);
  const todayShifts = userShifts.filter(shift => shift.date === today);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockAction = (shiftId, action) => {
    console.log(`Clock ${action} for shift ${shiftId}`);
    // This will be implemented with context later
  };

  if (!currentStaffMember) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-600">
          <div className="mb-4">Loading staff information...</div>
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
          <p className="text-gray-600">Welcome, {currentStaffMember.name}! View your shifts and clock in/out</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-lg text-gray-600">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Today's Shifts
          </h2>
          
          {todayShifts.length > 0 ? (
            <div className="space-y-4">
              {todayShifts.map(shift => (
                <div key={shift.id} className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{currentStaffMember.name}</h3>
                      <p className="text-gray-600">{shift.role}</p>
                      <p className="text-sm text-gray-500">{shift.startTime} - {shift.endTime}</p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Ready to clock in</p>
                      </div>
                      <button
                        onClick={() => handleClockAction(shift.id, 'in')}
                        className="px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors bg-green-600 hover:bg-green-700 text-white"
                      >
                        <span>Clock In</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No shifts scheduled for today</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            This Week's Schedule
          </h2>
          
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const weekDates = getWeekDates(currentWeekStart);
              const dayDate = weekDates[index];
              const dateString = formatDate(dayDate);
              const dayShifts = userShifts.filter(shift => shift.date === dateString);
              const isToday = dayDate.toDateString() === new Date().toDateString();
              
              return (
                <div key={day} className={`border border-gray-200 rounded-lg p-3 ${isToday ? 'border-blue-300 bg-blue-50' : ''}`}>
                  <h3 className={`font-medium text-center mb-2 ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>{day}</h3>
                  <div className={`text-center text-sm mb-2 ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                    {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {isToday && <div className="text-xs font-medium text-blue-600">Today</div>}
                  </div>
                  <div className="space-y-2">
                    {dayShifts.map(shift => (
                      <div key={shift.id} className="p-2 rounded text-xs bg-blue-100 text-blue-800">
                        <div className="font-medium">{currentStaffMember.name}</div>
                        <div>{shift.startTime}-{shift.endTime}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPage;