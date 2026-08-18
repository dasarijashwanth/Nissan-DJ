import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getOrCreatePrimaryVehicle } from "@/lib/vehicleQueries";
import { getUserPreferences } from "@/lib/preferencesQueries";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { CarSettingsSection } from "@/components/settings/CarSettingsSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { BudgetDefaultsSection } from "@/components/settings/BudgetDefaultsSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { DangerZoneSection } from "@/components/settings/DangerZoneSection";

export default async function SettingsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const [vehicle, preferences] = await Promise.all([getOrCreatePrimaryVehicle(user.id), getUserPreferences(user.id)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Account, car, and app preferences.</p>
      </div>

      <ProfileSection email={user.email ?? ""} displayName={preferences.displayName} />
      <CarSettingsSection car={vehicle} />
      <PreferencesSection preferences={preferences} />
      <BudgetDefaultsSection defaultBudgets={preferences.defaultBudgets} />
      <NotificationsSection notifications={preferences.notifications} />
      <DangerZoneSection />
    </div>
  );
}
