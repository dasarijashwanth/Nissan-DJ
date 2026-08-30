import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, PieChart } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { getTransactions, getSummary, getCategoryTotals } from "@/lib/queries";
import { getTrackingMode, scopeWhereForMode } from "@/lib/trackingMode";
import { monthLabel, monthRange, formatCurrency, cn, nowInAppTimezone } from "@/lib/utils";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionTable } from "@/components/TransactionTable";
import { Card } from "@/components/ui/Card";

export default async function MonthlyPage({ searchParams }: PageProps<"/monthly">) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const now = nowInAppTimezone();
  const year = Number(params.year) || now.getUTCFullYear();
  const month = params.month ? Number(params.month) - 1 : now.getUTCMonth();

  const { start, end } = monthRange(year, month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const trackingMode = await getTrackingMode();
  const scopeWhere = scopeWhereForMode(trackingMode);

  const [transactions, summary, categoryTotals] = await Promise.all([
    getTransactions(user.id, start, end, scopeWhere),
    getSummary(user.id, start, end, scopeWhere),
    getCategoryTotals(user.id, start, end, scopeWhere),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Monthly View</h1>
          <p className="text-sm text-text-muted">Browse totals for any month.</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/monthly?year=${prev.year}&month=${prev.month + 1}`}
            className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06]"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <span className="w-36 text-center text-sm font-medium text-text-primary">
            {monthLabel(year, month)}
          </span>
          <Link
            href={`/monthly?year=${next.year}&month=${next.month + 1}`}
            className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06]"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </Link>
        </div>
      </div>

      <SummaryCards {...summary} />

      <Card className="p-5">
        <p className="mb-4 text-sm font-medium text-text-secondary">Totals by Category</p>
        {categoryTotals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <PieChart className="size-6 text-slate-300" />
            <p className="text-sm text-text-muted">No transactions in {monthLabel(year, month)}.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.08]">
            {categoryTotals.map((c) => (
              <li key={`${c.category}-${c.type}`} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-text-secondary">{c.category}</span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    c.type === "income" ? "text-emerald-600" : "text-red-600"
                  )}
                >
                  {c.type === "income" ? "+" : "-"}
                  {formatCurrency(c.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TransactionTable transactions={transactions} />
    </div>
  );
}

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(Date.UTC(year, month + delta, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}
