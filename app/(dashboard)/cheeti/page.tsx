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
import { getLoansGiven } from "@/lib/loanQueries";
import { getUsdToInrRate } from "@/lib/exchangeRate";
import { formatINR, formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { ChitFundTable } from "@/components/ChitFundTable";
import { ChitFundTrendChart } from "@/components/ChitFundTrendChart";
import { ChitFundGrowthChart } from "@/components/ChitFundGrowthChart";
import { ChitFundByGroupChart } from "@/components/ChitFundByGroupChart";
import { ChitFundPlanList } from "@/components/ChitFundPlanList";
import { LoanGivenList } from "@/components/LoanGivenList";

export default async function CheetiPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [contributions, plans, loans, usdRate] = await Promise.all([
    getChitFunds(user.id),
    getChitFundPlans(user.id),
    getLoansGiven(user.id),
    getUsdToInrRate(),
  ]);

  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth();

  const paid = contributions.filter((c) => c.type === "paid");
  const received = contributions.filter((c) => c.type === "received");

  const sumFor = (rows: typeof contributions, predicate?: (d: Date) => boolean) =>
    rows.filter((c) => !predicate || predicate(new Date(c.date))).reduce((sum, c) => sum + c.amount, 0);

  const totalSaved = sumFor(paid);
  const totalThisYear = sumFor(paid, (d) => d.getUTCFullYear() === thisYear);
  const totalThisMonth = sumFor(paid, (d) => d.getUTCFullYear() === thisYear && d.getUTCMonth() === thisMonth);

  const totalReceived = sumFor(received);
  const receivedThisYear = sumFor(received, (d) => d.getUTCFullYear() === thisYear);
  const receivedThisMonth = sumFor(
    received,
    (d) => d.getUTCFullYear() === thisYear && d.getUTCMonth() === thisMonth
  );

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

      {received.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-text-secondary">
            Total Received <span className="text-text-muted">(e.g. loan interest — kept separate from Total Saved)</span>
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryStat label="Total Received" amount={totalReceived} usdRate={usdRate} delayMs={0} received />
            <SummaryStat label="This Year" amount={receivedThisYear} usdRate={usdRate} delayMs={60} received />
            <SummaryStat label="This Month" amount={receivedThisMonth} usdRate={usdRate} delayMs={120} received />
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-medium text-text-secondary">Loans Given</p>
        <LoanGivenList loans={loans} contributions={contributions} usdRate={usdRate} />
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
  received = false,
}: {
  label: string;
  amount: number;
  usdRate: number;
  delayMs: number;
  highlight?: boolean;
  received?: boolean;
}) {
  return (
    <Card className="p-4" style={{ animationDelay: `${delayMs}ms` } as CSSProperties}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p
        className={
          highlight || received
            ? "mt-1 text-2xl font-semibold text-emerald-600 tabular-nums"
            : "mt-1 text-lg font-semibold text-text-primary tabular-nums"
        }
      >
        {received && amount > 0 ? "+" : ""}
        {formatINR(amount)}
      </p>
      {amount > 0 && <p className="text-xs text-text-muted tabular-nums">≈ {formatCurrency(amount / usdRate)}</p>}
    </Card>
  );
}
