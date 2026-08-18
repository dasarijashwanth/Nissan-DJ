import { NextResponse } from "next/server";
import { getAuthUser, getServiceRoleClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

/** Danger zone: permanently deletes every row owned by this user, then the Supabase auth user itself. */
export async function DELETE() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({ where: { userId: user.id }, select: { id: true } });
  const vehicleIds = vehicles.map((v) => v.id);

  await prisma.$transaction(async (tx) => {
    if (vehicleIds.length > 0) {
      await tx.fuelLog.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
      await tx.maintenanceLog.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
      await tx.repairLog.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
      await tx.odometerLog.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
      await tx.insurance.deleteMany({ where: { vehicleId: { in: vehicleIds } } });
      await tx.vehicle.deleteMany({ where: { id: { in: vehicleIds } } });
    }
    await tx.transaction.deleteMany({ where: { userId: user.id } });
    await tx.budget.deleteMany({ where: { userId: user.id } });
    await tx.recurringTransaction.deleteMany({ where: { userId: user.id } });
    await tx.alert.deleteMany({ where: { userId: user.id } });
    await tx.user.delete({ where: { id: user.id } });
  });

  const supabase = getServiceRoleClient();
  await supabase.auth.admin.deleteUser(user.id);

  return NextResponse.json({ success: true });
}
