import { NextResponse } from "next/server";
import { getAuthUser, getServiceRoleClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

/** Danger zone: permanently deletes every row owned by this user, then the Supabase auth user itself. */
export async function DELETE() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const car = await prisma.car.findUnique({ where: { userId: user.id }, select: { id: true } });

  await prisma.$transaction(async (tx) => {
    if (car) {
      await tx.fuelLog.deleteMany({ where: { carId: car.id } });
      await tx.maintenanceLog.deleteMany({ where: { carId: car.id } });
      await tx.repairLog.deleteMany({ where: { carId: car.id } });
      await tx.odometerLog.deleteMany({ where: { carId: car.id } });
      await tx.insurance.deleteMany({ where: { carId: car.id } });
      await tx.car.delete({ where: { id: car.id } });
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
