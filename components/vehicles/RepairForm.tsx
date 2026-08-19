"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toDateInputValue, toStoredDateInputValue } from "@/lib/utils";
import type { RepairLog } from "@/lib/types";
import {
  validateRepairLog,
  type RepairFieldErrors,
  type RepairFormValues,
} from "@/lib/vehicleValidation";

function emptyValues(): RepairFormValues {
  return {
    date: toDateInputValue(new Date()),
    description: "",
    shop: "",
    partsCost: "",
    laborCost: "",
    cost: "",
    odometer: "",
    notes: "",
  };
}

function valuesFromLog(log: RepairLog): RepairFormValues {
  return {
    date: toStoredDateInputValue(log.date),
    description: log.description,
    shop: log.shop ?? "",
    partsCost: log.partsCost != null ? String(log.partsCost) : "",
    laborCost: log.laborCost != null ? String(log.laborCost) : "",
    cost: String(log.cost),
    odometer: String(log.odometer),
    notes: log.notes ?? "",
  };
}

export interface RepairFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  log?: RepairLog | null;
}

export function RepairForm({ open, onClose, vehicleId, log }: RepairFormProps) {
  const router = useRouter();
  const isEdit = !!log;

  const [values, setValues] = useState<RepairFormValues>(() => (log ? valuesFromLog(log) : emptyValues()));
  const [costTouched, setCostTouched] = useState(false);
  const [errors, setErrors] = useState<RepairFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof RepairFormValues>(key: K, value: RepairFormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if ((key === "partsCost" || key === "laborCost") && !costTouched) {
        const parts = Number(key === "partsCost" ? value : next.partsCost) || 0;
        const labor = Number(key === "laborCost" ? value : next.laborCost) || 0;
        if (parts > 0 || labor > 0) {
          next.cost = (parts + labor).toFixed(2);
        }
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateRepairLog(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/vehicles/${vehicleId}/repairs/${log!.id}` : `/api/vehicles/${vehicleId}/repairs`;
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Repair" : "Log Repair"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => set("date", e.target.value)}
          error={errors.date}
        />
        <Input
          label="Description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          error={errors.description}
        />
        <Input
          label="Shop (optional)"
          value={values.shop}
          onChange={(e) => set("shop", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Parts cost (optional)"
            type="number"
            step="0.01"
            min="0"
            value={values.partsCost}
            onChange={(e) => set("partsCost", e.target.value)}
            error={errors.partsCost}
          />
          <Input
            label="Labor cost (optional)"
            type="number"
            step="0.01"
            min="0"
            value={values.laborCost}
            onChange={(e) => set("laborCost", e.target.value)}
            error={errors.laborCost}
          />
        </div>
        <Input
          label="Total cost"
          type="number"
          step="0.01"
          min="0"
          value={values.cost}
          onChange={(e) => {
            setCostTouched(true);
            set("cost", e.target.value);
          }}
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
            {isEdit ? "Save Changes" : "Log Repair"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
