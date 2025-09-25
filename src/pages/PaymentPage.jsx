import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Mock data - will come from context later
const mockStaff = [
  { id: 1, name: 'John Doe', role: 'admin', avatar: 'JD', base_pay: 25.00 },
  { id: 2, name: 'Jane Smith', role: 'server', avatar: 'JS', base_pay: 18.50 },
  { id: 3, name: 'Mike Johnson', role: 'chef', avatar: 'MJ', base_pay: 22.00 }
];

const mockClockEntries = [
  {
    id: 1,
    staff_id: 2,
    date: '2025-01-15',
    clock_in_time: '2025-01-15T09:00:00Z',
    clock_out_time: '2025-01-15T17:00:00Z',
    total_break_duration_minutes: 30
  },
  {
    id: 2,
    staff_id: 3,
    date: '2025-01-15',
    clock_in_time: '2025-01-15T10:00:00Z',
    clock_out_time: '2025-01-15T18:00:00Z',
    total_break_duration_minutes: 45
  }
];

const PaymentPage = () => {

  // useEffect(() => {
  //   console.log('=== PaymentPage Debug ===', {
  //     mockStaffLength: mockStaff.length,
  //     mockClockEntriesLength: mockClockEntries.length
  //   });
  // }, []);

  const [selectedPayPeriod, setSelectedPayPeriod] = useState('2025-01-1');

  const getCurrentPayPeriodId = () => {
    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    return day <= 14 ? `${year}-${month}-1` : `${year}-${month}-15`;
  };

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
          label: `${start.toLocaleDateString("en-US", { month: "short" })} 1-14, ${start.getFullYear()}`,
        });
      }

      if (i % 2 !== 0 || i === 5) {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 15);
        const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        periods.push({
          id: `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1).toString().padStart(2, "0")}-15`,
          start,
          end,
          label: `${start.toLocaleDateString("en-US", { month: "short" })} 15-${end.getDate()}, ${start.getFullYear()}`,
        });
      }
    }
    return periods.sort((a, b) => a.start - b.start);
  };

  const payPeriods = generatePayPeriods();
  const currentIndex = payPeriods.findIndex((p) => p.id === selectedPayPeriod);
  const activePeriod = payPeriods[currentIndex];

  const goPrevious = () => {
    if (currentIndex > 0) setSelectedPayPeriod(payPeriods[currentIndex - 1].id);
  };

  const goNext = () => {
    if (currentIndex < payPeriods.length - 1)
      setSelectedPayPeriod(payPeriods[currentIndex + 1].id);
  };

  // Mock payroll calculation
  const calculateStaffPayroll = (staffMember, payPeriod) => {
    const staffEntries = mockClockEntries.filter(entry => entry.staff_id === staffMember.id);
    
    let totalHours = 0;
    let totalBreakMinutes = 0;
    let grossPay = 0;

    staffEntries.forEach(entry => {
      const clockIn = new Date(entry.clock_in_time);
      const clockOut = new Date(entry.clock_out_time);
      const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
      const breakHours = (entry.total_break_duration_minutes || 0) / 60;
      const payableHours = Math.max(0, hoursWorked - breakHours);

      totalHours += hoursWorked;
      totalBreakMinutes += entry.total_break_duration_minutes || 0;
      grossPay += payableHours * staffMember.base_pay;
    });

    const breakHours = totalBreakMinutes / 60;
    const totalPayableHours = Math.max(0, totalHours - breakHours);

    return {
      totalHours: totalHours.toFixed(2),
      breakHours: breakHours.toFixed(2),
      payableHours: totalPayableHours.toFixed(2),
      grossPay: grossPay.toFixed(2),
      shiftsWorked: staffEntries.length,
      hoursBreakdown: {
        weekday: totalPayableHours.toFixed(2),
        weekdayAfter10pm: '0.00',
        saturday: '0.00',
        sunday: '0.00',
        publicHoliday: '0.00',
      }
    };
  };

  const payrollData = mockStaff.map((staffMember) => ({
    ...staffMember,
    payroll: calculateStaffPayroll(staffMember, activePeriod),
  }));

  const totals = payrollData.reduce(
    (acc, staff) => ({
      totalGross: acc.totalGross + parseFloat(staff.payroll.grossPay),
      totalHours: acc.totalHours + parseFloat(staff.payroll.payableHours),
      employeeCount: acc.employeeCount + (staff.payroll.shiftsWorked > 0 ? 1 : 0),
    }),
    { totalGross: 0, totalHours: 0, employeeCount: 0 }
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Breakdown</h1>
              <p className="text-gray-600">Review payroll calculations for staff members</p>
            </div>
          </div>

          {/* Pay Period Info Box */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Pay Period</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goPrevious}
                    disabled={currentIndex === 0}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <p className="text-white text-xl font-bold">
                    {activePeriod?.label}
                  </p>
                  <button
                    onClick={goNext}
                    disabled={currentIndex === payPeriods.length - 1}
                    className="p-1 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Current Period Indicator */}
                {(() => {
                  const currentPeriodId = getCurrentPayPeriodId();
                  const isCurrentPeriod = selectedPayPeriod === currentPeriodId;
                  
                  return !isCurrentPeriod && (
                    <button
                      onClick={() => setSelectedPayPeriod(currentPeriodId)}
                      className="mt-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-xs font-medium transition-colors"
                    >
                      Go to Current Period
                    </button>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Total Hours</h3>
                <p className="text-2xl font-bold">{totals.totalHours.toFixed(2)}h</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Gross Payroll</h3>
                <p className="text-2xl font-bold">${totals.totalGross.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Number of Employees</h3>
                <p className="text-2xl font-bold">{totals.employeeCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Payroll Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Staff Payroll Details</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Staff Member</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Weekday Hours</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">After 10pm Hours</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Saturday Hours</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Sunday Hours</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Holiday Hours</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Total Hours</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Gross Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrollData.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                          {staffMember.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{staffMember.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{staffMember.role}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">{staffMember.payroll.hoursBreakdown.weekday}h</td>
                    <td className="px-6 py-4 text-center">{staffMember.payroll.hoursBreakdown.weekdayAfter10pm}h</td>
                    <td className="px-6 py-4 text-center">{staffMember.payroll.hoursBreakdown.saturday}h</td>
                    <td className="px-6 py-4 text-center">{staffMember.payroll.hoursBreakdown.sunday}h</td>
                    <td className="px-6 py-4 text-center">{staffMember.payroll.hoursBreakdown.publicHoliday}h</td>

                    <td className="px-6 py-4 text-center">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{staffMember.payroll.payableHours}h</div>
                        <div className="text-gray-500">{staffMember.payroll.breakHours}h breaks</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center font-semibold">${staffMember.payroll.grossPay}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;