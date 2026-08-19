"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toStoredDateInputValue } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";

type FormValues = {
  nickname: string;
  make: string;
  model: string;
  year: string;
  color: string;
  licensePlate: string;
  purchasePrice: string;
  purchaseDate: string;
  startOdometer: string;
};

function valuesFromVehicle(vehicle: Vehicle): FormValues {
  return {
    nickname: vehicle.nickname,
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    color: vehicle.color,
    licensePlate: vehicle.licensePlate ?? "",
    purchasePrice: vehicle.purchasePrice != null ? String(vehicle.purchasePrice) : "",
    purchaseDate: vehicle.purchaseDate ? toStoredDateInputValue(vehicle.purchaseDate) : "",
    startOdometer: vehicle.startOdometer != null ? String(vehicle.startOdometer) : "",
  };
}

export interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle;
}

export function VehicleForm({ open, onClose, vehicle }: VehicleFormProps) {
  const router = useRouter();

  const [values, setValues] = useState<FormValues>(() => valuesFromVehicle(vehicle));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.nickname.trim()) fieldErrors.nickname = "Give your vehicle a nickname.";
    if (!values.make.trim()) fieldErrors.make = "Make is required.";
    if (!values.model.trim()) fieldErrors.model = "Model is required.";
    if (!values.color.trim()) fieldErrors.color = "Color is required.";
    if (Number.isNaN(Number(values.year)) || Number(values.year) < 1900) {
      fieldErrors.year = "Enter a valid year.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: values.nickname.trim(),
          make: values.make.trim(),
          model: values.model.trim(),
          year: values.year,
          color: values.color.trim(),
          licensePlate: values.licensePlate.trim() || null,
          purchasePrice: values.purchasePrice === "" ? null : values.purchasePrice,
          purchaseDate: values.purchaseDate || null,
          startOdometer: values.startOdometer === "" ? null : values.startOdometer,
        }),
      });

      if (!res.ok) {
        setFormError("Something went wrong. Please try again.");
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
    <Modal open={open} onClose={onClose} title="Edit Vehicle Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nickname"
          value={values.nickname}
          onChange={(e) => set("nickname", e.target.value)}
          error={errors.nickname}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Make" value={values.make} onChange={(e) => set("make", e.target.value)} error={errors.make} />
          <Input
            label="Model"
            value={values.model}
            onChange={(e) => set("model", e.target.value)}
            error={errors.model}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Year"
            type="number"
            value={values.year}
            onChange={(e) => set("year", e.target.value)}
            error={errors.year}
          />
          <Input
            label="Color"
            value={values.color}
            onChange={(e) => set("color", e.target.value)}
            error={errors.color}
          />
        </div>
        <Input
          label="License plate"
          value={values.licensePlate}
          onChange={(e) => set("licensePlate", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Purchase price (optional)"
            type="number"
            step="0.01"
            min="0"
            value={values.purchasePrice}
            onChange={(e) => set("purchasePrice", e.target.value)}
          />
          <Input
            label="Purchase date (optional)"
            type="date"
            value={values.purchaseDate}
            onChange={(e) => set("purchaseDate", e.target.value)}
          />
        </div>
        <Input
          label="Starting odometer (optional)"
          type="number"
          step="1"
          min="0"
          value={values.startOdometer}
          onChange={(e) => set("startOdometer", e.target.value)}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600" loading={submitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
