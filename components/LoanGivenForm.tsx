"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { LoanGiven } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue, formatCurrency } from "@/lib/utils";
import { validateLoanGiven, type LoanGivenFieldErrors, type LoanGivenFormValues } from "@/lib/validation";

function emptyValues(): LoanGivenFormValues {
  return {
    borrowerName: "",
    principal: "",
    interestRatePercent: "",
    startDate: toDateInputValue(new Date()),
    notes: "",
  };
}

function valuesFromLoan(loan: LoanGiven): LoanGivenFormValues {
  return {
    borrowerName: loan.borrowerName,
    principal: String(loan.principal),
    interestRatePercent: String(loan.interestRatePercent),
    startDate: toStoredDateInputValue(loan.startDate),
    notes: loan.notes ?? "",
  };
}

export interface LoanGivenFormProps {
  open: boolean;
  onClose: () => void;
  loan?: LoanGiven | null;
  usdRate: number;
}

export function LoanGivenForm({ open, onClose, loan, usdRate }: LoanGivenFormProps) {
  const router = useRouter();
  const isEdit = !!loan;

  const [values, setValues] = useState<LoanGivenFormValues>(() => (loan ? valuesFromLoan(loan) : emptyValues()));
  const [errors, setErrors] = useState<LoanGivenFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof LoanGivenFormValues>(key: K, value: LoanGivenFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const monthlyInterestPreview =
    Number(values.principal) > 0 && values.interestRatePercent !== ""
      ? (Number(values.principal) * Number(values.interestRatePercent)) / 100
      : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateLoanGiven(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/loans-given/${loan!.id}` : "/api/loans-given";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.errors) setErrors(data.errors);
        setFormError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Loan" : "Log a Loan Given"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Borrower name"
          value={values.borrowerName}
          onChange={(e) => set("borrowerName", e.target.value)}
          error={errors.borrowerName}
          placeholder="e.g. Ramesh"
        />

        <Input
          label="Principal (₹ INR)"
          type="number"
          step="0.01"
          min="0"
          value={values.principal}
          onChange={(e) => set("principal", e.target.value)}
          error={errors.principal}
        />

        <Input
          label="Interest rate (% per month)"
          type="number"
          step="0.01"
          min="0"
          value={values.interestRatePercent}
          onChange={(e) => set("interestRatePercent", e.target.value)}
          error={errors.interestRatePercent}
          placeholder="e.g. 1"
        />
        {monthlyInterestPreview > 0 && (
          <p className="-mt-2 text-xs text-text-muted">
            ≈ ₹{monthlyInterestPreview.toLocaleString("en-IN")}/mo expected interest (≈{" "}
            {formatCurrency(monthlyInterestPreview / usdRate)})
          </p>
        )}

        <Input
          label="Start date"
          type="date"
          value={values.startDate}
          onChange={(e) => set("startDate", e.target.value)}
          error={errors.startDate}
        />

        <Textarea label="Notes (optional)" value={values.notes} onChange={(e) => set("notes", e.target.value)} />

        <p className="text-xs text-text-muted">
          Log the interest payments you receive as a &quot;Received&quot; Cheeti entry under the same
          borrower name — Outstanding Amount is calculated from what should have accrued by now minus
          what you&apos;ve actually received.
        </p>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            {isEdit ? "Save Changes" : "Log Loan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
