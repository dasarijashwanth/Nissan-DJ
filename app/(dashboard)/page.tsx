import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getSummary, getMonthlyChartData } from "@/lib/queries";
import {
  getOrCreateCar,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getInsurancePolicies,
} from "@/lib/carQueries";
import { getBudgetsWithSpending } from "@/lib/budgetQueries";
import { getDueTodayCount } from "@/lib/recurringQueries";
import { calcSavingsRate, getBudgetStatus } from "@/lib/analyticsUtils";
import { calcMonthCarCost } from "@/lib/carUtils";
import { monthRange, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SummaryCards } from "@/components/SummaryCards";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SavingsRateMeter } from "@/components/SavingsRateMeter";
import { BudgetStatusStrip } from "@/components/BudgetStatusStrip";
import { ExportMenu } from "@/components/ExportMenu";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const now = new Date();
  const { start, end } = monthRange(now.getUTCFullYear(), now.getUTCMonth());
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const [summary, chartData, car, budgets, dueTodayCount] = await Promise.all([
    getSummary(user.id, start, end),
    getMonthlyChartData(user.id),
    getOrCreateCar(user.id),
    getBudgetsWithSpending(user.id, month, year),
    getDueTodayCount(user.id),
  ]);

  const [fuelLogs, maintenanceLogs, repairLogs, insurancePolicies] = await Promise.all([
    getFuelLogs(car.id),
    getMaintenanceLogs(car.id),
    getRepairLogs(car.id),
    getInsurancePolicies(car.id),
  ]);

  const carCostThisMonth = calcMonthCarCost(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, now);
  const savingsRate = calcSavingsRate(summary.totalIncome, summary.totalExpenses);
  const budgetPills = budgets.map((b) => ({ category: b.category, status: getBudgetStatus(b.spent, b.amount) }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">This month at a glance.</p>
        </div>
        <ExportMenu month={month} year={year} userEmail={user.email ?? ""} />
      </div>

      {dueTodayCount > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              {dueTodayCount} recurring transaction{dueTodayCount > 1 ? "s are" : " is"} due today
            </p>
          </div>
          <Link
            href="/recurring"
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
          >
            Review
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <SummaryCards {...summary} />
        </div>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-slate-500">Car Cost</p>
          </div>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">
            {formatCurrency(carCostThisMonth)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SavingsRateMeter rate={savingsRate} />
        </div>
        <div className="flex flex-col justify-center gap-2 lg:col-span-2">
          <p className="text-xs font-medium text-slate-500">Budget Status</p>
          <BudgetStatusStrip budgets={budgetPills} />
          {budgetPills.length === 0 && (
            <p className="text-sm text-slate-400">
              No budgets set.{" "}
              <Link href="/budgets" className="text-indigo-600 hover:text-indigo-700">
                Set one up
              </Link>
              .
            </p>
          )}
        </div>
      </div>

      <MonthlyChart data={chartData} />
    </div>
  );
}
