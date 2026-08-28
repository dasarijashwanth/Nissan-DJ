import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { isVehicleOwnedBy } from "@/lib/vehicleQueries";
import { deleteDailyOdometerEntry } from "@/lib/dailyOdometerQueries";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ vehicleId: string; entryId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId, entryId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteDailyOdometerEntry(vehicleId, entryId);
  return NextResponse.json({ success: true });
}
