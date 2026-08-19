import Link from "next/link";
import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { AlertCircle, Car as CarIcon } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getSummary, getMonthlyChartData } from "@/lib/queries";
import {
  getPrimaryVehicle,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getInsurancePolicies,
  getOdometerLogs,
} from "@/lib/vehicleQueries";
import { getBudgetsWithSpending } from "@/lib/budgetQueries";
import { getDueTodayCount } from "@/lib/recurringQueries";
import { getUserPreferences } from "@/lib/preferencesQueries";
import { calcSavingsRate, getBudgetStatus } from "@/lib/analyticsUtils";
import { calcMonthVehicleCost } from "@/lib/vehicleUtils";
import { getWeeklyStats } from "@/lib/vehicleAnalytics";
import { monthRange, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SummaryCards } from "@/components/SummaryCards";
import { MonthlyChart } from "@/components/MonthlyChart";
import { SavingsRateMeter } from "@/components/SavingsRateMeter";
import { BudgetStatusStrip } from "@/components/BudgetStatusStrip";
import { ExportMenu } from "@/components/ExportMenu";
import { HeroGreeting } from "@/components/dashboard/HeroGreeting";
import { WeeklyMileageCard } from "@/components/dashboard/WeeklyMileageCard";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const now = new Date();
  const { start, end } = monthRange(now.getUTCFullYear(), now.getUTCMonth());
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const [summary, chartData, vehicle, budgets, dueTodayCount, preferences] = await Promise.all([
    getSummary(user.id, start, end),
    getMonthlyChartData(user.id),
    getPrimaryVehicle(user.id),
    getBudgetsWithSpending(user.id, month, year),
    getDueTodayCount(user.id),
    getUserPreferences(user.id),
  ]);

  const [fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, odometerLogs] = vehicle
    ? await Promise.all([
        getFuelLogs(vehicle.id),
        getMaintenanceLogs(vehicle.id),
        getRepairLogs(vehicle.id),
        getInsurancePolicies(vehicle.id),
        getOdometerLogs(vehicle.id),
      ])
    : [[], [], [], [], []];

  const carCostThisMonth = calcMonthVehicleCost(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, now);
  const savingsRate = calcSavingsRate(summary.totalIncome, summary.totalExpenses);
  const budgetPills = budgets.map((b) => ({ category: b.category, status: getBudgetStatus(b.spent, b.amount) }));
  const weeklyStats = getWeeklyStats(fuelLogs, maintenanceLogs, repairLogs, odometerLogs, now);

  const displayName = preferences.displayName || user.email?.split("@")[0] || "";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <HeroGreeting name={displayName} />
        <div className="pt-6">
          <ExportMenu month={month} year={year} userEmail={user.email ?? ""} />
        </div>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-3">
          <SummaryCards {...summary} />
        </div>
        {vehicle ? (
          <>
            <Card
              className="card-stat p-5"
              style={{ "--card-accent-color": "var(--color-accent)", animationDelay: "180ms" } as CSSProperties}
            >
              <p className="text-sm font-medium text-text-muted">Car Cost</p>
              <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">
                {formatCurrency(carCostThisMonth)}
              </p>
            </Card>
            <WeeklyMileageCard {...weeklyStats} style={{ animationDelay: "240ms" }} />
          </>
        ) : (
          <Card
            className="flex flex-col items-center justify-center gap-2 p-5 text-center sm:col-span-2"
            style={{ animationDelay: "180ms" }}
          >
            <CarIcon className="size-6 text-amber-500" />
            <p className="text-sm font-medium text-text-secondary">No vehicle yet</p>
            <Link href="/vehicles/new" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Add your vehicle →
            </Link>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SavingsRateMeter rate={savingsRate} />
        </div>
        <div className="flex flex-col justify-center gap-2 lg:col-span-2">
          <p className="text-xs font-medium text-text-muted">Budget Status</p>
          <BudgetStatusStrip budgets={budgetPills} />
          {budgetPills.length === 0 && (
            <p className="text-sm text-text-muted">
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
