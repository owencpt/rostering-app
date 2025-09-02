import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, X, Play, Square, User, Settings, Home } from 'lucide-react';

// Mock data - replace with Supabase queries
const mockStaff = [
  { id: 1, name: 'Alice Johnson', role: 'Manager', email: 'alice@company.com', avatar: 'AJ' },
  { id: 2, name: 'Bob Smith', role: 'Cashier', email: 'bob@company.com', avatar: 'BS' },
  { id: 3, name: 'Carol Davis', role: 'Sales Assistant', email: 'carol@company.com', avatar: 'CD' },
  { id: 4, name: 'David Wilson', role: 'Stock Manager', email: 'david@company.com', avatar: 'DW' },
];

const mockShifts = [
  { id: 1, staffId: 1, date: '2025-09-02', startTime: '09:00', endTime: '17:00', role: 'Manager' },
  { id: 2, staffId: 2, date: '2025-09-02', startTime: '10:00', endTime: '18:00', role: 'Cashier' },
  { id: 3, staffId: 3, date: '2025-09-03', startTime: '08:00', endTime: '16:00', role: 'Sales Assistant' },
];

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const RosteringApp = () => {
  const [currentView, setCurrentView] = useState('admin');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staff, setStaff] = useState(mockStaff);
  const [shifts, setShifts] = useState(mockShifts);
  const [draggedStaff, setDraggedStaff] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedIn, setClockedIn] = useState({});
  const [showDurationPopup, setShowDurationPopup] = useState(false);
  const [pendingShift, setPendingShift] = useState(null);
  const [shiftDuration, setShiftDuration] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDragStart = (e, staffMember) => {
    setDraggedStaff(staffMember);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, day, timeSlot) => {
    e.preventDefault();
    if (!draggedStaff) return;

    // Create pending shift data and show duration popup
    const dayIndex = weekDays.indexOf(day) + 2;
    const dateString = `2025-09-${String(dayIndex).padStart(2, '0')}`;
    
    setPendingShift({
      staffId: draggedStaff.id,
      staffName: draggedStaff.name,
      date: dateString,
      startTime: timeSlot,
      role: draggedStaff.role,
      day: day
    });
    
    setShowDurationPopup(true);
    setDraggedStaff(null);
  };

  const confirmShiftCreation = (duration) => {
    if (!pendingShift) return;

    const startHour = parseInt(pendingShift.startTime);
    const endTime = startHour + duration;
    const endHour = Math.floor(endTime);
    const endMinutes = (endTime % 1) * 60;
    const endTimeString = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

    const newShift = {
      id: Date.now(),
      staffId: pendingShift.staffId,
      date: pendingShift.date,
      startTime: pendingShift.startTime,
      endTime: endTimeString,
      role: pendingShift.role
    };

    setShifts([...shifts, newShift]);
    setShowDurationPopup(false);
    setPendingShift(null);
    setShiftDuration(8); // Reset to default
  };

  const removeStaffFromSlot = (staffId, date, timeSlot) => {
    // Find the shift that covers this time slot
    const currentSlot = parseFloat(timeSlot.replace(':', '.'));
    
    const affectedShift = shifts.find(shift => {
      const shiftStart = parseFloat(shift.startTime.replace(':', '.'));
      const shiftEnd = parseFloat(shift.endTime.replace(':', '.'));
      
      return shift.staffId === staffId && 
             shift.date === date && 
             currentSlot >= shiftStart && 
             currentSlot < shiftEnd;
    });

    if (!affectedShift) return;

    const shiftStart = parseFloat(affectedShift.startTime.replace(':', '.'));
    const shiftEnd = parseFloat(affectedShift.endTime.replace(':', '.'));
    
    // Determine what portion to remove (full hour or check if it's a partial hour)
    const nextSlot = currentSlot + 1;
    const removeStart = Math.max(shiftStart, currentSlot);
    const removeEnd = Math.min(shiftEnd, nextSlot);

    // Remove the original shift
    const newShifts = shifts.filter(shift => shift.id !== affectedShift.id);

    // Create new shift segments if needed
    const shiftsToAdd = [];

    // Add shift before the removed portion (if any)
    if (removeStart > shiftStart) {
      const beforeEndHour = Math.floor(removeStart);
      const beforeEndMinutes = (removeStart % 1) * 60;
      shiftsToAdd.push({
        id: Date.now() + Math.random(),
        staffId: affectedShift.staffId,
        date: affectedShift.date,
        startTime: affectedShift.startTime,
        endTime: `${beforeEndHour.toString().padStart(2, '0')}:${beforeEndMinutes.toString().padStart(2, '0')}`,
        role: affectedShift.role
      });
    }

    // Add shift after the removed portion (if any)
    if (removeEnd < shiftEnd) {
      const afterStartHour = Math.floor(removeEnd);
      const afterStartMinutes = (removeEnd % 1) * 60;
      shiftsToAdd.push({
        id: Date.now() + Math.random() + 1,
        staffId: affectedShift.staffId,
        date: affectedShift.date,
        startTime: `${afterStartHour.toString().padStart(2, '0')}:${afterStartMinutes.toString().padStart(2, '0')}`,
        endTime: affectedShift.endTime,
        role: affectedShift.role
      });
    }

    setShifts([...newShifts, ...shiftsToAdd]);
  };

  const handleClockInOut = (staffId, action) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    setClockedIn(prev => ({
      ...prev,
      [staffId]: action === 'in' ? { clockedIn: true, time: timeString } : { clockedIn: false, time: timeString }
    }));
  };

  const getShiftsForTimeSlot = (day, timeSlot) => {
    const dayIndex = weekDays.indexOf(day) + 2;
    const dateString = `2025-09-${String(dayIndex).padStart(2, '0')}`;
    
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    };
    
    const currentSlot = parseTime(timeSlot);
    const nextSlot = currentSlot + 1;
    
    // Get all shifts that work during this time slot
    const shiftsInSlot = shifts.filter(shift => {
      const shiftStart = parseTime(shift.startTime);
      const shiftEnd = parseTime(shift.endTime);
      
      return shift.date === dateString && 
             currentSlot >= shiftStart && 
             currentSlot < shiftEnd;
    });

    // Separate full hour shifts from partial shifts
    const fullHourShifts = [];
    const partialShifts = [];
    
    shiftsInSlot.forEach(shift => {
      const shiftStart = parseTime(shift.startTime);
      const shiftEnd = parseTime(shift.endTime);
      
      const slotStart = Math.max(shiftStart, currentSlot);
      const slotEnd = Math.min(shiftEnd, nextSlot);
      const workDuration = slotEnd - slotStart;
      
      if (workDuration >= 1.0) {
        fullHourShifts.push(shift);
      } else {
        partialShifts.push({ ...shift, workDuration });
      }
    });
    
    return { fullHourShifts, partialShifts, dateString };
  };

  const DurationPopup = () => {
    if (!showDurationPopup || !pendingShift) return null;

    const adjustDuration = (change) => {
      setShiftDuration(prev => Math.max(0.5, Math.min(16, prev + change)));
    };

    const formatDuration = (hours) => {
      const wholeHours = Math.floor(hours);
      const minutes = (hours % 1) * 60;
      if (minutes === 0) {
        return `${wholeHours}h`;
      } else {
        return `${wholeHours}h ${minutes}m`;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Set Shift Duration</h3>
            <button 
              onClick={() => {
                setShowDurationPopup(false);
                setPendingShift(null);
                setShiftDuration(8);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <strong>{pendingShift.staffName}</strong> - {pendingShift.role}
            </p>
            <p className="text-gray-600 text-sm">
              {pendingShift.day}, starting at {pendingShift.startTime}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Shift Duration</p>
            
            {/* Duration Display and Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => adjustDuration(-1)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                disabled={shiftDuration <= 0.5}
              >
                <span className="text-lg font-bold">-</span>
              </button>
              
              <button
                onClick={() => adjustDuration(-0.5)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors text-sm"
                disabled={shiftDuration <= 0.5}
              >
                ½
              </button>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-6 py-3 min-w-[100px] text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {formatDuration(shiftDuration)}
                </div>
              </div>
              
              <button
                onClick={() => adjustDuration(0.5)}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors text-sm"
                disabled={shiftDuration >= 16}
              >
                ½
              </button>
              
              <button
                onClick={() => adjustDuration(1)}
                className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
                disabled={shiftDuration >= 16}
              >
                <span className="text-lg font-bold">+</span>
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-500">
              End time: {
                (() => {
                  const startHour = parseInt(pendingShift.startTime);
                  const endTime = startHour + shiftDuration;
                  const endHour = Math.floor(endTime);
                  const endMinutes = (endTime % 1) * 60;
                  return `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                })()
              }
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  setShowDurationPopup(false);
                  setPendingShift(null);
                  setShiftDuration(8);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmShiftCreation(shiftDuration)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Create Shift
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AdminView = () => (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Roster Management</h1>
          <p className="text-gray-600">Drag staff members to schedule shifts, then set duration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Staff Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Staff Members
              </h2>
              <div className="space-y-3">
                {staff.map(member => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, member)}
                    className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 cursor-move hover:shadow-md transition-all duration-200 select-none"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Calendar className="mr-2 h-5 w-5" />
                    Weekly Schedule
                  </h2>
                  
                  {/* Color Legend */}
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded"></div>
                      <span className="text-gray-600">Full Hour (60+ min)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded"></div>
                      <span className="text-gray-600">Partial Hour (30 min)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 min-w-[800px]">
                  {/* Header */}
                  <div className="p-4 bg-gray-50 font-semibold border-r border-gray-200">Time</div>
                  {weekDays.map(day => (
                    <div key={day} className="p-4 bg-gray-50 font-semibold text-center border-r border-gray-200">
                      {day}
                    </div>
                  ))}

                  {/* Time slots */}
                  {timeSlots.slice(6, 22).map(timeSlot => {
                    // Calculate the maximum height needed for this entire row
                    const rowHeight = Math.max(80, ...weekDays.map(day => {
                      const { fullHourShifts, partialShifts } = getShiftsForTimeSlot(day, timeSlot);
                      if (fullHourShifts.length > 0 || partialShifts.length > 0) {
                        return (fullHourShifts.length * 20) + (partialShifts.length > 0 ? 30 : 0) + 40;
                      }
                      return 80;
                    }));

                    return (
                      <React.Fragment key={timeSlot}>
                        <div 
                          className="p-3 bg-gray-50 text-sm font-medium border-r border-b border-gray-200 flex items-center"
                          style={{ height: `${rowHeight}px` }}
                        >
                          {timeSlot}
                        </div>
                        {weekDays.map(day => {
                          const { fullHourShifts, partialShifts, dateString } = getShiftsForTimeSlot(day, timeSlot);
                          
                          return (
                            <div
                              key={`${day}-${timeSlot}`}
                              className="relative border-r border-b border-gray-200 hover:bg-blue-50 transition-colors"
                              style={{ height: `${rowHeight}px` }}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, day, timeSlot)}
                            >
                            {/* Full Hour Shifts - Combined in one box */}
                            {fullHourShifts.length > 0 && (
                              <div className="absolute top-1 left-1 right-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md p-2 text-white text-xs">
                                <div className="space-y-1">
                                  {fullHourShifts.map((shift, index) => {
                                    const staffMember = staff.find(s => s.id === shift.staffId);
                                    return (
                                      <div key={shift.id} className="flex items-center justify-between">
                                        <span className="font-semibold">{staffMember?.name}</span>
                                        <button
                                          onClick={() => removeStaffFromSlot(shift.staffId, dateString, timeSlot)}
                                          className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0"
                                          title={`Remove ${staffMember?.name}`}
                                        >
                                          <X className="w-2 h-2" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Partial Shifts - Combined in one box */}
                            {partialShifts.length > 0 && (
                              <div 
                                className="absolute left-1 right-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-md p-2 text-white text-xs"
                                style={{ 
                                  top: fullHourShifts.length > 0 
                                    ? `${(fullHourShifts.length * 20) + 20}px` 
                                    : '4px' 
                                }}
                              >
                                <div className="space-y-1">
                                  {partialShifts.map((shift) => {
                                    const staffMember = staff.find(s => s.id === shift.staffId);
                                    
                                    return (
                                      <div 
                                        key={`${shift.id}-partial`}
                                        className="flex items-center justify-between"
                                      >
                                        <span className="font-semibold">{staffMember?.name}</span>
                                        <button
                                          onClick={() => removeStaffFromSlot(shift.staffId, dateString, timeSlot)}
                                          className="w-3 h-3 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors flex-shrink-0"
                                          title="Remove this partial shift"
                                        >
                                          <X className="w-1.5 h-1.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  )})}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const StaffView = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayShifts = shifts.filter(shift => 
      shift.date === today || shift.date === '2025-09-02' // Mock today's date
    );

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
            <p className="text-gray-600">View your shifts and clock in/out</p>
          </div>

          {/* Current Time Display */}
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

          {/* Today's Shifts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Today's Shifts
            </h2>
            
            {todayShifts.length > 0 ? (
              <div className="space-y-4">
                {todayShifts.map(shift => {
                  const staffMember = staff.find(s => s.id === shift.staffId);
                  const isCurrentUserShift = shift.staffId === 1; // Mock current user
                  const clockStatus = clockedIn[shift.staffId];
                  
                  return (
                    <div key={shift.id} className={`p-4 rounded-lg border-2 ${isCurrentUserShift ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{staffMember?.name}</h3>
                          <p className="text-gray-600">{shift.role}</p>
                          <p className="text-sm text-gray-500">{shift.startTime} - {shift.endTime}</p>
                        </div>
                        
                        {isCurrentUserShift && (
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              {clockStatus && (
                                <p className="text-sm text-gray-600">
                                  {clockStatus.clockedIn ? 'Clocked in' : 'Clocked out'} at {clockStatus.time}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleClockInOut(shift.staffId, clockStatus?.clockedIn ? 'out' : 'in')}
                              className={`px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
                                clockStatus?.clockedIn 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                            >
                              {clockStatus?.clockedIn ? (
                                <>
                                  <Square className="w-4 h-4" />
                                  <span>Clock Out</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4" />
                                  <span>Clock In</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No shifts scheduled for today</p>
              </div>
            )}
          </div>

          {/* Weekly Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              This Week's Schedule
            </h2>
            
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dayShifts = shifts.filter(shift => {
                  const dayIndex = index + 2;
                  return shift.date === `2025-09-${String(dayIndex).padStart(2, '0')}`;
                });
                
                return (
                  <div key={day} className="border border-gray-200 rounded-lg p-3">
                    <h3 className="font-medium text-center mb-2 text-gray-900">{day}</h3>
                    <div className="text-center text-sm text-gray-600 mb-2">
                      Sep {index + 2}
                    </div>
                    <div className="space-y-2">
                      {dayShifts.map(shift => {
                        const staffMember = staff.find(s => s.id === shift.staffId);
                        const isCurrentUser = shift.staffId === 1;
                        
                        return (
                          <div key={shift.id} className={`p-2 rounded text-xs ${isCurrentUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                            <div className="font-medium">{staffMember?.name}</div>
                            <div>{shift.startTime}-{shift.endTime}</div>
                          </div>
                        );
                      })}
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

  const AddStaffModal = ({ isOpen, onClose, onAdd }) => {
    const [newStaff, setNewStaff] = useState({ name: '', role: '', email: '' });

    const handleSubmit = () => {
      if (newStaff.name && newStaff.role && newStaff.email) {
        const staff = {
          id: Date.now(),
          ...newStaff,
          avatar: newStaff.name.split(' ').map(n => n[0]).join('').toUpperCase()
        };
        onAdd(staff);
        setNewStaff({ name: '', role: '', email: '' });
        onClose();
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Add New Staff Member</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select role</option>
                <option value="Manager">Manager</option>
                <option value="Cashier">Cashier</option>
                <option value="Sales Assistant">Sales Assistant</option>
                <option value="Stock Manager">Stock Manager</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newStaff.email}
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [showAddStaff, setShowAddStaff] = useState(false);

  const addNewStaff = (newStaffMember) => {
    setStaff([...staff, newStaffMember]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">RosterPro</span>
              </div>
              
              <div className="flex space-x-4">
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
                  onClick={() => setCurrentView('staff')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    currentView === 'staff' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Staff View</span>
                </button>
              </div>
            </div>

            {currentView === 'admin' && (
              <button
                onClick={() => setShowAddStaff(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'admin' ? <AdminView /> : <StaffView />}

      {/* Duration Popup */}
      <DurationPopup />

      {/* Add Staff Modal */}
      <AddStaffModal 
        isOpen={showAddStaff} 
        onClose={() => setShowAddStaff(false)} 
        onAdd={addNewStaff}
      />
    </div>
  );
};

export default RosteringApp;