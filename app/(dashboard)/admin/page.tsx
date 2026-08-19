import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { isUserAdmin, getAllUsersForAdmin } from "@/lib/adminQueries";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function AdminPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!(await isUserAdmin(user.id))) notFound();

  const users = await getAllUsersForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-text-primary">
          <ShieldCheck className="size-5 text-indigo-600" />
          Admin
        </h1>
        <p className="text-sm text-text-muted">Every account on SentraTrack. Read-only.</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Vehicles</th>
                <th className="px-4 py-3 text-right">Transactions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-black/[0.08] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-text-primary">
                    <div className="flex items-center gap-2">
                      {u.email}
                      {u.isAdmin && <Badge color="indigo">Admin</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">{u.vehicleCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">{u.transactionCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      View
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
