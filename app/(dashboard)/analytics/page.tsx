import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet, Receipt, Tag, Car as CarIcon } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getTransactions } from "@/lib/queries";
import {
  getOrCreateCar,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getOdometerLogs,
  getInsurancePolicies,
} from "@/lib/carQueries";
import {
  calcSavingsRate,
  groupByCategory,
  getMonthlyTrend,
  getTopCategories,
  getPeriodRange,
  type AnalyticsPeriod,
} from "@/lib/analyticsUtils";
import { getMonthlyCarCosts, getCostPerMileTrend } from "@/lib/carAnalytics";
import { calcTotalCarSpend } from "@/lib/carUtils";
import { formatCurrency, monthRange, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SavingsRateCard } from "@/components/analytics/SavingsRateCard";
import { IncomeExpenseTrend } from "@/components/analytics/IncomeExpenseTrend";
import { SpendingDonutChart } from "@/components/analytics/SpendingDonutChart";
import { CategoryBreakdownTable } from "@/components/analytics/CategoryBreakdownTable";
import { CarCostTrendChart } from "@/components/analytics/CarCostTrendChart";
import { MonthOverMonthCard } from "@/components/analytics/MonthOverMonthCard";
import { ExportMenu } from "@/components/ExportMenu";

const PERIOD_TABS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "month", label: "This month" },
  { key: "3m", label: "Last 3 months" },
  { key: "6m", label: "Last 6 months" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

export default async function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const rawPeriod = Array.isArray(params.period) ? params.period[0] : params.period;
  const selectedPeriod: AnalyticsPeriod = PERIOD_TABS.some((t) => t.key === rawPeriod)
    ? (rawPeriod as AnalyticsPeriod)
    : "month";

  const [transactions, car] = await Promise.all([getTransactions(user.id), getOrCreateCar(user.id)]);

  const [fuelLogs, maintenanceLogs, repairLogs, odometerLogs, insurancePolicies] = await Promise.all([
    getFuelLogs(car.id),
    getMaintenanceLogs(car.id),
    getRepairLogs(car.id),
    getOdometerLogs(car.id),
    getInsurancePolicies(car.id),
  ]);

  const earliestDate =
    transactions.length > 0
      ? new Date(Math.min(...transactions.map((t) => new Date(t.date).getTime())))
      : undefined;

  const { start, end, months } = getPeriodRange(selectedPeriod, earliestDate);
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

  const periodCarLogs = {
    fuel: fuelLogs.filter((l) => inPeriod(l.date)),
    maintenance: maintenanceLogs.filter((l) => inPeriod(l.date)),
    repair: repairLogs.filter((l) => inPeriod(l.date)),
    insurance: insurancePolicies.filter((p) => new Date(p.startDate) < end && new Date(p.renewalDate) >= start),
  };
  const carCostInPeriod = calcTotalCarSpend(
    periodCarLogs.fuel,
    periodCarLogs.maintenance,
    periodCarLogs.repair,
    periodCarLogs.insurance
  );
  const carCostPercent = periodExpenses > 0 ? (carCostInPeriod / periodExpenses) * 100 : 0;

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

  const monthlyCarCosts = getMonthlyCarCosts(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, months);
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
          <h1 className="text-xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">Deep dive into your finances and car costs.</p>
        </div>
        <ExportMenu month={now.getUTCMonth() + 1} year={now.getUTCFullYear()} userEmail={user.email ?? ""} />
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIOD_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/analytics?period=${tab.key}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              selectedPeriod === tab.key
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Wallet className="size-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">Net Savings</p>
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

        <SavingsRateCard rate={savingsRate} />

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Receipt className="size-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">Avg Monthly Spend</p>
          </div>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-slate-900">
            {formatCurrency(avgMonthlySpend)}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <Tag className="size-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">Biggest Expense</p>
          </div>
          <p className="mt-4 truncate text-lg font-semibold text-slate-900">
            {biggestCategory ? biggestCategory.category : "—"}
          </p>
          <p className="text-sm text-slate-500">{biggestCategory ? formatCurrency(biggestCategory.amount) : ""}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CarIcon className="size-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">Car Cost %</p>
          </div>
          <p className="mt-4 text-2xl font-semibold tabular-nums text-amber-600">{carCostPercent.toFixed(1)}%</p>
        </Card>
      </div>

      <IncomeExpenseTrend data={trendData} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SpendingDonutChart data={donutData} />
        <CategoryBreakdownTable rows={categoryBreakdownRows} />
      </div>

      <CarCostTrendChart monthlyCosts={monthlyCarCosts} costPerMileTrend={costPerMileTrend} />

      <MonthOverMonthCard data={momComparisonData} />
    </div>
  );
}
