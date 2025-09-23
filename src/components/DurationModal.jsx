import React, { useState } from 'react';
import { X } from 'lucide-react';

const DurationModal = ({ 
  isOpen, 
  onClose, 
  pendingShift, 
  onConfirm 
}) => {
  const [shiftDuration, setShiftDuration] = useState(5);

  if (!isOpen || !pendingShift) return null;

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

  const calculateEndTime = () => {
    const startHour = parseInt(pendingShift.startTime);
    const endTime = startHour + shiftDuration;
    const endHour = Math.floor(endTime);
    const endMinutes = (endTime % 1) * 60;
    return `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    setShiftDuration(5); // Reset to default
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(shiftDuration);
    setShiftDuration(5); // Reset to default
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Set Shift Duration</h3>
          <button 
            onClick={handleCancel}
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
            End time: {calculateEndTime()}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
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

export default DurationModal;