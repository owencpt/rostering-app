import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, X, Play, Square, User, Settings, Home, ChevronLeft, ChevronRight, LogOut, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { staffService, shiftsService, subscriptions } from './lib/supabaseClient';
import { supabase } from './lib/supabaseClient';

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// AuthComponent moved outside - THIS IS THE FIX
const AuthComponent = ({ 
  authMode, 
  setAuthMode, 
  authData, 
  setAuthData, 
  showPassword, 
  setShowPassword, 
  authError, 
  authLoading, 
  handleAuth 
}) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Calendar className="w-10 h-10 text-blue-600 mr-3" />
          <span className="text-2xl font-bold text-gray-900">RosterPro</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {authMode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-gray-600 mt-2">
          {authMode === 'login' ? 'Sign in to access your schedule' : 'Join the team'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        {authMode === 'signup' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={authData.name}
                onChange={(e) => setAuthData({...authData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={authData.role}
                onChange={(e) => setAuthData({...authData, role: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="email"
              required
              value={authData.email}
              onChange={(e) => setAuthData({...authData, email: e.target.value})}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <div className="relative">
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={authData.password}
              onChange={(e) => setAuthData({...authData, password: e.target.value})}
              className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              minLength="6"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{authError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={authLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authLoading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setAuthError('');
              setAuthData({ email: '', password: '', name: '', role: 'staff' });
            }}
            className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            {authMode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  </div>
);

const RosteringApp = () => {
  // Authentication states
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const dataTransformers = {
    staffToAppFormat: (row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      email: row.email,
      avatar: row.avatar,
      userId: row.user_id
    }),
    shiftToAppFormat: (row) => ({
      id: row.id,
      staffId: row.staff_id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      role: row.role
    })
  };

  // Helper functions for date management
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

  const [currentView, setCurrentView] = useState('admin');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [draggedStaff, setDraggedStaff] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockedIn, setClockedIn] = useState({});
  const [showDurationPopup, setShowDurationPopup] = useState(false);
  const [pendingShift, setPendingShift] = useState(null);
  const [shiftDuration, setShiftDuration] = useState(5);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [serviceView, setServiceView] = useState('lunch');
  const [currentStaffMember, setCurrentStaffMember] = useState(null);

  const slotRanges = {
    lunch: [9, 14],
    dinner: [16, 23],
  };

  const [start, end] = slotRanges[serviceView];

  // Authentication effects
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      setShowAuth(!session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setShowAuth(!session);
      
      if (session?.user) {
        // Fetch the current user's staff record
        try {
          const staffData = await staffService.getAllStaff();
          const userStaff = staffData.find(s => s.user_id === session.user.id);
          setCurrentStaffMember(userStaff);
          
          // Set appropriate view based on role
          if (userStaff?.role === 'admin' || userStaff?.role === 'manager') {
            setCurrentView('admin');
          } else {
            setCurrentView('staff');
          }
        } catch (error) {
          console.error('Error fetching user staff record:', error);
        }
      } else {
        setCurrentStaffMember(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data loading effect
  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      try {
        const staffData = await staffService.getAllStaff();
        setStaff(staffData.map(dataTransformers.staffToAppFormat));

        const weekDates = getWeekDates(currentWeekStart);
        const startDate = formatDate(weekDates[0]);
        const endDate = formatDate(weekDates[6]);

        const shiftData = await shiftsService.getShifts(startDate, endDate);
        setShifts(shiftData.map(dataTransformers.shiftToAppFormat));
      } catch (err) {
        console.error("Error loading data:", err);
      }
    }

    fetchData();

    const subscription = subscriptions.subscribeToShifts((payload) => {
      console.log("Realtime shift update:", payload);
      fetchData();
    });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentWeekStart, user]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Authentication functions
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authData.email,
          password: authData.password,
        });
        
        if (error) throw error;
      } else {
        // Sign up new user
        const { data: authResult, error: signUpError } = await supabase.auth.signUp({
          email: authData.email,
          password: authData.password,
          options: {
            data: {
              name: authData.name,
              role: authData.role
            }
          }
        });

        if (signUpError) throw signUpError;

        // Create staff record
        if (authResult.user) {
          await staffService.createStaff({
            user_id: authResult.user.id,
            name: authData.name,
            email: authData.email,
            role: authData.role,
            avatar: authData.name.split(' ').map(n => n[0]).join('').toUpperCase()
          });
        }
      }
      
      setAuthData({ email: '', password: '', name: '', role: 'staff' });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if current user is admin
  const isAdmin = () => {
    return currentStaffMember?.role === 'admin' || currentStaffMember?.role === 'manager';
  };

  // Get current user's shifts only
  const getCurrentUserShifts = () => {
    return shifts.filter(shift => shift.staffId === currentStaffMember?.id);
  };

  // Rest of your existing component logic...
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
    if (!draggedStaff) return;

    const weekDates = getWeekDates(currentWeekStart);
    const selectedDate = weekDates[dayIndex];
    const dateString = formatDate(selectedDate);
    
    setPendingShift({
      staffId: draggedStaff.id,
      staffName: draggedStaff.name,
      date: dateString,
      startTime: timeSlot,
      role: draggedStaff.role,
      day: weekDays[dayIndex]
    });
    
    setShowDurationPopup(true);
    setDraggedStaff(null);
  };

  const confirmShiftCreation = async (duration) => {
    if (!pendingShift) return;

    const startHour = parseInt(pendingShift.startTime);
    const endTime = startHour + duration;
    const endHour = Math.floor(endTime);
    const endMinutes = (endTime % 1) * 60;
    const endTimeString = `${endHour.toString().padStart(2,'0')}:${Math.round(endMinutes).toString().padStart(2,'0')}`;

    const newShift = {
      staff_id: pendingShift.staffId,
      date: pendingShift.date,
      start_time: pendingShift.startTime,
      end_time: endTimeString,
      role: pendingShift.role
    };

    try {
      const savedRow = await shiftsService.createShift(newShift);
      const savedShift = dataTransformers.shiftToAppFormat(savedRow);
      setShifts(prev => [...prev, savedShift]);
    } catch (err) {
      console.error("Error creating shift:", err);
    } finally {
      setShowDurationPopup(false);
      setPendingShift(null);
      setShiftDuration(8);
    }
  };

  const removeStaffFromSlot = async (staffId, date, timeSlot) => {
    const affectedShift = shifts.find(shift => {
      const shiftStart = parseFloat(shift.startTime.replace(':', '.'));
      const shiftEnd = parseFloat(shift.endTime.replace(':', '.'));
      const currentSlot = parseFloat(timeSlot.replace(':', '.'));

      return (
        shift.staffId === staffId &&
        shift.date === date &&
        currentSlot >= shiftStart &&
        currentSlot < shiftEnd
      );
    });

    if (!affectedShift) return;

    try {
      await shiftsService.deleteShift(affectedShift.id);
      setShifts(prev => prev.filter(s => s.id !== affectedShift.id));
    } catch (err) {
      console.error("Error deleting shift:", err);
    }
  };

  const handleClockInOut = (staffId, action) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    setClockedIn(prev => ({
      ...prev,
      [staffId]: action === 'in' ? { clockedIn: true, time: timeString } : { clockedIn: false, time: timeString }
    }));
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
    
    const shiftsInSlot = shifts.filter(shift => {
      const shiftStart = parseTime(shift.startTime);
      const shiftEnd = parseTime(shift.endTime);
      
      return shift.date === dateString && 
             currentSlot >= shiftStart && 
             currentSlot < shiftEnd;
    });

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

  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
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
              {pendingShift.day}, {pendingShift.date}, starting at {pendingShift.startTime}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">Shift Duration</p>
            
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

  const AdminView = () => {
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
                <p className="text-gray-600">Drag staff members to schedule shifts, then set duration</p>
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
                  {currentTime.toLocaleTimeString()}
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

                    {timeSlots.slice(start, end + 1).map(timeSlot => {
                      const rowHeight = Math.max(80, ...weekDays.map((day, dayIndex) => {
                        const { fullHourShifts, partialShifts } = getShiftsForTimeSlot(dayIndex, timeSlot);
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
                          {weekDays.map((day, dayIndex) => {
                            const { fullHourShifts, partialShifts, dateString } = getShiftsForTimeSlot(dayIndex, timeSlot);
                            const dayDate = weekDates[dayIndex];
                            const isToday = dayDate.toDateString() === today.toDateString();
                            
                            return (
                              <div
                                key={`${day}-${timeSlot}`}
                                className={`relative border-r border-b border-gray-200 hover:bg-blue-50 transition-colors ${isToday ? 'bg-blue-25' : ''}`}
                                style={{ height: `${rowHeight}px` }}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, dayIndex, timeSlot)}
                              >
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
  };

  const StaffView = () => {
    const today = formatDate(new Date());
    const userShifts = getCurrentUserShifts();
    const todayShifts = userShifts.filter(shift => shift.date === today);

    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
            <p className="text-gray-600">Welcome, {currentStaffMember?.name}! View your shifts and clock in/out</p>
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
                {todayShifts.map(shift => {
                  const clockStatus = clockedIn[shift.staffId];
                  
                  return (
                    <div key={shift.id} className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{currentStaffMember?.name}</h3>
                          <p className="text-gray-600">{shift.role}</p>
                          <p className="text-sm text-gray-500">{shift.startTime} - {shift.endTime}</p>
                        </div>
                        
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
                          <div className="font-medium">{currentStaffMember?.name}</div>
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

  const [showAddStaff, setShowAddStaff] = useState(false);

  const AddStaffModal = ({ isOpen, onClose, onAdd }) => {
    const [newStaff, setNewStaff] = useState({ name: '', role: '', email: '', password: '' });
    const [addStaffLoading, setAddStaffLoading] = useState(false);
    const [addStaffError, setAddStaffError] = useState('');

    const handleSubmit = async () => {
      if (newStaff.name && newStaff.role && newStaff.email && newStaff.password) {
        setAddStaffLoading(true);
        setAddStaffError('');
        
        try {
          // Create auth user
          const { data: authResult, error: signUpError } = await supabase.auth.signUp({
            email: newStaff.email,
            password: newStaff.password,
            options: {
              data: {
                name: newStaff.name,
                role: newStaff.role
              }
            }
          });

          if (signUpError) throw signUpError;

          // Create staff record
          if (authResult.user) {
            const staffRecord = {
              user_id: authResult.user.id,
              name: newStaff.name,
              email: newStaff.email,
              role: newStaff.role,
              avatar: newStaff.name.split(' ').map(n => n[0]).join('').toUpperCase()
            };

            await staffService.createStaff(staffRecord);
            
            // Add to local state
            onAdd({
              id: Date.now(),
              ...staffRecord,
              userId: authResult.user.id
            });
          }
          
          setNewStaff({ name: '', role: '', email: '', password: '' });
          onClose();
        } catch (error) {
          setAddStaffError(error.message);
        } finally {
          setAddStaffLoading(false);
        }
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
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                type="password"
                value={newStaff.password}
                onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Set initial password"
                minLength="6"
              />
              <p className="text-xs text-gray-500 mt-1">Staff member can change this after first login</p>
            </div>

            {addStaffError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{addStaffError}</p>
              </div>
            )}
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                disabled={addStaffLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                disabled={addStaffLoading}
              >
                {addStaffLoading ? 'Creating...' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const addNewStaff = (newStaffMember) => {
    setStaff([...staff, newStaffMember]);
  };

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
  if (showAuth || !user) {
    return (
      <AuthComponent
        authMode={authMode}
        setAuthMode={setAuthMode}
        authData={authData}
        setAuthData={setAuthData}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        authError={authError}
        authLoading={authLoading}
        handleAuth={handleAuth}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">RosterPro</span>
              </div>
              
              <div className="flex space-x-4">
                {isAdmin() && (
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

              {isAdmin() && currentView === 'admin' && (
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

      {currentView === 'admin' && isAdmin() ? <AdminView /> : <StaffView />}

      <DurationPopup />

      {isAdmin() && (
        <AddStaffModal 
          isOpen={showAddStaff} 
          onClose={() => setShowAddStaff(false)} 
          onAdd={addNewStaff}
        />
      )}
    </div>
  );
};

export default RosteringApp;