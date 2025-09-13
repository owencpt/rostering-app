import React, { createContext, useContext, useState, useEffect } from 'react';
import { staffService, shiftsService, subscriptions } from '../lib/supabaseClient';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const RosterContext = createContext();

export const useRoster = () => {
  const context = useContext(RosterContext);
  if (!context) {
    throw new Error('useRoster must be used within a RosterProvider');
  }
  return context;
};

export const RosterProvider = ({ children }) => {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [draggedStaff, setDraggedStaff] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [serviceView, setServiceView] = useState('lunch');
  const [showDurationPopup, setShowDurationPopup] = useState(false);
  const [pendingShift, setPendingShift] = useState(null);
  const [shiftDuration, setShiftDuration] = useState(5);

  // Data transformers
  const dataTransformers = {
    staffToAppFormat: (row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      email: row.email,
      avatar: row.avatar,
      userId: row.user_id,
      base_pay: row.base_pay
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

  // Helper functions
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

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

  // Load data effect
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

  // Drag and drop handlers
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
      day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex]
    });
    
    setShowDurationPopup(true);
    setDraggedStaff(null);
  };

  // Shift management
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
      setShiftDuration(5);
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

  // Navigation
  const navigateWeek = (direction) => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + (direction * 7));
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  // Get shifts for specific time slot
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

  // Add new staff member
  const addNewStaff = async (newStaffData) => {
    try {
      const staffRecord = await staffService.createStaff(newStaffData);
      const formattedStaff = dataTransformers.staffToAppFormat(staffRecord);
      setStaff(prev => [...prev, formattedStaff]);
      return { success: true };
    } catch (error) {
      console.error('Error adding staff:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    // State
    staff,
    shifts,
    draggedStaff,
    currentWeekStart,
    serviceView,
    showDurationPopup,
    pendingShift,
    shiftDuration,
    
    // Setters
    setStaff,
    setServiceView,
    setShowDurationPopup,
    setPendingShift,
    setShiftDuration,
    
    // Functions
    handleDragStart,
    handleDragOver,
    handleDrop,
    confirmShiftCreation,
    removeStaffFromSlot,
    navigateWeek,
    goToCurrentWeek,
    getShiftsForTimeSlot,
    getWeekDates,
    formatDate,
    addNewStaff,
    
    // Data transformers
    dataTransformers
  };

  return (
    <RosterContext.Provider value={value}>
      {children}
    </RosterContext.Provider>
  );
};