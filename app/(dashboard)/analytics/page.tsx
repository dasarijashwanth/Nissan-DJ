import Link from "next/link";
import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { Wallet, Receipt, Tag } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getTransactions } from "@/lib/queries";
import {
  getPrimaryVehicle,
  getVehiclesForUser,
  getVehicleComparisonData,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getOdometerLogs,
  getInsurancePolicies,
} from "@/lib/vehicleQueries";
import {
  calcSavingsRate,
  groupByCategory,
  getMonthlyTrend,
  getTopCategories,
  getPeriodRange,
  type AnalyticsPeriod,
} from "@/lib/analyticsUtils";
import { getMonthlyVehicleCosts, getCostPerMileTrend } from "@/lib/vehicleAnalytics";
import { getTrackingMode, scopeWhereForMode } from "@/lib/trackingMode";
import { formatCurrency, monthRange, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SavingsRateCard } from "@/components/analytics/SavingsRateCard";
import { IncomeExpenseTrend } from "@/components/analytics/IncomeExpenseTrend";
import { SpendingDonutChart } from "@/components/analytics/SpendingDonutChart";
import { CategoryBreakdownTable } from "@/components/analytics/CategoryBreakdownTable";
import { CarCostTrendChart } from "@/components/analytics/CarCostTrendChart";
import { MonthOverMonthCard } from "@/components/analytics/MonthOverMonthCard";
import { VehicleComparisonChart } from "@/components/analytics/VehicleComparisonChart";
import { ExportMenu } from "@/components/ExportMenu";

const PERIOD_TABS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

const TOP_TABS = [
  { key: "overview", label: "Overview" },
  { key: "vehicles", label: "Vehicles" },
] as const;

type TopTab = (typeof TOP_TABS)[number]["key"];

export default async function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const rawPeriod = Array.isArray(params.period) ? params.period[0] : params.period;
  const selectedPeriod: AnalyticsPeriod = PERIOD_TABS.some((t) => t.key === rawPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : "month";

  const trackingMode = await getTrackingMode();
  const isVehicleMode = trackingMode === "vehicle";
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const selectedTab: TopTab = isVehicleMode && TOP_TABS.some((t) => t.key === rawTab) ? (rawTab as TopTab) : "overview";

  const [transactions, vehicle] = await Promise.all([
    getTransactions(user.id, undefined, undefined, scopeWhereForMode(trackingMode)),
    getPrimaryVehicle(user.id),
  ]);

  const [fuelLogs, maintenanceLogs, repairLogs, odometerLogs, insurancePolicies] =
    vehicle && isVehicleMode
      ? await Promise.all([
          getFuelLogs(vehicle.id),
          getMaintenanceLogs(vehicle.id),
          getRepairLogs(vehicle.id),
          getOdometerLogs(vehicle.id),
          getInsurancePolicies(vehicle.id),
        ])
      : [[], [], [], [], []];

  const earliestDate =
    transactions.length > 0
      ? new Date(Math.min(...transactions.map((t) => new Date(t.date).getTime())))
      : undefined;

  const { start, end, months } = getPeriodRange(selectedPeriod, earliestDate);

  const vehicles = isVehicleMode ? await getVehiclesForUser(user.id) : [];
  const vehicleComparison =
    selectedTab === "vehicles" && vehicles.length >= 2 ? await getVehicleComparisonData(vehicles, months) : [];
  const inPeriod = (date: string) => {
    const d = new Date(date);
    return d >= start && d < end;
  };

  const periodTransactions = transactions.filter((t) => inPeriod(t.date));
  const periodIncome = periodTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const periodExpenses = periodTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netSavings = periodIncome - periodExpenses;
  const savingsRate = calcSavingsRate(periodIncome, periodExpenses);
  const avgMonthlySpend = periodExpenses / months;

  const expenseTransactions = periodTransactions.filter((t) => t.type === "expense");
  const biggestCategory = getTopCategories(expenseTransactions, 1)[0];

  const trendData = getMonthlyTrend(transactions, months);

  // "vs last month" is always the two most recent calendar months, independent of the period tab.
  const now = new Date();
  const thisMonthRange = monthRange(now.getUTCFullYear(), now.getUTCMonth());
  const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthRange = monthRange(lastMonthDate.getUTCFullYear(), lastMonthDate.getUTCMonth());

  const thisMonthExpenses = transactions.filter(
    (t) => t.type === "expense" && new Date(t.date) >= thisMonthRange.start && new Date(t.date) < thisMonthRange.end
  );
  const lastMonthExpenses = transactions.filter(
    (t) => t.type === "expense" && new Date(t.date) >= lastMonthRange.start && new Date(t.date) < lastMonthRange.end
  );

  const thisMonthByCategory = groupByCategory(thisMonthExpenses);
  const lastMonthByCategory = groupByCategory(lastMonthExpenses);
  const thisMonthTotal = Object.values(thisMonthByCategory).reduce((s, v) => s + v, 0);

  const categoryBreakdownRows = Object.entries(thisMonthByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: thisMonthTotal > 0 ? (amount / thisMonthTotal) * 100 : 0,
      previousAmount: lastMonthByCategory[category] ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const momComparisonData = categoryBreakdownRows
    .slice(0, 6)
    .map((row) => ({ category: row.category, current: row.amount, previous: row.previousAmount }));

  const donutData = Object.entries(groupByCategory(expenseTransactions)).map(([category, amount]) => ({
    category,
    amount,
  }));

  const monthlyCarCosts = getMonthlyVehicleCosts(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, months);
  const costPerMileTrend = getCostPerMileTrend(
    fuelLogs,
    maintenanceLogs,
    repairLogs,
    odometerLogs,
    monthlyCarCosts,
    months
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-muted">
            {isVehicleMode ? "Deep dive into your vehicle costs." : "Deep dive into your daily-life finances."}
          </p>
        </div>
        <ExportMenu month={now.getUTCMonth() + 1} year={now.getUTCFullYear()} userEmail={user.email ?? ""} />
      </div>

      {isVehicleMode && (
        <div className="flex flex-wrap gap-2 border-b border-black/[0.08] pb-3">
          {TOP_TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/analytics?tab=${tab.key}&period=${selectedPeriod}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                selectedTab === tab.key
                  ? "bg-slate-900 text-white"
                  : "border border-black/[0.08] bg-surface-card text-text-secondary hover:bg-black/[0.04]"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {PERIOD_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/analytics?tab=${selectedTab}&period=${tab.key}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selectedPeriod === tab.key
                ? "bg-indigo-600 text-white"
                : "border border-black/[0.08] bg-surface-card text-text-secondary hover:bg-black/[0.04]"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {selectedTab === "vehicles" ? (
        <VehicleComparisonChart data={vehicleComparison} />
      ) : (
        <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5" style={{ animationDelay: "0ms" } as CSSProperties}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/12 text-indigo-600 dark:text-indigo-400">
              <Wallet className="size-5" />
            </div>
            <p className="text-sm font-medium text-text-muted">Net Savings</p>
          </div>
          <p
            className={cn(
              "mt-4 text-2xl font-semibold tabular-nums",
              netSavings >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {formatCurrency(netSavings)}
          </p>
        </Card>

        <SavingsRateCard rate={savingsRate} style={{ animationDelay: "60ms" } as CSSProperties} />

        <Card className="p-5" style={{ animationDelay: "120ms" } as CSSProperties}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-black/[0.06] text-text-secondary">
              <Receipt className="size-5" />
            </div>
            <p className="text-sm font-medium text-text-muted">Avg Monthly Spend</p>
          </div>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-text-primary">
            {formatCurrency(avgMonthlySpend)}
          </p>
        </Card>

        <Card className="p-5" style={{ animationDelay: "180ms" } as CSSProperties}>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-black/[0.06] text-text-secondary">
              <Tag className="size-5" />
            </div>
            <p className="text-sm font-medium text-text-muted">Biggest Expense</p>
          </div>
          <p className="mt-4 truncate text-lg font-semibold text-text-primary">
            {biggestCategory ? biggestCategory.category : "—"}
          </p>
          <p className="text-sm text-text-muted">{biggestCategory ? formatCurrency(biggestCategory.amount) : ""}</p>
        </Card>

      </div>

      <IncomeExpenseTrend data={trendData} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpendingDonutChart data={donutData} />
        <CategoryBreakdownTable rows={categoryBreakdownRows} />
      </div>

      {isVehicleMode && <CarCostTrendChart monthlyCosts={monthlyCarCosts} costPerMileTrend={costPerMileTrend} />}

      <MonthOverMonthCard data={momComparisonData} />
        </>
      )}
    </div>
  );
}
