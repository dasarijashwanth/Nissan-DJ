"use client";

import { useMemo, useState } from "react";
import { Wrench, Plus, AlertTriangle, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

const PAGE_SIZE = 10;

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
  const [editing, setEditing] = useState<MaintenanceLog | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(log: MaintenanceLog) {
    setEditing(log);
    setFormOpen(true);
  }

  const dueSoon = maintenanceLogs.filter((l) => isMaintenanceDueSoon(l, currentOdometer));

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") return maintenanceLogs;
    return maintenanceLogs.filter(
      (l) =>
        l.type.toLowerCase().includes(query) ||
        (l.shop ?? "").toLowerCase().includes(query) ||
        (l.notes ?? "").toLowerCase().includes(query)
    );
  }, [maintenanceLogs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (maintenanceLogs.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/12">
            <Wrench className="size-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No maintenance logged yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Log your first service to start tracking maintenance history.
          </p>
          <Button onClick={openAdd} className="mt-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="size-4" />
            Log Maintenance
          </Button>
        </Card>
        <MaintenanceForm
          key={formOpen ? (editing?.id ?? "new") : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          vehicleId={vehicleId}
          log={editing}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {dueSoon.length > 0 && (
        <Card className="flex items-center gap-3 border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {dueSoon.length} item{dueSoon.length > 1 ? "s" : ""} due soon: {dueSoon.map((l) => l.type).join(", ")}
          </p>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="search"
          placeholder="Search type, shop, or notes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-56"
        />
        <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600">
          <Plus className="size-4" />
          Log Maintenance
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted">No maintenance logs match your search.</div>
        ) : (
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((l) => (
                <tr key={l.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
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
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(l)}
                      aria-label="Edit maintenance log"
                      className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.08] px-4 py-3">
            <p className="text-sm text-text-muted">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <MaintenanceForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicleId={vehicleId}
        log={editing}
      />
    </div>
  );
}
