import React from 'react';
import { useTimer } from '../context/TimerContext';

const BreakTimer = ({ staffId, isVisible }) => {
  const { formatBreakTime } = useTimer();

  if (!isVisible) return null;

  const breakText = formatBreakTime(staffId);
  
  if (!breakText) return null;

  return (
    <div className="text-xs text-orange-600 mt-1">
      {breakText}
    </div>
  );
};

export default BreakTimer;