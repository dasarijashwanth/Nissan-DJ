import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getRecurringTransactions } from "@/lib/recurringQueries";
import { RecurringList } from "@/components/recurring/RecurringList";

export default async function RecurringPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const recurring = await getRecurringTransactions(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Recurring Transactions</h1>
        <p className="text-sm text-slate-500">Salary, rent, and subscriptions that post automatically.</p>
      </div>

      <RecurringList recurring={recurring} />
    </div>
  );
}
