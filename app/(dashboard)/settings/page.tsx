import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getPrimaryVehicle } from "@/lib/vehicleQueries";
import { getUserPreferences } from "@/lib/preferencesQueries";
import { Card } from "@/components/ui/Card";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { CarSettingsSection } from "@/components/settings/CarSettingsSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { BudgetDefaultsSection } from "@/components/settings/BudgetDefaultsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [vehicle, preferences] = await Promise.all([getPrimaryVehicle(user.id), getUserPreferences(user.id)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Account, car, and app preferences.</p>
      </div>

      <ProfileSection email={user.email ?? ""} displayName={preferences.displayName} />
      {vehicle ? (
        <CarSettingsSection car={vehicle} />
      ) : (
        <Card className="p-5 text-center text-sm text-text-muted">
          No vehicle yet.{" "}
          <Link href="/vehicles/new" className="font-medium text-indigo-600 hover:text-indigo-700">
            Add one
          </Link>{" "}
          to manage its settings here.
        </Card>
      )}
      <PreferencesSection preferences={preferences} />
      <BudgetDefaultsSection defaultBudgets={preferences.defaultBudgets} />
      <NotificationsSection notifications={preferences.notifications} />
      <DangerZoneSection />
    </div>
  );
}
