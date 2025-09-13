import React from 'react';
import { useTimers } from '../hooks/useTimers';

const BreakTimer = ({ staffId, isVisible }) => {
  const { formatBreakTime } = useTimers();

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