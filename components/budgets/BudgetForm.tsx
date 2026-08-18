"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/lib/types";
import { validateBudget, type BudgetFieldErrors, type BudgetFormValues } from "@/lib/budgetValidation";

export interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  month: number;
  year: number;
}

export function BudgetForm({ open, onClose, month, year }: BudgetFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<BudgetFormValues>(() => ({
    category: "",
    amount: "",
    month: String(month),
    year: String(year),
  }));
  const [errors, setErrors] = useState<BudgetFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof BudgetFormValues>(key: K, value: BudgetFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateBudget(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
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
    <Modal open={open} onClose={onClose} title="Add Budget">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <Input
          label="Monthly limit"
          type="number"
          step="0.01"
          min="0"
          value={values.amount}
          onChange={(e) => set("amount", e.target.value)}
          error={errors.amount}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
}
