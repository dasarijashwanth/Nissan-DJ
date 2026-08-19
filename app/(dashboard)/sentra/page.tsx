import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { getPrimaryVehicle } from "@/lib/vehicleQueries";

// Kept as a redirect for backwards compatibility with old links/bookmarks.
export default async function SentraRedirectPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const vehicle = await getPrimaryVehicle(user.id);
  redirect(vehicle ? `/vehicles/${vehicle.id}` : "/vehicles");
}
