"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { IndiaTransfer } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue } from "@/lib/utils";
import {
  validateIndiaTransferInput,
  type IndiaTransferFieldErrors,
  type IndiaTransferFormValues,
} from "@/lib/validation";

function emptyValues(): IndiaTransferFormValues {
  return {
    amount: "",
    recipient: "",
    date: toDateInputValue(new Date()),
    notes: "",
  };
}

function valuesFromTransfer(transfer: IndiaTransfer): IndiaTransferFormValues {
  return {
    amount: String(transfer.amount),
    recipient: transfer.recipient,
    date: toStoredDateInputValue(transfer.date),
    notes: transfer.notes ?? "",
  };
}

export interface IndiaTransferFormProps {
  open: boolean;
  onClose: () => void;
  transfer?: IndiaTransfer | null;
}

export function IndiaTransferForm({ open, onClose, transfer }: IndiaTransferFormProps) {
  const router = useRouter();
  const isEdit = !!transfer;

  const [values, setValues] = useState<IndiaTransferFormValues>(() =>
    transfer ? valuesFromTransfer(transfer) : emptyValues()
  );
  const [errors, setErrors] = useState<IndiaTransferFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof IndiaTransferFormValues>(key: K, value: IndiaTransferFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateIndiaTransferInput(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/india-transfers/${transfer!.id}` : "/api/india-transfers";
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Transfer" : "Log Transfer to India"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Recipient"
          value={values.recipient}
          onChange={(e) => set("recipient", e.target.value)}
          error={errors.recipient}
          placeholder="e.g. Amma"
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
          placeholder="e.g. rent help, medical"
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={submitting}>
            {isEdit ? "Save Changes" : "Log Transfer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
