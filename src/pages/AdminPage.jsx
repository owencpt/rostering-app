import React, { useState } from 'react';
import { Calendar, Users, ChevronLeft, ChevronRight, X } from 'lucide-react';

// Mock data - will come from context later
const mockStaff = [
  { id: 1, name: 'John Doe', role: 'admin', avatar: 'JD' },
  { id: 2, name: 'Jane Smith', role: 'server', avatar: 'JS' },
  { id: 3, name: 'Mike Johnson', role: 'chef', avatar: 'MJ' }
];

const mockShifts = [
  { id: 1, staffId: 2, date: '2025-01-15', startTime: '09:00', endTime: '17:00', role: 'server' },
  { id: 2, staffId: 3, date: '2025-01-15', startTime: '10:00', endTime: '18:00', role: 'chef' }
];

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
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

const AdminPage = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [serviceView, setServiceView] = useState('lunch');
  const [draggedStaff, setDraggedStaff] = useState(null);

  const slotRanges = {
    lunch: [9, 14],
    dinner: [16, 23],
  };

  const [start, end] = slotRanges[serviceView];

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const handleDragStart = (e, staffMember) => {
    setDraggedStaff(staffMember);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dayIndex, timeSlot) => {
    e.preventDefault();
    console.log('Dropped', draggedStaff?.name, 'on', weekDays[dayIndex], 'at', timeSlot);
    // This will be implemented with context later
    setDraggedStaff(null);
  };

  const getShiftsForTimeSlot = (dayIndex, timeSlot) => {
    const weekDates = getWeekDates(currentWeekStart);
    const dateString = formatDate(weekDates[dayIndex]);
    
    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    };
    
    const currentSlot = parseTime(timeSlot);
    const nextSlot = currentSlot + 1;
    
    const shiftsInSlot = mockShifts.filter(shift => {
      const shiftStart = parseTime(shift.startTime);
      const shiftEnd = parseTime(shift.endTime);
      
      return shift.date === dateString && 
             currentSlot >= shiftStart && 
             currentSlot < shiftEnd;
    });

    return { fullHourShifts: shiftsInSlot, partialShifts: [], dateString };
  };

  const weekDates = getWeekDates(currentWeekStart);
  const today = new Date();
  const isCurrentWeek = weekDates.some(date => 
    date.toDateString() === today.toDateString()
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Roster Management</h1>
              <p className="text-gray-600">Drag staff members to schedule shifts</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Current Date & Time</div>
              <div className="text-lg font-semibold text-gray-900">
                {today.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-md text-gray-700">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Staff Members
              </h2>
              <div className="space-y-3">
                {mockStaff.map(member => (
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

          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Weekly Schedule
                    </h2>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigateWeek(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Previous week"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <div className="px-4 py-2 bg-gray-50 rounded-lg min-w-[200px] text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        {isCurrentWeek && (
                          <div className="text-xs text-blue-600 font-medium">Current Week</div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => navigateWeek(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Next week"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      
                      {!isCurrentWeek && (
                        <button
                          onClick={goToCurrentWeek}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          Today
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => setServiceView('lunch')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      serviceView === 'lunch'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lunch (9 AM - 2 PM)
                  </button>
                  <button
                    onClick={() => setServiceView('dinner')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      serviceView === 'dinner'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Dinner (4 PM - 11 PM)
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 min-w-[800px]">
                  <div className="p-4 bg-gray-50 font-semibold border-r border-gray-200">Time</div>
                  {weekDays.map((day, index) => {
                    const dayDate = weekDates[index];
                    const isToday = dayDate.toDateString() === today.toDateString();
                    
                    return (
                      <div key={day} className={`p-4 bg-gray-50 font-semibold text-center border-r border-gray-200 ${isToday ? 'bg-blue-50 text-blue-700' : ''}`}>
                        <div>{day}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        {isToday && (
                          <div className="text-xs text-blue-600 font-medium">Today</div>
                        )}
                      </div>
                    );
                  })}

                  {timeSlots.slice(start, end + 1).map(timeSlot => (
                    <React.Fragment key={timeSlot}>
                      <div className="p-3 bg-gray-50 text-sm font-medium border-r border-b border-gray-200 flex items-center h-20">
                        {timeSlot}
                      </div>
                      {weekDays.map((day, dayIndex) => {
                        const { fullHourShifts, dateString } = getShiftsForTimeSlot(dayIndex, timeSlot);
                        const dayDate = weekDates[dayIndex];
                        const isToday = dayDate.toDateString() === today.toDateString();
                        
                        return (
                          <div
                            key={`${day}-${timeSlot}`}
                            className={`relative border-r border-b border-gray-200 hover:bg-blue-50 transition-colors h-20 ${isToday ? 'bg-blue-25' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dayIndex, timeSlot)}
                          >
                            {fullHourShifts.length > 0 && (
                              <div className="absolute top-1 left-1 right-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-md p-2 text-white text-xs">
                                <div className="space-y-1">
                                  {fullHourShifts.map((shift) => {
                                    const staffMember = mockStaff.find(s => s.id === shift.staffId);
                                    return (
                                      <div key={shift.id} className="flex items-center justify-between">
                                        <span className="font-semibold">{staffMember?.name}</span>
                                        <button
                                          onClick={() => console.log('Remove shift', shift.id)}
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
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;