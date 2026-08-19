"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CATEGORIES, type Transaction } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue, cn } from "@/lib/utils";
import {
  validateTransactionInput,
  type TransactionFieldErrors,
  type TransactionFormValues,
} from "@/lib/validation";

function emptyValues(): TransactionFormValues {
  return {
    title: "",
    amount: "",
    type: "expense",
    category: "",
    date: toDateInputValue(new Date()),
    notes: "",
  };
}

function valuesFromTransaction(transaction: Transaction): TransactionFormValues {
  return {
    title: transaction.title,
    amount: String(transaction.amount),
    type: transaction.type,
    category: transaction.category,
    date: toStoredDateInputValue(transaction.date),
    notes: transaction.notes ?? "",
  };
}

export interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
}

// Remount this component (via a `key` at the call site tied to open + transaction id) to
// reset its state for a new form session, instead of syncing state from props in an effect.
export function TransactionForm({ open, onClose, transaction }: TransactionFormProps) {
  const router = useRouter();
  const isEdit = !!transaction;

  const [values, setValues] = useState<TransactionFormValues>(() =>
    transaction ? valuesFromTransaction(transaction) : emptyValues()
  );
  const [errors, setErrors] = useState<TransactionFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateTransactionInput(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/transactions/${transaction!.id}` : "/api/transactions";
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Transaction" : "Add Transaction"}>
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

        <Input
          label="Title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          error={errors.title}
        />

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
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>

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
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            {isEdit ? "Save Changes" : "Add Transaction"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
