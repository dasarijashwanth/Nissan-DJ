import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbUser, transactions, vehicles, budgets, recurring, alerts, indiaTransfers, chitFunds, chitFundPlans, loansGiven] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      prisma.transaction.findMany({ where: { userId: user.id } }),
      prisma.vehicle.findMany({
        where: { userId: user.id },
        include: { fuelLogs: true, maintenanceLogs: true, repairLogs: true, odometerLogs: true, insurance: true },
      }),
      prisma.budget.findMany({ where: { userId: user.id } }),
      prisma.recurringTransaction.findMany({ where: { userId: user.id } }),
      prisma.alert.findMany({ where: { userId: user.id } }),
      prisma.indiaTransfer.findMany({ where: { userId: user.id } }),
      prisma.chitFund.findMany({ where: { userId: user.id } }),
      prisma.chitFundPlan.findMany({ where: { userId: user.id } }),
      prisma.loanGiven.findMany({ where: { userId: user.id } }),
    ]);

  const data = {
    exportedAt: new Date().toISOString(),
    user: dbUser,
    transactions,
    vehicles,
    budgets,
    recurring,
    alerts,
    indiaTransfers,
    chitFunds,
    chitFundPlans,
    loansGiven,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="dj-ledger-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
