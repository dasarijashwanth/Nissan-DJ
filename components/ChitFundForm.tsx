"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ChitFund } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue, formatCurrency } from "@/lib/utils";
import { validateChitFundInput, type ChitFundFieldErrors, type ChitFundFormValues } from "@/lib/validation";

function emptyValues(): ChitFundFormValues {
  return {
    amount: "",
    groupName: "",
    date: toDateInputValue(new Date()),
    notes: "",
  };
}

function valuesFromContribution(contribution: ChitFund): ChitFundFormValues {
  return {
    amount: String(contribution.amount),
    groupName: contribution.groupName,
    date: toStoredDateInputValue(contribution.date),
    notes: contribution.notes ?? "",
  };
}

export interface ChitFundFormProps {
  open: boolean;
  onClose: () => void;
  contribution?: ChitFund | null;
  usdRate: number;
}

export function ChitFundForm({ open, onClose, contribution, usdRate }: ChitFundFormProps) {
  const router = useRouter();
  const isEdit = !!contribution;

  const [values, setValues] = useState<ChitFundFormValues>(() =>
    contribution ? valuesFromContribution(contribution) : emptyValues()
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
        <Input
          label="Group name"
          value={values.groupName}
          onChange={(e) => set("groupName", e.target.value)}
          error={errors.groupName}
          placeholder="e.g. Office Chit"
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
