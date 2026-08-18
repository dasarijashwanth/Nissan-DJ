import { getTransactions } from "@/lib/queries";
import {
  getOrCreateCar,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getOdometerLogs,
  getInsurancePolicies,
} from "@/lib/carQueries";
import { getBudgetsWithSpending } from "@/lib/budgetQueries";
import { calcSavingsRate, groupByCategory, getBudgetStatus, getTopCategories } from "@/lib/analyticsUtils";
import { monthRange, monthLabel } from "@/lib/utils";
import type { MonthlyReport } from "@/lib/types";

export async function getMonthlyReport(userId: string, month: number, year: number): Promise<MonthlyReport> {
  const { start, end } = monthRange(year, month - 1);
  const inRange = (date: string) => {
    const d = new Date(date);
    return d >= start && d < end;
  };

  const [allTransactions, car, budgets] = await Promise.all([
    getTransactions(userId),
    getOrCreateCar(userId),
    getBudgetsWithSpending(userId, month, year),
  ]);

  const monthTransactions = allTransactions.filter((t) => inRange(t.date));
  const incomeTransactions = monthTransactions.filter((t) => t.type === "income");
  const expenseTransactions = monthTransactions.filter((t) => t.type === "expense");

  const incomeTotal = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const expensesTotal = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  const [fuelLogs, maintenanceLogs, repairLogs, odometerLogs, insurancePolicies] = await Promise.all([
    getFuelLogs(car.id),
    getMaintenanceLogs(car.id),
    getRepairLogs(car.id),
    getOdometerLogs(car.id),
    getInsurancePolicies(car.id),
  ]);

  const monthFuelLogs = fuelLogs.filter((l) => inRange(l.date));
  const monthMaintenanceLogs = maintenanceLogs.filter((l) => inRange(l.date));
  const monthRepairLogs = repairLogs.filter((l) => inRange(l.date));

  const monthFuel = monthFuelLogs.reduce((sum, l) => sum + l.totalCost, 0);
  const monthMaintenance = monthMaintenanceLogs.reduce((sum, l) => sum + l.cost, 0);
  const monthRepairs = monthRepairLogs.reduce((sum, l) => sum + l.cost, 0);
  const monthInsurance = insurancePolicies
    .filter((p) => new Date(p.startDate) < end && new Date(p.renewalDate) >= start)
    .reduce((sum, p) => sum + p.monthlyCost, 0);
  const carCostTotal = monthFuel + monthMaintenance + monthRepairs + monthInsurance;

  const allOdometerReadings = [
    ...fuelLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...maintenanceLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...repairLogs.map((l) => ({ date: l.date, odometer: l.odometer })),
    ...odometerLogs.map((l) => ({ date: l.date, odometer: l.miles })),
  ];
  const maxOdometerBefore = (date: Date) => {
    const readings = allOdometerReadings.filter((r) => new Date(r.date) < date).map((r) => r.odometer);
    return readings.length > 0 ? Math.max(...readings) : 0;
  };
  const milesDriven = Math.max(0, maxOdometerBefore(end) - maxOdometerBefore(start));
  const costPerMile = milesDriven > 0 ? carCostTotal / milesDriven : 0;

  return {
    month: monthLabel(year, month - 1),
    income: {
      total: incomeTotal,
      byCategory: groupByCategory(incomeTransactions),
      transactions: incomeTransactions,
    },
    expenses: {
      total: expensesTotal,
      byCategory: groupByCategory(expenseTransactions),
      transactions: expenseTransactions,
    },
    netSavings: incomeTotal - expensesTotal,
    savingsRate: calcSavingsRate(incomeTotal, expensesTotal),
    carCosts: {
      fuel: monthFuel,
      maintenance: monthMaintenance,
      repairs: monthRepairs,
      insurance: monthInsurance,
      total: carCostTotal,
      costPerMile,
    },
    budgets: budgets.map((b) => ({
      category: b.category,
      budgeted: b.amount,
      spent: b.spent,
      remaining: b.amount - b.spent,
      status: getBudgetStatus(b.spent, b.amount),
    })),
    topExpenseCategories: getTopCategories(expenseTransactions, 5).map((c) => ({
      category: c.category,
      amount: c.amount,
    })),
    carLogEntries: {
      fuel: monthFuelLogs,
      maintenance: monthMaintenanceLogs,
      repair: monthRepairLogs,
    },
  };
}
