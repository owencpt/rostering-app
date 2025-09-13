import React, { createContext, useContext, useState, useEffect } from 'react';
import { clockService } from '../lib/supabaseClient';

const TimerContext = createContext();

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockStatus, setClockStatus] = useState({});
  const [breakTimers, setBreakTimers] = useState({});
  const [clockEntries, setClockEntries] = useState([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Break timer management functions
  const startBreakTimer = (staffId) => {
    const now = Date.now();
    setBreakTimers(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        isOnBreak: true,
        currentBreakStart: now,
        totalBreakTime: prev[staffId]?.totalBreakTime || 0
      }
    }));
  };

  const endBreakTimer = (staffId) => {
    setBreakTimers(prev => {
      const current = prev[staffId];
      if (!current || !current.isOnBreak || !current.currentBreakStart) {
        return prev;
      }
      
      const breakDuration = Date.now() - current.currentBreakStart;
      
      return {
        ...prev,
        [staffId]: {
          ...current,
          isOnBreak: false,
          currentBreakStart: null,
          totalBreakTime: current.totalBreakTime + breakDuration
        }
      };
    });
  };

  const getTotalBreakMinutes = (staffId) => {
    const breakData = breakTimers[staffId];
    if (!breakData) return 0;
    
    let total = breakData.totalBreakTime || 0;
    
    // Add current break time if on break
    if (breakData.isOnBreak && breakData.currentBreakStart) {
      total += Date.now() - breakData.currentBreakStart;
    }
    
    return Math.round(total / (1000 * 60)); // Convert to minutes
  };

  const resetBreakTimer = (staffId) => {
    setBreakTimers(prev => {
      const newState = { ...prev };
      delete newState[staffId];
      return newState;
    });
  };

  const formatBreakTime = (staffId) => {
    const totalMinutes = getTotalBreakMinutes(staffId);
    if (totalMinutes === 0) return '';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m break taken`;
    }
    return `${minutes}m break taken`;
  };

  // Clock status management
  const loadCurrentClockStatus = async (currentStaffMember, shifts) => {
    console.log('Loading current clock status for:', currentStaffMember);
    
    if (!currentStaffMember) return;
    
    try {
      // Get today's shifts for current staff member
      const today = formatDate(new Date());
      const todayShifts = shifts.filter(shift => 
        shift.staffId === currentStaffMember.id && shift.date === today
      );

      // Load status for each shift individually
      for (const shift of todayShifts) {
        const shiftStatus = await clockService.getShiftStatus(currentStaffMember.id, shift.id);
        
        setClockStatus(prev => ({
          ...prev,
          [shift.id]: shiftStatus
        }));
      }
      
    } catch (error) {
      console.error('Error loading clock status:', error);
    }
  };

  // Clock in/out handler
  const handleClockInOut = async (shiftId, action, shifts) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;
    
    console.log('Clock action triggered:', { shiftId, action, shift });
    
    try {
      if (action === 'in') {
        console.log('Attempting to clock in...');
        
        await clockService.clockIn(shift.staffId, shiftId);
        
        // Reset break timer when clocking in
        resetBreakTimer(shift.staffId);
        
      } else if (action === 'out') {
        console.log('Attempting to clock out...');
        
        // Get total break time and send to database
        const totalBreakMinutes = getTotalBreakMinutes(shift.staffId);
        
        await clockService.clockOut(shift.staffId, totalBreakMinutes);
        
        // Reset break timer after clocking out
        resetBreakTimer(shift.staffId);
        
      } else if (action === 'start_break') {
        console.log('Starting break...');
        startBreakTimer(shift.staffId);
        
      } else if (action === 'end_break') {
        console.log('Ending break...');
        endBreakTimer(shift.staffId);
      }
      
      // Reload status after clock in/out (but not for breaks)
      if (action === 'in' || action === 'out') {
        // Return a flag to indicate status should be reloaded
        return { shouldReloadStatus: true };
      }
      
    } catch (error) {
      console.error('Error with clock action:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Load clock entries for a date range
  const loadClockEntries = async (selectedPayPeriod) => {
    if (!selectedPayPeriod) return;

    const fetchClockEntries = async () => {
      try {
        // Generate pay periods
        const generatePayPeriods = () => {
          const periods = [];
          const currentDate = new Date();

          for (let i = 5; i >= -6; i--) {
            const baseDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() - Math.floor(i / 2),
              1
            );

            if (i % 2 === 0 || i === 5) {
              const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
              const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), 14);
              periods.push({
                id: `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1).toString().padStart(2, "0")}-1`,
                start,
                end,
              });
            }

            if (i % 2 !== 0 || i === 5) {
              const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 15);
              const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
              periods.push({
                id: `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1).toString().padStart(2, "0")}-15`,
                start,
                end,
              });
            }
          }
          return periods.sort((a, b) => a.start - b.start);
        };

        const payPeriods = generatePayPeriods();
        const selectedPeriod = payPeriods.find(p => p.id === selectedPayPeriod);
        
        if (selectedPeriod) {
          const startDate = selectedPeriod.start.toISOString().split('T')[0];
          const endDate = selectedPeriod.end.toISOString().split('T')[0];
          
          const data = await clockService.getClockEntries(startDate, endDate);
          setClockEntries(data);
        }
      } catch (error) {
        console.error('Failed to fetch clock entries:', error);
        setClockEntries([]);
      }
    };

    await fetchClockEntries();
  };

  // Utility function
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const value = {
    // State
    currentTime,
    clockStatus,
    breakTimers,
    clockEntries,
    
    // Break timer functions
    startBreakTimer,
    endBreakTimer,
    getTotalBreakMinutes,
    resetBreakTimer,
    formatBreakTime,
    
    // Clock management functions
    loadCurrentClockStatus,
    handleClockInOut,
    loadClockEntries,
    
    // State setters (for external updates)
    setClockStatus,
    setClockEntries,
    
    // Utility functions
    formatDate
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};