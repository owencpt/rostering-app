import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePayment } from '../context/PaymentContext';
import { useRoster } from '../context/RosterContext';

const PaymentPage = () => {
  const {
    selectedPayPeriod,
    setSelectedPayPeriod,
    generatePayPeriods,
    calculatePayrollData,
    calculateTotals,
    getCurrentPayPeriodId,
    clockEntries
  } = usePayment();

  const { staff } = useRoster();
  const [payrollData, setPayrollData] = useState([]);
  const [totals, setTotals] = useState({ totalGross: 0, totalHours: 0, employeeCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (staff.length > 0) {
      setLoading(true);
      try {
        const calculatedPayroll = calculatePayrollData(staff);
        const calculatedTotals = calculateTotals(calculatedPayroll);
        
        setPayrollData(calculatedPayroll);
        setTotals(calculatedTotals);
      } catch (error) {
        console.error('Error calculating payroll:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [staff, calculatePayrollData, calculateTotals, selectedPayPeriod, clockEntries]);

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

  const goToCurrentPeriod = () => {
    const currentPeriodId = getCurrentPayPeriodId();
    setSelectedPayPeriod(currentPeriodId);
  };

  if (loading && staff.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Loading payroll data...</div>
          </div>
        </div>
      </div>
    );
  }

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
                      onClick={goToCurrentPeriod}
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
            {payrollData.length === 0 && !loading && (
              <p className="text-gray-500 text-sm mt-1">No clock entries found for this pay period</p>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-600">Calculating payroll...</div>
            </div>
          ) : payrollData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No staff members worked during this pay period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Staff Member</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Weekday Hours
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      After 10pm Hours
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Saturday Hours
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Sunday Hours
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      Holiday Hours
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Total Hours</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Gross Pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payrollData.map((staffMember) => {
                    // Only show staff who actually worked during this period
                    if (staffMember.payroll.shiftsWorked === 0) return null;

                    return (
                      <tr key={staffMember.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                              {staffMember.avatar}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{staffMember.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{staffMember.role}</div>
                              <div className="text-xs text-gray-400">Base: ${staffMember.payroll.basePay}/hr</div>
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
                            <div className="text-xs text-gray-400">{staffMember.payroll.shiftsWorked} shifts</div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="font-semibold text-lg">${staffMember.payroll.grossPay}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td className="px-6 py-4 font-semibold text-gray-900">TOTALS</td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      {payrollData.reduce((sum, staff) => sum + parseFloat(staff.payroll.hoursBreakdown.weekday || 0), 0).toFixed(2)}h
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      {payrollData.reduce((sum, staff) => sum + parseFloat(staff.payroll.hoursBreakdown.weekdayAfter10pm || 0), 0).toFixed(2)}h
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      {payrollData.reduce((sum, staff) => sum + parseFloat(staff.payroll.hoursBreakdown.saturday || 0), 0).toFixed(2)}h
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      {payrollData.reduce((sum, staff) => sum + parseFloat(staff.payroll.hoursBreakdown.sunday || 0), 0).toFixed(2)}h
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      {payrollData.reduce((sum, staff) => sum + parseFloat(staff.payroll.hoursBreakdown.publicHoliday || 0), 0).toFixed(2)}h
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-900">{totals.totalHours.toFixed(2)}h</td>
                    <td className="px-6 py-4 text-center font-bold text-lg text-green-600">${totals.totalGross.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;