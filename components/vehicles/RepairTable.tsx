"use client";

import { useMemo, useState } from "react";
import { Hammer, Plus, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RepairForm } from "@/components/vehicles/RepairForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RepairLog } from "@/lib/types";

const PAGE_SIZE = 10;

export function RepairTable({ repairLogs, vehicleId }: { repairLogs: RepairLog[]; vehicleId: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RepairLog | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const totalCost = repairLogs.reduce((sum, l) => sum + l.cost, 0);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(log: RepairLog) {
    setEditing(log);
    setFormOpen(true);
  }

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query === "") return repairLogs;
    return repairLogs.filter(
      (l) =>
        l.description.toLowerCase().includes(query) ||
        (l.shop ?? "").toLowerCase().includes(query) ||
        (l.notes ?? "").toLowerCase().includes(query)
    );
  }, [repairLogs, search]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (repairLogs.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/12">
            <Hammer className="size-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No repairs logged yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Log a repair to keep track of parts, labor, and total cost.
          </p>
          <Button onClick={openAdd} className="mt-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="size-4" />
            Log Repair
          </Button>
        </Card>
        <RepairForm
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Card className="p-4 sm:w-64">
          <p className="text-xs font-medium text-text-muted">Total Repairs Cost</p>
          <p className="mt-1 text-lg font-semibold text-amber-600 tabular-nums">
            {formatCurrency(totalCost)}
          </p>
        </Card>
        <Button onClick={openAdd} className="w-fit bg-amber-500 hover:bg-amber-600">
          <Plus className="size-4" />
          Log Repair
        </Button>
      </div>

      <Input
        type="search"
        placeholder="Search description, shop, or notes..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="w-full sm:w-56"
      />

      <Card className="overflow-hidden p-0">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted">No repairs match your search.</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3 text-right">Parts</th>
                <th className="px-4 py-3 text-right">Labor</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((l) => (
                <tr key={l.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
                  <td className="px-4 py-3 text-text-muted">{formatDate(l.date)}</td>
                  <td className="px-4 py-3 font-medium text-text-primary">{l.description}</td>
                  <td className="px-4 py-3 text-text-muted">{l.shop || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                    {l.partsCost != null ? formatCurrency(l.partsCost) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-text-muted">
                    {l.laborCost != null ? formatCurrency(l.laborCost) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(l.cost)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openEdit(l)}
                      aria-label="Edit repair log"
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

      <RepairForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicleId={vehicleId}
        log={editing}
      />
    </div>
  );
}
