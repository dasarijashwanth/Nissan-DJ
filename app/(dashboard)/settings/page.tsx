import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getOrCreateCar } from "@/lib/carQueries";
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

  const [car, preferences] = await Promise.all([getOrCreateCar(user.id), getUserPreferences(user.id)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Account, car, and app preferences.</p>
      </div>

      <ProfileSection email={user.email ?? ""} displayName={preferences.displayName} />
      <CarSettingsSection car={car} />
      <PreferencesSection preferences={preferences} />
      <BudgetDefaultsSection defaultBudgets={preferences.defaultBudgets} />
      <NotificationsSection notifications={preferences.notifications} />
      <DangerZoneSection />
    </div>
  );
}
