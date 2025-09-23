import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useRoster } from '../context/RosterContext';
import { useAuth } from '../context/AuthContext';
import { clockService } from '../lib/supabaseClient';
import ClockInOut from '../components/ClockInOut';
import { useTimer } from '../context/TimerContext'; // Import useTimer

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const StaffPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockStatus, setClockStatus] = useState({});

  // Get data from contexts
  const { shifts, currentWeekStart, getWeekDates, formatDate } = useRoster();
  const { currentStaffMember } = useAuth();
  const { handleClockInOut } = useTimer(); // Get handleClockInOut from context

  // Move these calculations before the useEffect
  const today = formatDate(new Date());
  const userShifts = shifts.filter(shift => shift.staffId === currentStaffMember?.id);
  const todayShifts = userShifts.filter(shift => shift.date === today);

  const handleModifyShift = async (shiftId, updates) => {
  try {
    const { clockInTime, clockOutTime, breakDuration } = updates;
    const date = formatDate(new Date());
    
    // Use clockStatus directly since we already have it
    const clockEntry = clockStatus[shiftId];
    
    if (!clockEntry) {
      console.error('No clock entry found for this shift');
      return;
    }

    // Now update using the clock entry ID
    await clockService.modifyClockEntry(clockEntry.id, {
      clock_in_time: `${date}T${clockInTime}:00`,
      clock_out_time: `${date}T${clockOutTime}:00`,
      total_break_duration_minutes: breakDuration
    });
    
    // Refresh clock status
    const updatedStatus = await clockService.getTodayStatusComplete(currentStaffMember.id);
    setClockStatus(prev => ({
      ...prev,
      [shiftId]: updatedStatus
    }));

    // Add success feedback
    console.log('Successfully updated shift times');
  } catch (error) {
    console.error('Error modifying shift:', error);
    // Add error handling here
  }
};

  // Load initial clock status
  useEffect(() => {
    const loadClockStatus = async () => {
      if (!currentStaffMember) return;
      
      try {
        // Get all clock entries for today's shifts
        const todayEntries = await Promise.all(
          todayShifts.map(async (shift) => {
            const status = await clockService.getShiftStatus(currentStaffMember.id, shift.id);
            return {
              shiftId: shift.id,
              status
            };
          })
        );

        // Update clock status for all shifts
        const newClockStatus = {};
        todayEntries.forEach(({shiftId, status}) => {
          if (status) {
            newClockStatus[shiftId] = {
              ...status,
              isClockedIn: !!status.clock_in_time && !status.clock_out_time,
              canModifyShift: !!(status.clock_in_time && status.clock_out_time)
            };
          }
        });

        setClockStatus(newClockStatus);
      } catch (error) {
        console.error('Error loading clock status:', error);
      }
    };

    loadClockStatus();
  }, [currentStaffMember, todayShifts]); // Now todayShifts is defined

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle clock actions
  const handleClockAction = async (shiftId, action) => {
    if (!currentStaffMember) return;

    try {
      const result = await handleClockInOut(shiftId, action, shifts);
      
      // Only update local state if needed
      if (result?.shouldReloadStatus) {
        const updatedStatus = await clockService.getTodayStatusComplete(currentStaffMember.id);
        setClockStatus(prev => ({
          ...prev,
          [shiftId]: updatedStatus
        }));
      }
    } catch (error) {
      console.error('Clock action error:', error);
    }
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
                <ClockInOut
                  key={shift.id}
                  shift={shift}
                  currentStaffMember={currentStaffMember}
                  clockStatus={clockStatus}
                  onClockAction={handleClockAction}
                  onModifyShift={handleModifyShift} // We'll implement this later
                />
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
              
              // Change the isToday check to use the same format as shift dates
              const today = formatDate(new Date());
              const isToday = dateString === today;
              
              const dayShifts = userShifts.filter(shift => shift.date === dateString);
              
              return (
                <div key={day} className={`border border-gray-200 rounded-lg p-3 ${isToday ? 'border-blue-300 bg-blue-50' : ''}`}>
                  <h3 className={`font-medium text-center mb-2 ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>{day}</h3>
                  <div className={`text-center text-sm mb-2 ${isToday ? 'text-blue-700' : 'text-gray-600'}`}>
                    {/* Use the same date object for display */}
                    {dayDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric' // Add year to ensure correct date
                    })}
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