import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import {
  getChitFunds,
  getChitFundPlans,
  getChitFundMonthlyTrend,
  getChitFundCumulativeTrend,
  groupChitFundsByGroup,
} from "@/lib/chitFundQueries";
import { getUsdToInrRate } from "@/lib/exchangeRate";
import { formatINR, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { ChitFundTable } from "@/components/ChitFundTable";
import { ChitFundTrendChart } from "@/components/ChitFundTrendChart";
import { ChitFundGrowthChart } from "@/components/ChitFundGrowthChart";
import { ChitFundByGroupChart } from "@/components/ChitFundByGroupChart";
import { ChitFundPlanList } from "@/components/ChitFundPlanList";

export default async function CheetiPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [contributions, plans, usdRate] = await Promise.all([
    getChitFunds(user.id),
    getChitFundPlans(user.id),
    getUsdToInrRate(),
  ]);

  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth();

  const totalSaved = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalThisYear = contributions
    .filter((c) => new Date(c.date).getUTCFullYear() === thisYear)
    .reduce((sum, c) => sum + c.amount, 0);
  const totalThisMonth = contributions
    .filter((c) => {
      const d = new Date(c.date);
      return d.getUTCFullYear() === thisYear && d.getUTCMonth() === thisMonth;
    })
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Cheeti</h1>
        <p className="text-sm text-text-muted">
          Track your monthly chit fund contributions and total savings — kept separate from your income
          and expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryStat label="Total Saved" amount={totalSaved} usdRate={usdRate} delayMs={0} highlight />
        <SummaryStat label="This Year" amount={totalThisYear} usdRate={usdRate} delayMs={60} />
        <SummaryStat label="This Month" amount={totalThisMonth} usdRate={usdRate} delayMs={120} />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-text-secondary">Recurring Plans</p>
        <ChitFundPlanList plans={plans} usdRate={usdRate} />
      </div>

      <ChitFundGrowthChart data={getChitFundCumulativeTrend(contributions, 6)} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChitFundTrendChart data={getChitFundMonthlyTrend(contributions, 6)} />
        <ChitFundByGroupChart data={groupChitFundsByGroup(contributions)} usdRate={usdRate} />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-text-secondary">All Contributions</p>
        <ChitFundTable contributions={contributions} usdRate={usdRate} />
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  amount,
  usdRate,
  delayMs,
  highlight = false,
}: {
  label: string;
  amount: number;
  usdRate: number;
  delayMs: number;
  highlight?: boolean;
}) {
  return (
    <Card className="p-4" style={{ animationDelay: `${delayMs}ms` } as CSSProperties}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p
        className={
          highlight
            ? "mt-1 text-2xl font-semibold text-emerald-600 tabular-nums"
            : "mt-1 text-lg font-semibold text-text-primary tabular-nums"
        }
      >
        {formatINR(amount)}
      </p>
      {amount > 0 && <p className="text-xs text-text-muted tabular-nums">≈ {formatCurrency(amount / usdRate)}</p>}
    </Card>
  );
}
