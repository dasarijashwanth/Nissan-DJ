"use client";

import { useState } from "react";
import { Wrench, Plus, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { MaintenanceForm } from "@/components/vehicles/MaintenanceForm";
import { isMaintenanceDueSoon } from "@/lib/vehicleUtils";
import { formatCurrency, formatDate, formatMiles } from "@/lib/utils";
import type { MaintenanceLog } from "@/lib/types";

const TYPE_BADGE_COLOR: Record<string, NonNullable<BadgeProps["color"]>> = {
  "Oil Change": "green",
  "Tire Rotation": "blue",
  "Brake Pad": "red",
  "Air Filter": "indigo",
  Battery: "amber",
  "Wiper Blades": "slate",
  Other: "slate",
};

export function MaintenanceTable({
  maintenanceLogs,
  vehicleId,
  currentOdometer,
}: {
  maintenanceLogs: MaintenanceLog[];
  vehicleId: string;
  currentOdometer: number;
}) {
  const [formOpen, setFormOpen] = useState(false);

  const dueSoon = maintenanceLogs.filter((l) => isMaintenanceDueSoon(l, currentOdometer));

  if (maintenanceLogs.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-50">
            <Wrench className="size-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No maintenance logged yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Log your first service to start tracking maintenance history.
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="size-4" />
            Log Maintenance
          </Button>
        </Card>
        <MaintenanceForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} vehicleId={vehicleId} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {dueSoon.length > 0 && (
        <Card className="flex items-center gap-3 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800">
            {dueSoon.length} item{dueSoon.length > 1 ? "s" : ""} due soon: {dueSoon.map((l) => l.type).join(", ")}
          </p>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="size-4" />
          Log Maintenance
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Odometer</th>
                <th className="px-4 py-3">Next Due</th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.map((l) => (
                <tr key={l.id} className="border-b border-black/[0.08] last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-text-muted">{formatDate(l.date)}</td>
                  <td className="px-4 py-3">
                    <Badge color={TYPE_BADGE_COLOR[l.type] ?? "slate"}>{l.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{l.shop || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(l.cost)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                    {formatMiles(l.odometer)}
                  </td>
                  <td className="px-4 py-3 text-text-muted">
                    {l.nextDueDate
                      ? formatDate(l.nextDueDate)
                      : l.nextDueMiles
                        ? formatMiles(l.nextDueMiles)
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <MaintenanceForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} vehicleId={vehicleId} />
    </div>
  );
}
