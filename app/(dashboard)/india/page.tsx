import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getIndiaTransfers } from "@/lib/indiaTransferQueries";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { IndiaTransferTable } from "@/components/IndiaTransferTable";

export default async function IndiaTransfersPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const transfers = await getIndiaTransfers(user.id);

  const now = new Date();
  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth();

  const totalAllTime = transfers.reduce((sum, t) => sum + t.amount, 0);
  const totalThisYear = transfers
    .filter((t) => new Date(t.date).getUTCFullYear() === thisYear)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalThisMonth = transfers
    .filter((t) => {
      const d = new Date(t.date);
      return d.getUTCFullYear() === thisYear && d.getUTCMonth() === thisMonth;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Sent to India</h1>
        <p className="text-sm text-text-muted">
          A running note of money sent to family — kept separate from your income and expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryStat label="This Month" value={formatCurrency(totalThisMonth)} delayMs={0} />
        <SummaryStat label="This Year" value={formatCurrency(totalThisYear)} delayMs={60} />
        <SummaryStat label="All Time" value={formatCurrency(totalAllTime)} delayMs={120} />
      </div>

      <IndiaTransferTable transfers={transfers} />
    </div>
  );
}

function SummaryStat({ label, value, delayMs }: { label: string; value: string; delayMs: number }) {
  return (
    <Card className="p-4" style={{ animationDelay: `${delayMs}ms` } as CSSProperties}>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text-primary tabular-nums">{value}</p>
    </Card>
  );
}
