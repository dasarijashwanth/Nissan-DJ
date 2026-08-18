import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getAlerts } from "@/lib/alertQueries";
import { AlertList } from "@/components/alerts/AlertList";

export default async function AlertsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const alerts = await getAlerts(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Alerts</h1>
        <p className="text-sm text-text-muted">Budget, car, and recurring transaction notifications.</p>
      </div>

      <AlertList alerts={alerts} />
    </div>
  );
}
