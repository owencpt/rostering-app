import React from 'react';
import { Play, Square, Settings } from 'lucide-react';
import { useTimers } from '../hooks/useTimers';
import BreakTimer from './BreakTimer';

const ClockInOut = ({ 
  shift, 
  currentStaffMember, 
  clockStatus, 
  onClockAction, 
  onModifyShift 
}) => {
  const { breakTimers, formatBreakTime } = useTimers();
  
  const currentClockStatus = clockStatus[shift.id];
  const breakData = breakTimers[shift.staffId];
  
  // Check if staff is currently clocked into ANY other shift
  const staffActiveClockedShift = Object.entries(clockStatus).find(([shiftId, status]) => {
    return status && 
           status.staff_id === shift.staffId && 
           shiftId !== shift.id.toString() &&
           status.clock_in_time && 
           !status.clock_out_time;
  });

  const getActionButtons = () => {
    // If this shift has been completed (clocked out), always show modify
    if (currentClockStatus?.canModifyShift) {
      return (
        <button
          onClick={() => onModifyShift(shift.id)}
          className="px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Settings className="w-4 h-4" />
          <span>Modify Shift</span>
        </button>
      );
    }
    
    // If staff is clocked into a different shift, show disabled state
    if (staffActiveClockedShift) {
      return (
        <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
          Cannot clock in - Currently clocked into another shift
        </div>
      );
    }
    
    // If currently clocked into THIS shift
    if (currentClockStatus?.isClockedIn && !currentClockStatus?.canModifyShift) {
      if (breakData?.isOnBreak) {
        // On break - show end break only
        return (
          <button
            onClick={() => onClockAction(shift.id, 'end_break')}
            className="px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Play className="w-4 h-4" />
            <span>End Break</span>
          </button>
        );
      } else {
        // Clocked in, not on break - show start break and clock out
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => onClockAction(shift.id, 'start_break')}
              className="px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <Square className="w-4 h-4" />
              <span>Start Break</span>
            </button>
            <button
              onClick={() => onClockAction(shift.id, 'out')}
              className="px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors bg-red-600 hover:bg-red-700 text-white"
            >
              <Square className="w-4 h-4" />
              <span>Clock Out</span>
            </button>
          </div>
        );
      }
    }
    
    // Default: not clocked in yet and no other active shifts
    return (
      <button
        onClick={() => onClockAction(shift.id, 'in')}
        className="px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors bg-green-600 hover:bg-green-700 text-white"
      >
        <Play className="w-4 h-4" />
        <span>Clock In</span>
      </button>
    );
  };

  const getStatusMessage = () => {
    if (!currentClockStatus) {
      return 'Not clocked in';
    }
    
    if (currentClockStatus.canModifyShift) {
      const clockOutTime = new Date(currentClockStatus.clock_out_time).toLocaleTimeString();
      const totalBreak = currentClockStatus.total_break_duration_minutes;
      let message = `Clocked out at ${clockOutTime}`;
      if (totalBreak > 0) {
        const hours = Math.floor(totalBreak / 60);
        const minutes = totalBreak % 60;
        const breakText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        message += ` (${breakText} break taken)`;
      }
      return message;
    }
    
    if (breakData?.isOnBreak) {
      return 'Currently on break';
    }
    
    if (currentClockStatus.isClockedIn) {
      const clockInTime = new Date(currentClockStatus.clock_in_time).toLocaleTimeString();
      let message = `Clocked in at ${clockInTime}`;
      
      const breakText = formatBreakTime(shift.staffId);
      if (breakText) {
        message += ` (${breakText})`;
      }
      
      return message;
    }
    
    return 'Status unknown';
  };

  return (
    <div className={`p-4 rounded-lg border-2 ${
      staffActiveClockedShift ? 'border-gray-300 bg-gray-50' : 'border-blue-200 bg-blue-50'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{currentStaffMember?.name}</h3>
          <p className="text-gray-600">{shift.role}</p>
          <p className="text-sm text-gray-500">{shift.startTime} - {shift.endTime}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {getStatusMessage()}
            </p>
            <BreakTimer 
              staffId={shift.staffId} 
              isVisible={currentClockStatus?.isClockedIn && !currentClockStatus?.canModifyShift}
            />
          </div>
          {getActionButtons()}
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;