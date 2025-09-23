import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ModifyShiftModal = ({ isOpen, onClose, shift, clockEntry, onSave }) => {
  // Convert ISO time string to HH:mm format
  const formatTimeForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toTimeString().slice(0, 5); // Gets HH:mm from the time string
  };

  // Initialize state with current values from clockEntry
  const [clockInTime, setClockInTime] = useState('');
  const [clockOutTime, setClockOutTime] = useState('');
  const [breakDuration, setBreakDuration] = useState(0);

  // Update form when clockEntry changes
  useEffect(() => {
    if (clockEntry) {
      setClockInTime(formatTimeForInput(clockEntry.clock_in_time));
      setClockOutTime(formatTimeForInput(clockEntry.clock_out_time));
      setBreakDuration(clockEntry.total_break_duration_minutes || 0);
    }
  }, [clockEntry]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      clockInTime,
      clockOutTime,
      breakDuration: parseInt(breakDuration)
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Modify Shift Times</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clock In Time
            </label>
            <input
              type="time"
              value={clockInTime}
              onChange={(e) => setClockInTime(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clock Out Time
            </label>
            <input
              type="time"
              value={clockOutTime}
              onChange={(e) => setClockOutTime(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              value={breakDuration}
              onChange={(e) => setBreakDuration(e.target.value)}
              min="0"
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Display current shift info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Scheduled Shift</h3>
            <p className="text-sm text-gray-600">
              {shift.startTime} - {shift.endTime}
            </p>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifyShiftModal;