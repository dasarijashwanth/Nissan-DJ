"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MAINTENANCE_TYPES } from "@/lib/types";
import { toDateInputValue } from "@/lib/utils";
import {
  validateMaintenanceLog,
  type MaintenanceFieldErrors,
  type MaintenanceFormValues,
} from "@/lib/carValidation";

function emptyValues(): MaintenanceFormValues {
  return {
    date: toDateInputValue(new Date()),
    type: "",
    cost: "",
    odometer: "",
    shop: "",
    nextDueDate: "",
    nextDueMiles: "",
    notes: "",
  };
}

export interface MaintenanceFormProps {
  open: boolean;
  onClose: () => void;
  carId: string;
}

export function MaintenanceForm({ open, onClose, carId }: MaintenanceFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<MaintenanceFormValues>(emptyValues);
  const [errors, setErrors] = useState<MaintenanceFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof MaintenanceFormValues>(key: K, value: MaintenanceFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateMaintenanceLog(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/car/${carId}/maintenance`, {
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
    <Modal open={open} onClose={onClose} title="Log Maintenance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => set("date", e.target.value)}
          error={errors.date}
        />
        <Select
          label="Type"
          value={values.type}
          onChange={(e) => set("type", e.target.value)}
          error={errors.type}
        >
          <option value="" disabled>
            Select a type
          </option>
          {MAINTENANCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Cost"
            type="number"
            step="0.01"
            min="0"
            value={values.cost}
            onChange={(e) => set("cost", e.target.value)}
            error={errors.cost}
          />
          <Input
            label="Odometer"
            type="number"
            step="1"
            min="0"
            value={values.odometer}
            onChange={(e) => set("odometer", e.target.value)}
            error={errors.odometer}
          />
        </div>
        <Input
          label="Shop (optional)"
          value={values.shop}
          onChange={(e) => set("shop", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Next due date (optional)"
            type="date"
            value={values.nextDueDate}
            onChange={(e) => set("nextDueDate", e.target.value)}
            error={errors.nextDueDate}
          />
          <Input
            label="Next due miles (optional)"
            type="number"
            step="1"
            min="0"
            value={values.nextDueMiles}
            onChange={(e) => set("nextDueMiles", e.target.value)}
            error={errors.nextDueMiles}
          />
        </div>
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
            Log Maintenance
          </Button>
        </div>
      </form>
    </Modal>
  );
}
