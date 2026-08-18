import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getTransactions } from "@/lib/queries";
import { TransactionTable } from "@/components/TransactionTable";
import { Download } from "lucide-react";

export default async function TransactionsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const transactions = await getTransactions(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500">All your income and expenses.</p>
        </div>
        <a
          href="/api/export/csv"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Download className="size-4" />
          Export CSV
        </a>
      </div>

      <TransactionTable transactions={transactions} />
    </div>
  );
}
