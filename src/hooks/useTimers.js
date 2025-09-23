import { useState, useEffect } from 'react';

export const useTimers = () => {
  const [breakTimers, setBreakTimers] = useState({});

  const startBreakTimer = (staffId) => {
    setBreakTimers(prev => ({
      ...prev,
      [staffId]: {
        startTime: new Date(),
        isOnBreak: true,
        duration: 0
      }
    }));
  };

  const stopBreakTimer = (staffId) => {
    setBreakTimers(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        isOnBreak: false,
        endTime: new Date()
      }
    }));
  };

  const formatBreakTime = (staffId) => {
    const timer = breakTimers[staffId];
    if (!timer) return '';

    const totalMinutes = timer.duration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m break`;
    }
    return `${minutes}m break`;
  };

  // Update break durations every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setBreakTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(staffId => {
          if (updated[staffId].isOnBreak) {
            const duration = (new Date() - new Date(updated[staffId].startTime)) / 1000 / 60;
            updated[staffId].duration = duration;
          }
        });
        return updated;
      });
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  return {
    breakTimers,
    startBreakTimer,
    stopBreakTimer,
    formatBreakTime
  };
};