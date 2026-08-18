"use client";

import { useState } from "react";
import { Hammer, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RepairForm } from "@/components/car/RepairForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RepairLog } from "@/lib/types";

export function RepairTable({ repairLogs, carId }: { repairLogs: RepairLog[]; carId: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const totalCost = repairLogs.reduce((sum, l) => sum + l.cost, 0);

  if (repairLogs.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-50">
            <Hammer className="size-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-slate-700">No repairs logged yet</p>
          <p className="max-w-xs text-sm text-slate-500">
            Log a repair to keep track of parts, labor, and total cost.
          </p>
          <Button onClick={() => setFormOpen(true)} className="mt-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="size-4" />
            Log Repair
          </Button>
        </Card>
        <RepairForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} carId={carId} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Card className="p-4 sm:w-64">
          <p className="text-xs font-medium text-slate-500">Total Repairs Cost</p>
          <p className="mt-1 text-lg font-semibold text-amber-600 tabular-nums">
            {formatCurrency(totalCost)}
          </p>
        </Card>
        <Button onClick={() => setFormOpen(true)} className="w-fit bg-amber-500 hover:bg-amber-600">
          <Plus className="size-4" />
          Log Repair
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Shop</th>
                <th className="px-4 py-3 text-right">Parts</th>
                <th className="px-4 py-3 text-right">Labor</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {repairLogs.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatDate(l.date)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{l.description}</td>
                  <td className="px-4 py-3 text-slate-500">{l.shop || "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {l.partsCost != null ? formatCurrency(l.partsCost) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                    {l.laborCost != null ? formatCurrency(l.laborCost) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(l.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <RepairForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} carId={carId} />
    </div>
  );
}
