"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { ChitFundPlan } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue, formatCurrency } from "@/lib/utils";
import {
  validateChitFundPlan,
  type ChitFundPlanFieldErrors,
  type ChitFundPlanFormValues,
} from "@/lib/validation";

function emptyValues(): ChitFundPlanFormValues {
  return {
    amount: "",
    groupName: "",
    startDate: toDateInputValue(new Date()),
    periodMonths: "",
    notes: "",
  };
}

function valuesFromPlan(plan: ChitFundPlan): ChitFundPlanFormValues {
  return {
    amount: String(plan.amount),
    groupName: plan.groupName,
    startDate: toStoredDateInputValue(plan.startDate),
    periodMonths: String(plan.periodMonths),
    notes: plan.notes ?? "",
  };
}

export interface ChitFundPlanFormProps {
  open: boolean;
  onClose: () => void;
  plan?: ChitFundPlan | null;
  usdRate: number;
}

export function ChitFundPlanForm({ open, onClose, plan, usdRate }: ChitFundPlanFormProps) {
  const router = useRouter();
  const isEdit = !!plan;

  const [values, setValues] = useState<ChitFundPlanFormValues>(() =>
    plan ? valuesFromPlan(plan) : emptyValues()
  );
  const [errors, setErrors] = useState<ChitFundPlanFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ChitFundPlanFormValues>(key: K, value: ChitFundPlanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const totalPreview =
    Number(values.amount) > 0 && Number(values.periodMonths) > 0
      ? Number(values.amount) * Number(values.periodMonths)
      : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateChitFundPlan(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/chit-fund-plans/${plan!.id}` : "/api/chit-fund-plans";
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Cheeti Plan" : "Set Up Recurring Cheeti Plan"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Group name"
          value={values.groupName}
          onChange={(e) => set("groupName", e.target.value)}
          error={errors.groupName}
          placeholder="e.g. Office Chit"
        />

        <Input
          label="Monthly amount (₹ INR)"
          type="number"
          step="0.01"
          min="0"
          value={values.amount}
          onChange={(e) => set("amount", e.target.value)}
          error={errors.amount}
        />

        <Input
          label="Start date"
          type="date"
          value={values.startDate}
          onChange={(e) => set("startDate", e.target.value)}
          error={errors.startDate}
          disabled={isEdit}
        />

        <Input
          label="Period (number of months)"
          type="number"
          step="1"
          min="1"
          value={values.periodMonths}
          onChange={(e) => set("periodMonths", e.target.value)}
          error={errors.periodMonths}
          placeholder="e.g. 20"
        />

        {totalPreview > 0 && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Total over the full period: ₹{totalPreview.toLocaleString("en-IN")} (≈ {formatCurrency(totalPreview / usdRate)})
          </p>
        )}

        <Textarea label="Notes (optional)" value={values.notes} onChange={(e) => set("notes", e.target.value)} />

        <p className="text-xs text-text-muted">
          Once set up, a contribution is added automatically each month on schedule — you won&apos;t need to log
          it by hand.
        </p>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            {isEdit ? "Save Changes" : "Start Plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
