import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getOrCreatePrimaryVehicle } from "@/lib/vehicleQueries";

// Kept as a redirect for backwards compatibility with old links/bookmarks.
export default async function SentraMaintenanceRedirectPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const vehicle = await getOrCreatePrimaryVehicle(user.id);
  redirect(`/vehicles/${vehicle.id}/maintenance`);
}
