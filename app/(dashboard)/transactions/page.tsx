import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getTransactions } from "@/lib/queries";
import { getTrackingMode, scopeWhereForMode } from "@/lib/trackingMode";
import { TransactionTable } from "@/components/TransactionTable";
import { Download } from "lucide-react";

export default async function TransactionsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const trackingMode = await getTrackingMode();
  const transactions = await getTransactions(user.id, undefined, undefined, scopeWhereForMode(trackingMode));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Transactions</h1>
          <p className="text-sm text-text-muted">
            {trackingMode === "vehicle" ? "All your vehicle-related income and expenses." : "All your daily-life income and expenses."}
          </p>
        </div>
        <a
          href="/api/export/csv"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-slate-50"
        >
          <Download className="size-4" />
          Export CSV
        </a>
      </div>

      <TransactionTable transactions={transactions} />
    </div>
  );
}
