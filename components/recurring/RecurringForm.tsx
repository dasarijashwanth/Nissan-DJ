"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, type RecurringTransaction } from "@/lib/types";
import { toDateInputValue, cn } from "@/lib/utils";
import {
  validateRecurring,
  type RecurringFieldErrors,
  type RecurringFormValues,
} from "@/lib/recurringValidation";

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function emptyValues(): RecurringFormValues {
  return {
    title: "",
    amount: "",
    type: "expense",
    category: "",
    frequency: "",
    startDate: toDateInputValue(new Date()),
    notes: "",
  };
}

function valuesFromRecurring(r: RecurringTransaction): RecurringFormValues {
  return {
    title: r.title,
    amount: String(r.amount),
    type: r.type,
    category: r.category,
    frequency: r.frequency,
    startDate: toDateInputValue(r.startDate),
    notes: r.notes ?? "",
  };
}

export interface RecurringFormProps {
  open: boolean;
  onClose: () => void;
  recurring?: RecurringTransaction | null;
}

export function RecurringForm({ open, onClose, recurring }: RecurringFormProps) {
  const router = useRouter();
  const isEdit = !!recurring;

  const [values, setValues] = useState<RecurringFormValues>(() =>
    recurring ? valuesFromRecurring(recurring) : emptyValues()
  );
  const [errors, setErrors] = useState<RecurringFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof RecurringFormValues>(key: K, value: RecurringFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateRecurring(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/recurring/${recurring!.id}` : "/api/recurring";
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Recurring Transaction" : "Add Recurring Transaction"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(["expense", "income"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set("type", type)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors",
                values.type === type
                  ? type === "income"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-red-600 bg-red-50 text-red-700"
                  : "border-slate-200 text-text-muted hover:bg-slate-50"
              )}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.type && <p className="-mt-2 text-sm text-red-600">{errors.type}</p>}

        <Input label="Title" value={values.title} onChange={(e) => set("title", e.target.value)} error={errors.title} />
        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          value={values.amount}
          onChange={(e) => set("amount", e.target.value)}
          error={errors.amount}
        />
        <Select
          label="Category"
          value={values.category}
          onChange={(e) => set("category", e.target.value)}
          error={errors.category}
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          label="Frequency"
          value={values.frequency}
          onChange={(e) => set("frequency", e.target.value)}
          error={errors.frequency}
        >
          <option value="" disabled>
            Select a frequency
          </option>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
        <Input
          label="Start date"
          type="date"
          value={values.startDate}
          onChange={(e) => set("startDate", e.target.value)}
          error={errors.startDate}
        />
        <Textarea label="Notes (optional)" value={values.notes} onChange={(e) => set("notes", e.target.value)} />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            {isEdit ? "Save Changes" : "Add Recurring"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
