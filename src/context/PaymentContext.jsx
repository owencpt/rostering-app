import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { clockService } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";

const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
  const { user } = useAuth();
  const [clockEntries, setClockEntries] = useState([]);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState(
    getCurrentPayPeriodId()
  );

  function getCurrentPayPeriodId() {
    const today = new Date();
    const day = today.getDate();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, "0");
    return day <= 14 ? `${year}-${month}-1` : `${year}-${month}-15`;
  }

  // ---------------------------
  // Helpers & Memoized Functions
  // ---------------------------
  const generatePayPeriods = useCallback(() => {
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
            .padStart(2, "0")}-1`,
          start,
          end,
          label: `${start.toLocaleDateString("en-US", {
            month: "short",
          })} 1-14, ${start.getFullYear()}`,
        });
      }

      if (i % 2 !== 0 || i === 5) {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 15);
        const end = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth() + 1,
          0
        );
        periods.push({
          id: `${baseDate.getFullYear()}-${(baseDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-15`,
          start,
          end,
          label: `${start.toLocaleDateString("en-US", {
            month: "short",
          })} 15-${end.getDate()}, ${start.getFullYear()}`,
        });
      }
    }
    return periods.sort((a, b) => a.start - b.start);
  }, []);

  const getShiftType = useCallback((date, clockInTime, clockOutTime) => {
    const shiftDate = new Date(date);
    const dayOfWeek = shiftDate.getDay();
    const isPublicHoliday = false; // TODO: implement holiday detection

    if (isPublicHoliday) return "publicHoliday";
    if (dayOfWeek === 0) return "sunday";
    if (dayOfWeek === 6) return "saturday";

    const clockIn = new Date(clockInTime);
    const clockOut = new Date(clockOutTime);
    const tenPM = new Date(clockIn);
    tenPM.setHours(22, 0, 0, 0);

    if (clockOut > tenPM) return "weekdayAfter10pm";
    return "weekday";
  }, []);

  const calculateStaffPayroll = useCallback(
    (staffMember, payPeriod) => {
      const startDate = payPeriod.start.toISOString().split("T")[0];
      const endDate = payPeriod.end.toISOString().split("T")[0];
      const staffClockEntries = clockEntries.filter(
        (entry) =>
          entry.staff_id === staffMember.id &&
          entry.date >= startDate &&
          entry.date <= endDate &&
          entry.clock_in_time &&
          entry.clock_out_time
      );

      let totalHours = 0;
      let totalBreakMinutes = 0;
      let shiftsWorked = 0;

      const basePay = staffMember.base_pay || 25;
      const rates = {
        weekday: basePay,
        weekdayAfter10pm: basePay * 1.2,
        saturday: basePay * 1.4,
        sunday: basePay * 1.6,
        publicHoliday: basePay * 2.0,
      };

      const hoursBreakdown = {
        weekday: 0,
        weekdayAfter10pm: 0,
        saturday: 0,
        sunday: 0,
        publicHoliday: 0,
      };
      let totalGrossPay = 0;

      staffClockEntries.forEach((entry) => {
        const clockIn = new Date(entry.clock_in_time);
        const clockOut = new Date(entry.clock_out_time);
        const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60);
        const breakHours = (entry.total_break_duration_minutes || 0) / 60;
        const payableHours = Math.max(0, hoursWorked - breakHours);

        const shiftType = getShiftType(
          entry.date,
          entry.clock_in_time,
          entry.clock_out_time
        );
        hoursBreakdown[shiftType] += payableHours;

        totalGrossPay += payableHours * rates[shiftType];

        totalHours += hoursWorked;
        totalBreakMinutes += entry.total_break_duration_minutes || 0;
        shiftsWorked++;
      });

      const breakHours = totalBreakMinutes / 60;
      const totalPayableHours = Math.max(0, totalHours - breakHours);

      return {
        totalHours: totalHours.toFixed(2),
        breakHours: breakHours.toFixed(2),
        payableHours: totalPayableHours.toFixed(2),
        hoursBreakdown: {
          weekday: hoursBreakdown.weekday.toFixed(2),
          weekdayAfter10pm: hoursBreakdown.weekdayAfter10pm.toFixed(2),
          saturday: hoursBreakdown.saturday.toFixed(2),
          sunday: hoursBreakdown.sunday.toFixed(2),
          publicHoliday: hoursBreakdown.publicHoliday.toFixed(2),
        },
        rates,
        basePay,
        grossPay: totalGrossPay.toFixed(2),
        shiftsWorked,
      };
    },
    [clockEntries, getShiftType]
  );

  const calculatePayrollData = useCallback(
    (staff) => {
      const payPeriods = generatePayPeriods();
      const activePeriod = payPeriods.find((p) => p.id === selectedPayPeriod);
      if (!activePeriod) return [];

      return staff.map((staffMember) => ({
        ...staffMember,
        payroll: calculateStaffPayroll(staffMember, activePeriod),
      }));
    },
    [generatePayPeriods, selectedPayPeriod, calculateStaffPayroll]
  );

  const calculateTotals = useCallback((payrollData) => {
    return payrollData.reduce(
      (acc, staff) => ({
        totalGross: acc.totalGross + parseFloat(staff.payroll.grossPay),
        totalHours: acc.totalHours + parseFloat(staff.payroll.payableHours),
        employeeCount: acc.employeeCount + (staff.payroll.shiftsWorked > 0 ? 1 : 0),
      }),
      { totalGross: 0, totalHours: 0, employeeCount: 0 }
    );
  }, []);

  const updateClockEntry = useCallback(
    async (entryId, clockInTime, clockOutTime) => {
      try {
        await clockService.updateClockEntry(entryId, clockInTime, clockOutTime);

        // refresh clock entries
        const payPeriods = generatePayPeriods();
        const selectedPeriod = payPeriods.find(
          (p) => p.id === selectedPayPeriod
        );

        if (selectedPeriod) {
          const startDate = selectedPeriod.start.toISOString().split("T")[0];
          const endDate = selectedPeriod.end.toISOString().split("T")[0];
          const data = await clockService.getClockEntries(startDate, endDate);
          setClockEntries(data);
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating clock entry:", error);
        return { success: false, error: error.message };
      }
    },
    [generatePayPeriods, selectedPayPeriod]
  );

  // ---------------------------
  // Context value (memoized)
  // ---------------------------
  const value = useMemo(
    () => ({
      clockEntries,
      selectedPayPeriod,
      setSelectedPayPeriod,
      generatePayPeriods,
      calculatePayrollData,
      calculateTotals,
      updateClockEntry,
      getCurrentPayPeriodId,
      getShiftType,
      calculateStaffPayroll,
    }),
    [
      clockEntries,
      selectedPayPeriod,
      generatePayPeriods,
      calculatePayrollData,
      calculateTotals,
      updateClockEntry,
      getShiftType,
      calculateStaffPayroll,
    ]
  );

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
};

// Define hook after provider for HMR safety
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
};
