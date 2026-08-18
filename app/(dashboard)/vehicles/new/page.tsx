import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase";
import { NewVehicleForm } from "@/components/vehicles/NewVehicleForm";

export default async function NewVehiclePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return <NewVehicleForm />;
}
