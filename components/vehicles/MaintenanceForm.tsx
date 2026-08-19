"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MAINTENANCE_TYPES, type MaintenanceLog } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue } from "@/lib/utils";
import {
  validateMaintenanceLog,
  type MaintenanceFieldErrors,
  type MaintenanceFormValues,
} from "@/lib/vehicleValidation";

const OIL_CHANGE_INTERVAL_MILES = 3000;

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

function valuesFromLog(log: MaintenanceLog): MaintenanceFormValues {
  return {
    date: toStoredDateInputValue(log.date),
    type: log.type,
    cost: String(log.cost),
    odometer: String(log.odometer),
    shop: log.shop ?? "",
    nextDueDate: log.nextDueDate ? toStoredDateInputValue(log.nextDueDate) : "",
    nextDueMiles: log.nextDueMiles != null ? String(log.nextDueMiles) : "",
    notes: log.notes ?? "",
  };
}

export interface MaintenanceFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  log?: MaintenanceLog | null;
}

export function MaintenanceForm({ open, onClose, vehicleId, log }: MaintenanceFormProps) {
  const router = useRouter();
  const isEdit = !!log;

  const [values, setValues] = useState<MaintenanceFormValues>(() => (log ? valuesFromLog(log) : emptyValues()));
  const [nextDueMilesTouched, setNextDueMilesTouched] = useState(false);
  // Distinct from nextDueMilesTouched: tracks whether the current nextDueMiles value was actually
  // just auto-suggested this session, so the hint below doesn't reappear for an edit form's
  // already-saved value just because it happens to still say "Oil Change".
  const [nextDueMilesAutoSet, setNextDueMilesAutoSet] = useState(false);
  const [errors, setErrors] = useState<MaintenanceFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof MaintenanceFormValues>(key: K, value: MaintenanceFormValues[K]) {
    // Oil changes are due every 3,000 miles — suggest the next-due odometer reading as soon as
    // both the type and odometer are known, unless the user has already typed their own value.
    if ((key === "type" || key === "odometer") && !nextDueMilesTouched) {
      const type = key === "type" ? value : values.type;
      const odometer = Number(key === "odometer" ? value : values.odometer);
      setNextDueMilesAutoSet(type === "Oil Change" && odometer > 0);
    }

    setValues((prev) => {
      const next = { ...prev, [key]: value };

      if ((key === "type" || key === "odometer") && !nextDueMilesTouched) {
        const type = key === "type" ? value : next.type;
        const odometer = Number(key === "odometer" ? value : next.odometer);
        if (type === "Oil Change" && odometer > 0) {
          next.nextDueMiles = String(odometer + OIL_CHANGE_INTERVAL_MILES);
        }
      }

      return next;
    });
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
      const url = isEdit
        ? `/api/vehicles/${vehicleId}/maintenance/${log!.id}`
        : `/api/vehicles/${vehicleId}/maintenance`;
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Maintenance" : "Log Maintenance"}>
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
            onChange={(e) => {
              setNextDueMilesTouched(true);
              set("nextDueMiles", e.target.value);
            }}
            error={errors.nextDueMiles}
          />
        </div>
        {nextDueMilesAutoSet && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            Suggested from a {OIL_CHANGE_INTERVAL_MILES.toLocaleString()}-mile oil change interval
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
            {isEdit ? "Save Changes" : "Log Maintenance"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
