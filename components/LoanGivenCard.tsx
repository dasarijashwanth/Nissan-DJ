"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChitFundForm } from "@/components/ChitFundForm";
import { calcLoanOutstanding } from "@/lib/loanUtils";
import { useCountUp } from "@/hooks/useCountUp";
import { cn, formatINR, formatCurrency, formatDate } from "@/lib/utils";
import type { ChitFund, LoanGiven } from "@/lib/types";

export function LoanGivenCard({
  loan,
  contributions,
  usdRate,
  onEdit,
}: {
  loan: LoanGiven;
  contributions: ChitFund[];
  usdRate: number;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);

  const { monthsElapsed, accruedInterest, receivedInterest, unpaidInterest, outstanding } = calcLoanOutstanding(
    loan,
    contributions
  );
  const animatedOutstanding = useCountUp(outstanding);
  const animatedAccrued = useCountUp(accruedInterest);
  const animatedReceived = useCountUp(receivedInterest);
  const animatedUnpaid = useCountUp(unpaidInterest);

  async function toggleActive() {
    setBusy(true);
    try {
      const res = await fetch(`/api/loans-given/${loan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !loan.isActive }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const res = await fetch(`/api/loans-given/${loan.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn("p-5", !loan.isActive && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{loan.borrowerName}</p>
          <p className="text-xs text-text-muted">
            Principal {formatINR(loan.principal)} · {loan.interestRatePercent}%/mo
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            aria-label="Edit"
            className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            aria-label="Delete"
            className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-text-muted">Outstanding Amount</p>
        <p className="text-2xl font-semibold tabular-nums text-amber-600">{formatINR(animatedOutstanding)}</p>
        <p className="text-xs text-text-muted">≈ {formatCurrency(animatedOutstanding / usdRate)}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-text-muted">Accrued</p>
          <p className="font-medium tabular-nums text-text-primary">{formatINR(animatedAccrued)}</p>
        </div>
        <div>
          <p className="text-text-muted">Received</p>
          <p className="font-medium tabular-nums text-emerald-600">{formatINR(animatedReceived)}</p>
        </div>
        <div>
          <p className="text-text-muted">Unpaid</p>
          <p className="font-medium tabular-nums text-red-600">{formatINR(animatedUnpaid)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge color="slate">{monthsElapsed} months elapsed</Badge>
        {!loan.isActive && <Badge color="green">Closed</Badge>}
      </div>

      <p className="mt-2 text-xs text-text-muted">Since {formatDate(loan.startDate)}</p>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={toggleActive} disabled={busy}>
          {loan.isActive ? "Mark Closed" : "Reopen"}
        </Button>
        <Button size="sm" className="flex-1" onClick={() => setPaymentFormOpen(true)} disabled={!loan.isActive}>
          <Plus className="size-3.5" />
          Log Payment
        </Button>
      </div>

      <ChitFundForm
        key={paymentFormOpen ? "open" : "closed"}
        open={paymentFormOpen}
        onClose={() => setPaymentFormOpen(false)}
        usdRate={usdRate}
        initialGroupName={loan.borrowerName}
        initialType="received"
      />
    </Card>
  );
}
