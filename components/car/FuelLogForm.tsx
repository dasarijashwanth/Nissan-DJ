"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toDateInputValue } from "@/lib/utils";
import { calcFillMPG } from "@/lib/carUtils";
import {
  validateFuelLog,
  type FuelLogFieldErrors,
  type FuelLogFormValues,
} from "@/lib/carValidation";

function emptyValues(): FuelLogFormValues {
  return {
    date: toDateInputValue(new Date()),
    station: "",
    gallons: "",
    pricePerGallon: "",
    totalCost: "",
    odometer: "",
    notes: "",
  };
}

export interface FuelLogFormProps {
  open: boolean;
  onClose: () => void;
  carId: string;
  previousOdometer: number;
}

export function FuelLogForm({ open, onClose, carId, previousOdometer }: FuelLogFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<FuelLogFormValues>(emptyValues);
  const [totalTouched, setTotalTouched] = useState(false);
  const [errors, setErrors] = useState<FuelLogFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FuelLogFormValues>(key: K, value: FuelLogFormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if ((key === "gallons" || key === "pricePerGallon") && !totalTouched) {
        const gallons = Number(key === "gallons" ? value : next.gallons);
        const price = Number(key === "pricePerGallon" ? value : next.pricePerGallon);
        if (gallons > 0 && price > 0) {
          next.totalCost = (gallons * price).toFixed(2);
        }
      }
      return next;
    });
  }

  const mpgPreview =
    values.odometer && previousOdometer > 0 && Number(values.gallons) > 0
      ? calcFillMPG(Number(values.odometer), previousOdometer, Number(values.gallons))
      : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateFuelLog(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/car/${carId}/fuel`, {
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
    <Modal open={open} onClose={onClose} title="Log Fuel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Date"
          type="date"
          value={values.date}
          onChange={(e) => set("date", e.target.value)}
          error={errors.date}
        />
        <Input
          label="Gas station (optional)"
          value={values.station}
          onChange={(e) => set("station", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Gallons"
            type="number"
            step="0.01"
            min="0"
            value={values.gallons}
            onChange={(e) => set("gallons", e.target.value)}
            error={errors.gallons}
          />
          <Input
            label="Price / gallon"
            type="number"
            step="0.001"
            min="0"
            value={values.pricePerGallon}
            onChange={(e) => set("pricePerGallon", e.target.value)}
            error={errors.pricePerGallon}
          />
        </div>
        <Input
          label="Total cost"
          type="number"
          step="0.01"
          min="0"
          value={values.totalCost}
          onChange={(e) => {
            setTotalTouched(true);
            set("totalCost", e.target.value);
          }}
          error={errors.totalCost}
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
        {mpgPreview > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
            {mpgPreview.toFixed(1)} MPG since your last fill
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
            Log Fuel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
