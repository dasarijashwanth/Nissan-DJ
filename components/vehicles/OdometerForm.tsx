"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toDateInputValue, formatMiles } from "@/lib/utils";
import {
  validateOdometerLog,
  type OdometerFieldErrors,
  type OdometerFormValues,
} from "@/lib/vehicleValidation";

function emptyValues(): OdometerFormValues {
  return { date: toDateInputValue(new Date()), miles: "", notes: "" };
}

export interface OdometerFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  currentOdometer: number;
}

export function OdometerForm({ open, onClose, vehicleId, currentOdometer }: OdometerFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<OdometerFormValues>(emptyValues);
  const [errors, setErrors] = useState<OdometerFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof OdometerFormValues>(key: K, value: OdometerFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const milesSinceLast =
    values.miles && currentOdometer > 0 ? Number(values.miles) - currentOdometer : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateOdometerLog(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/odometer`, {
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
    <Modal open={open} onClose={onClose} title="Log Odometer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => set("date", e.target.value)}
          error={errors.date}
        />
        <Input
          label="Current miles"
          type="number"
          step="1"
          min="0"
          value={values.miles}
          onChange={(e) => set("miles", e.target.value)}
          error={errors.miles}
        />
        {milesSinceLast > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            {formatMiles(milesSinceLast)} since your last log
          </p>
        )}
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
          <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600" loading={submitting}>
            Log Odometer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
