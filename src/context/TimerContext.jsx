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
  const [clockStatus, setClockStatus] = useState({});
  const [breakTimers, setBreakTimers] = useState({});
  const [clockEntries, setClockEntries] = useState([]);

  // Break timer management
  const startBreakTimer = (staffId) => {
    const now = Date.now();
    setBreakTimers((prev) => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        isOnBreak: true,
        currentBreakStart: now,
        totalBreakTime: prev[staffId]?.totalBreakTime || 0,
      },
    }));
  };

  const endBreakTimer = (staffId) => {
    setBreakTimers((prev) => {
      const current = prev[staffId];
      if (!current?.isOnBreak || !current.currentBreakStart) return prev;

      const breakDuration = Date.now() - current.currentBreakStart;

      return {
        ...prev,
        [staffId]: {
          ...current,
          isOnBreak: false,
          currentBreakStart: null,
          totalBreakTime: current.totalBreakTime + breakDuration,
        },
      };
    });
  };

  const resetBreakTimer = (staffId) => {
    setBreakTimers((prev) => {
      const newState = { ...prev };
      delete newState[staffId];
      return newState;
    });
  };

  const getTotalBreakMinutes = (staffId) => {
    const breakData = breakTimers[staffId];
    if (!breakData) return 0;

    let total = breakData.totalBreakTime || 0;
    if (breakData.isOnBreak && breakData.currentBreakStart) {
      total += Date.now() - breakData.currentBreakStart;
    }

    return Math.round(total / (1000 * 60));
  };

  const formatBreakTime = (staffId) => {
    const totalMinutes = getTotalBreakMinutes(staffId);
    if (totalMinutes === 0) return '';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0
      ? `${hours}h ${minutes}m break taken`
      : `${minutes}m break taken`;
  };

  // Clock status management
  const loadCurrentClockStatus = async (currentStaffMember, shifts) => {
    if (!currentStaffMember) return;

    try {
      const today = formatDate(new Date());
      const todayShifts = shifts.filter(
        (shift) =>
          shift.staffId === currentStaffMember.id && shift.date === today
      );

      for (const shift of todayShifts) {
        const shiftStatus = await clockService.getShiftStatus(
          currentStaffMember.id,
          shift.id
        );

        setClockStatus((prev) => ({
          ...prev,
          [shift.id]: shiftStatus,
        }));
      }
    } catch (error) {
      console.error('Error loading clock status:', error);
    }
  };

  // Clock in/out/break handler
  const handleClockInOut = async (shiftId, action, shifts, currentStaffMember) => {
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    try {
      if (action === 'in') {
        await clockService.clockIn(shift.staffId, shiftId);
        resetBreakTimer(shift.staffId);

      } else if (action === 'out') {
        const totalBreakMinutes = getTotalBreakMinutes(shift.staffId);
        await clockService.clockOut(shift.staffId, totalBreakMinutes);
        resetBreakTimer(shift.staffId);

      } else if (action === 'start_break') {
        startBreakTimer(shift.staffId);

      } else if (action === 'end_break') {
        endBreakTimer(shift.staffId);
      }

      // Auto-refresh clock status on in/out
      if (action === 'in' || action === 'out') {
        await loadCurrentClockStatus(currentStaffMember, shifts);
      }
    } catch (error) {
      console.error('Error with clock action:', error);
      throw error; // let components handle display
    }
  };

  // Load clock entries for a pay period
  const loadClockEntries = async (selectedPayPeriod) => {
    if (!selectedPayPeriod) return;

    try {
      const payPeriods = generatePayPeriods();
      const selectedPeriod = payPeriods.find((p) => p.id === selectedPayPeriod);

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

  // Pay period generator (moved out of nested scope)
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
          id: `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-1`,
          start,
          end,
        });
      }

      if (i % 2 !== 0 || i === 5) {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 15);
        const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        periods.push({
          id: `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-15`,
          start,
          end,
        });
      }
    }
    return periods.sort((a, b) => a.start - b.start);
  };

  // Utility
  const formatDate = (date) => date.toISOString().split('T')[0];

  const value = {
    clockStatus,
    breakTimers,
    clockEntries,

    // Break timer functions
    startBreakTimer,
    endBreakTimer,
    getTotalBreakMinutes,
    resetBreakTimer,
    formatBreakTime,

    // Clock functions
    loadCurrentClockStatus,
    handleClockInOut,
    loadClockEntries,

    // State setters
    setClockStatus,
    setClockEntries,

    // Utility
    formatDate,
  };

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
};
