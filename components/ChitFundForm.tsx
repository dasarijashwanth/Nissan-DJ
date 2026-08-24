"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ChitFund } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue, formatCurrency, cn } from "@/lib/utils";
import { validateChitFundInput, type ChitFundFieldErrors, type ChitFundFormValues } from "@/lib/validation";

function emptyValues(initialGroupName?: string, initialType?: ChitFundFormValues["type"]): ChitFundFormValues {
  return {
    amount: "",
    groupName: initialGroupName ?? "",
    type: initialType ?? "paid",
    date: toDateInputValue(new Date()),
    notes: "",
  };
}

function valuesFromContribution(contribution: ChitFund): ChitFundFormValues {
  return {
    amount: String(contribution.amount),
    groupName: contribution.groupName,
    type: contribution.type,
    date: toStoredDateInputValue(contribution.date),
    notes: contribution.notes ?? "",
  };
}

export interface ChitFundFormProps {
  open: boolean;
  onClose: () => void;
  contribution?: ChitFund | null;
  usdRate: number;
  /** Pre-fill a new (non-edit) entry — e.g. opening from a loan card to log that borrower's interest payment. */
  initialGroupName?: string;
  initialType?: ChitFundFormValues["type"];
}

export function ChitFundForm({
  open,
  onClose,
  contribution,
  usdRate,
  initialGroupName,
  initialType,
}: ChitFundFormProps) {
  const router = useRouter();
  const isEdit = !!contribution;

  const [values, setValues] = useState<ChitFundFormValues>(() =>
    contribution ? valuesFromContribution(contribution) : emptyValues(initialGroupName, initialType)
  );
  const [errors, setErrors] = useState<ChitFundFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ChitFundFormValues>(key: K, value: ChitFundFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateChitFundInput(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/chit-funds/${contribution!.id}` : "/api/chit-funds";
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Contribution" : "Log Cheeti Contribution"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(["paid", "received"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set("type", type)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                values.type === type
                  ? type === "received"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "border-red-600 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                  : "border-black/[0.08] text-text-muted hover:bg-black/[0.04]"
              )}
            >
              {type}
            </button>
          ))}
        </div>
        <p className="-mt-2 text-xs text-text-muted">
          {values.type === "received"
            ? "Money coming in to you — e.g. interest on a loan you gave out."
            : "Money you're paying out — e.g. a chit fund contribution."}
        </p>

        <Input
          label={values.type === "received" ? "Person / source" : "Group name"}
          value={values.groupName}
          onChange={(e) => set("groupName", e.target.value)}
          error={errors.groupName}
          placeholder={values.type === "received" ? "e.g. Ramesh (loan interest)" : "e.g. Office Chit"}
        />

        <Input
          label="Amount (₹ INR)"
          type="number"
          step="0.01"
          min="0"
          value={values.amount}
          onChange={(e) => set("amount", e.target.value)}
          error={errors.amount}
        />
        {Number(values.amount) > 0 && (
          <p className="-mt-2 text-xs text-text-muted">≈ {formatCurrency(Number(values.amount) / usdRate)}</p>
        )}

        <Input
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => set("date", e.target.value)}
          error={errors.date}
        />

        <Textarea
          label="Notes (optional)"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="e.g. month 4 of 20"
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            {isEdit ? "Save Changes" : "Log Contribution"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
