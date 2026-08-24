"use client";

import { useState } from "react";
import { HandCoins, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoanGivenCard } from "@/components/LoanGivenCard";
import { LoanGivenForm } from "@/components/LoanGivenForm";
import type { ChitFund, LoanGiven } from "@/lib/types";

export function LoanGivenList({
  loans,
  contributions,
  usdRate,
}: {
  loans: LoanGiven[];
  contributions: ChitFund[];
  usdRate: number;
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoanGiven | null>(null);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(l: LoanGiven) {
    setEditing(l);
    setFormOpen(true);
  }

  if (loans.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-black/[0.06]">
            <HandCoins className="size-6 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No loans given logged</p>
          <p className="max-w-xs text-sm text-text-muted">
            Track money you&apos;ve lent out at interest — Outstanding Amount updates automatically as
            interest accrues and as you log payments received.
          </p>
          <Button onClick={openAdd} className="mt-2">
            <Plus className="size-4" />
            Log a Loan Given
          </Button>
        </Card>
        <LoanGivenForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} loan={editing} usdRate={usdRate} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Log a Loan Given
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loans.map((l) => (
          <LoanGivenCard key={l.id} loan={l} contributions={contributions} usdRate={usdRate} onEdit={() => openEdit(l)} />
        ))}
      </div>

      <LoanGivenForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        loan={editing}
        usdRate={usdRate}
      />
    </div>
  );
}
