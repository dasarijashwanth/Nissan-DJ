import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ChevronLeft, Car as CarIcon } from "lucide-react";
import { getAuthUser } from "@/lib/supabase";
import { isUserAdmin, getUserById } from "@/lib/adminQueries";
import { getTransactions, getSummary } from "@/lib/queries";
import {
  getVehiclesForUser,
  getFuelLogs,
  getMaintenanceLogs,
  getRepairLogs,
  getInsurancePolicies,
  getCurrentOdometer,
  getStartOdometer,
} from "@/lib/vehicleQueries";
import { calcTotalVehicleSpend, calcCostPerMile, calcAvgMPG } from "@/lib/vehicleUtils";
import { formatCurrency, formatDate, formatMiles } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SummaryCards } from "@/components/SummaryCards";

const EPOCH = new Date(0);

export default async function AdminUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const admin = await getAuthUser();
  if (!admin) redirect("/login");
  if (!(await isUserAdmin(admin.id))) notFound();

  const { userId } = await params;
  const targetUser = await getUserById(userId);
  if (!targetUser) notFound();

  const now = new Date();
  const [summary, transactions, vehicles] = await Promise.all([
    getSummary(userId, EPOCH, now),
    getTransactions(userId),
    getVehiclesForUser(userId),
  ]);

  const vehicleDetails = await Promise.all(
    vehicles.map(async (vehicle) => {
      const [fuelLogs, maintenanceLogs, repairLogs, insurancePolicies, currentOdometer, startOdometer] =
        await Promise.all([
          getFuelLogs(vehicle.id),
          getMaintenanceLogs(vehicle.id),
          getRepairLogs(vehicle.id),
          getInsurancePolicies(vehicle.id),
          getCurrentOdometer(vehicle.id),
          getStartOdometer(vehicle.id),
        ]);

      const totalSpend = calcTotalVehicleSpend(fuelLogs, maintenanceLogs, repairLogs, insurancePolicies);

      return {
        vehicle,
        currentOdometer,
        totalSpend,
        costPerMile: calcCostPerMile(totalSpend, startOdometer, currentOdometer),
        avgMPG: calcAvgMPG(fuelLogs),
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary">
          <ChevronLeft className="size-4" />
          All users
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-text-primary">{targetUser.email}</h1>
        <p className="text-sm text-text-muted">Joined {formatDate(targetUser.createdAt)} — read-only admin view.</p>
      </div>

      <SummaryCards {...summary} />

      <div>
        <p className="mb-3 text-sm font-medium text-text-secondary">Vehicles</p>
        {vehicleDetails.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-muted">No vehicles on file.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {vehicleDetails.map(({ vehicle, currentOdometer, totalSpend, costPerMile, avgMPG }) => (
              <Card key={vehicle.id} className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <CarIcon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{vehicle.nickname}</p>
                    <p className="text-xs text-text-muted">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-text-muted">Odometer</p>
                    <p className="font-medium text-text-primary">{formatMiles(currentOdometer)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Total spend</p>
                    <p className="font-medium text-text-primary">{formatCurrency(totalSpend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted">Avg MPG</p>
                    <p className="font-medium text-text-primary">{avgMPG > 0 ? avgMPG.toFixed(1) : "—"}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-text-muted">{formatCurrency(costPerMile)} / mile</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-text-secondary">Recent Transactions</p>
        <Card className="overflow-hidden p-0">
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-text-muted">No transactions on file.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 25).map((t) => (
                    <tr key={t.id} className="border-b border-black/[0.08] last:border-0">
                      <td className="px-4 py-3 font-medium text-text-primary">{t.title}</td>
                      <td className="px-4 py-3 text-text-muted">{t.category}</td>
                      <td className="px-4 py-3 text-text-muted">{formatDate(t.date)}</td>
                      <td
                        className={`px-4 py-3 text-right font-medium tabular-nums ${
                          t.type === "income" ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length > 25 && (
                <p className="px-4 py-3 text-center text-xs text-text-muted">
                  Showing 25 of {transactions.length} transactions.
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
