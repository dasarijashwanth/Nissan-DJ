"use client";

import { useState } from "react";
import { Shield, Plus, Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InsuranceForm } from "@/components/vehicles/InsuranceForm";
import { daysUntil } from "@/lib/vehicleUtils";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Insurance } from "@/lib/types";

export function InsuranceCard({ policies, vehicleId }: { policies: Insurance[]; vehicleId: string }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Insurance | null>(null);

  const active = policies[0] ?? null;
  const history = policies.slice(1);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(policy: Insurance) {
    setEditing(policy);
    setFormOpen(true);
  }

  if (!active) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-amber-500/12">
            <Shield className="size-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No insurance policy on file</p>
          <p className="max-w-xs text-sm text-text-muted">
            Add your policy to track renewal dates and monthly cost.
          </p>
          <Button onClick={openAdd} className="mt-2 bg-amber-500 hover:bg-amber-600">
            <Plus className="size-4" />
            Add Policy
          </Button>
        </Card>
        <InsuranceForm
          key={formOpen ? (editing?.id ?? "new") : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          vehicleId={vehicleId}
          policy={editing}
        />
      </>
    );
  }

  const days = daysUntil(active.renewalDate);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/12 text-amber-600 dark:text-amber-400">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{active.provider}</p>
              <Badge color="amber">{active.coverageType}</Badge>
            </div>
          </div>
          <button
            onClick={() => openEdit(active)}
            aria-label="Edit policy"
            className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
          >
            <Pencil className="size-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-text-muted">Monthly Cost</p>
            <p className="mt-1 text-lg font-semibold text-text-primary tabular-nums">
              {formatCurrency(active.monthlyCost)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Renewal Date</p>
            <p className="mt-1 text-lg font-semibold text-text-primary">{formatDate(active.renewalDate)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">Renews In</p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold tabular-nums",
                days <= 30 ? "text-amber-600" : "text-text-primary"
              )}
            >
              {days >= 0 ? `${days} days` : "Expired"}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={openAdd} variant="outline" size="sm">
          <Plus className="size-4" />
          Add Policy
        </Button>
      </div>

      {history.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Coverage</th>
                  <th className="px-4 py-3 text-right">Monthly</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">Renewal</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
                    <td className="px-4 py-3 font-medium text-text-primary">{p.provider}</td>
                    <td className="px-4 py-3 text-text-muted">{p.coverageType}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(p.monthlyCost)}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(p.startDate)}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(p.renewalDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        aria-label={`Edit ${p.provider} policy`}
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
        </Card>
      )}

      <InsuranceForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        vehicleId={vehicleId}
        policy={editing}
      />
    </div>
  );
}
