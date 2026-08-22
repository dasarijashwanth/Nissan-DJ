"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn, toDateInputValue, toStoredDateInputValue } from "@/lib/utils";
import { calcFillMPG } from "@/lib/vehicleUtils";
import type { FuelLog } from "@/lib/types";
import {
  validateFuelLog,
  validateWeeklyFuelLog,
  type FuelLogFieldErrors,
  type FuelLogFormValues,
  type WeeklyFuelFieldErrors,
  type WeeklyFuelFormValues,
} from "@/lib/vehicleValidation";

// The weekly form never asks for gallons/price directly, so the on-screen MPG estimate uses a
// flat reference price just to give the user a ballpark before saving — the record actually
// persisted uses a more accurate estimate (the vehicle's own recent per-fill average price).
const PREVIEW_PRICE_PER_GALLON = 3.5;

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

function valuesFromLog(log: FuelLog): FuelLogFormValues {
  return {
    date: toStoredDateInputValue(log.date),
    station: log.station ?? "",
    gallons: String(log.gallons),
    pricePerGallon: String(log.pricePerGallon),
    totalCost: String(log.totalCost),
    odometer: String(log.odometer),
    notes: log.notes ?? "",
  };
}

function getWeekRange(date: Date) {
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: toDateInputValue(monday), end: toDateInputValue(sunday) };
}

function weekLabel(start: string, end: string) {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const startStr = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(s);
  // "day"-only has no standard Intl pattern, so only drop the month when start/end share one.
  const endStr =
    s.getMonth() === e.getMonth()
      ? String(e.getDate())
      : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(e);
  const year = e.getFullYear();
  return `Week of ${startStr}–${endStr}, ${year}`;
}

function emptyWeeklyValues(): WeeklyFuelFormValues {
  const { start, end } = getWeekRange(new Date());
  return {
    weekStart: start,
    weekEnd: end,
    totalCost: "",
    startOdometer: "",
    endOdometer: "",
    milesDriven: "",
    fillUpCount: "",
    notes: "",
  };
}

export interface FuelLogFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  previousOdometer: number;
  log?: FuelLog | null;
}

export function FuelLogForm({ open, onClose, vehicleId, previousOdometer, log }: FuelLogFormProps) {
  const router = useRouter();
  const isEdit = !!log;
  const [mode, setMode] = useState<"per_fill" | "weekly_summary">("per_fill");

  const [values, setValues] = useState<FuelLogFormValues>(() => (log ? valuesFromLog(log) : emptyValues()));
  const [totalTouched, setTotalTouched] = useState(false);
  const [gallonsTouched, setGallonsTouched] = useState(false);
  const [errors, setErrors] = useState<FuelLogFieldErrors>({});

  const [weeklyValues, setWeeklyValues] = useState<WeeklyFuelFormValues>(emptyWeeklyValues);
  const [milesDrivenTouched, setMilesDrivenTouched] = useState(false);
  const [weeklyErrors, setWeeklyErrors] = useState<WeeklyFuelFieldErrors>({});

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || mode !== "weekly_summary") return;

    const raf = requestAnimationFrame(async () => {
      const { weekStart, weekEnd } = weeklyValues;
      const res = await fetch(
        `/api/vehicles/${vehicleId}/odometer/daily?today=${weekEnd}&from=${weekStart}&to=${weekEnd}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const entries: { date: string; miles: number }[] = data.entries ?? [];
      const monday = entries.find((e) => e.date === weekStart);
      const sunday = entries.find((e) => e.date === weekEnd);

      setWeeklyValues((prev) => ({
        ...prev,
        startOdometer: prev.startOdometer || (monday ? String(monday.miles) : ""),
        endOdometer:
          prev.endOdometer || (sunday ? String(sunday.miles) : previousOdometer ? String(previousOdometer) : ""),
      }));
    });

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, vehicleId, weeklyValues.weekStart, weeklyValues.weekEnd]);

  function set<K extends keyof FuelLogFormValues>(key: K, value: FuelLogFormValues[K]) {
    setValues((prev) => {
      const next = { ...prev, [key]: value };

      // Two independent auto-calcs, each skipped once the user has directly typed into its own
      // output field: gallons+price -> total (the original flow), and price+total -> gallons (for
      // the common case of knowing the price per gallon and the amount paid at the pump).
      if ((key === "gallons" || key === "pricePerGallon") && !totalTouched) {
        const gallons = Number(key === "gallons" ? value : next.gallons);
        const price = Number(key === "pricePerGallon" ? value : next.pricePerGallon);
        if (gallons > 0 && price > 0) {
          next.totalCost = (gallons * price).toFixed(2);
        }
      }

      if ((key === "pricePerGallon" || key === "totalCost") && !gallonsTouched) {
        const price = Number(key === "pricePerGallon" ? value : next.pricePerGallon);
        const total = Number(key === "totalCost" ? value : next.totalCost);
        if (price > 0 && total > 0) {
          next.gallons = (total / price).toFixed(3);
        }
      }

      return next;
    });
  }

  function setWeekly<K extends keyof WeeklyFuelFormValues>(key: K, value: WeeklyFuelFormValues[K]) {
    setWeeklyValues((prev) => {
      const next = { ...prev, [key]: value };
      if ((key === "startOdometer" || key === "endOdometer") && !milesDrivenTouched) {
        const start = Number(key === "startOdometer" ? value : next.startOdometer);
        const end = Number(key === "endOdometer" ? value : next.endOdometer);
        if (end > start && start >= 0) {
          next.milesDriven = String(end - start);
        }
      }
      return next;
    });
  }

  const mpgPreview =
    values.odometer && previousOdometer > 0 && Number(values.gallons) > 0
      ? calcFillMPG(Number(values.odometer), previousOdometer, Number(values.gallons))
      : 0;

  const weeklyMpgPreview = (() => {
    const miles = Number(weeklyValues.milesDriven);
    const cost = Number(weeklyValues.totalCost);
    if (!(miles > 0) || !(cost > 0)) return 0;
    const gallons = cost / PREVIEW_PRICE_PER_GALLON;
    return miles / gallons;
  })();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (mode === "weekly_summary") {
      const { valid, errors: fieldErrors } = validateWeeklyFuelLog(weeklyValues);
      if (!valid) {
        setWeeklyErrors(fieldErrors);
        return;
      }
    } else {
      const { valid, errors: fieldErrors } = validateFuelLog(values);
      if (!valid) {
        setErrors(fieldErrors);
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit ? `/api/vehicles/${vehicleId}/fuel/${log!.id}` : `/api/vehicles/${vehicleId}/fuel`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "weekly_summary" ? { type: "weekly_summary", ...weeklyValues } : values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.errors) {
          if (mode === "weekly_summary") setWeeklyErrors(data.errors);
          else setErrors(data.errors);
        }
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
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Fuel Log" : "Log Fuel"}>
      {!isEdit && (
        <div className="mb-4 flex gap-1 rounded-lg bg-black/[0.06] p-1">
          <button
            type="button"
            onClick={() => setMode("per_fill")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              mode === "per_fill"
                ? "bg-surface-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            Per fill-up
          </button>
          <button
            type="button"
            onClick={() => setMode("weekly_summary")}
            className={cn(
              "flex-1 rounded-md py-1.5 text-sm font-medium transition-colors",
              mode === "weekly_summary"
                ? "bg-surface-card text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            Weekly summary
          </button>
        </div>
      )}

      {isEdit || mode === "per_fill" ? (
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
              step="0.001"
              min="0"
              value={values.gallons}
              onChange={(e) => {
                setGallonsTouched(true);
                set("gallons", e.target.value);
              }}
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
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              {mpgPreview.toFixed(1)} MPG since your last fill
            </p>
          )}
          <Textarea label="Notes (optional)" value={values.notes} onChange={(e) => set("notes", e.target.value)} />

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600" loading={submitting}>
              {isEdit ? "Save Changes" : "Log Fuel"}
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="rounded-lg bg-black/[0.04] px-3 py-2 text-sm font-medium text-text-secondary">
            {weekLabel(weeklyValues.weekStart, weeklyValues.weekEnd)}
          </p>
          <Input
            label="Total spent on fuel this week"
            type="number"
            step="0.01"
            min="0"
            value={weeklyValues.totalCost}
            onChange={(e) => setWeekly("totalCost", e.target.value)}
            error={weeklyErrors.totalCost}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Starting odometer"
              type="number"
              step="1"
              min="0"
              value={weeklyValues.startOdometer}
              onChange={(e) => setWeekly("startOdometer", e.target.value)}
              error={weeklyErrors.startOdometer}
            />
            <Input
              label="Ending odometer"
              type="number"
              step="1"
              min="0"
              value={weeklyValues.endOdometer}
              onChange={(e) => setWeekly("endOdometer", e.target.value)}
              error={weeklyErrors.endOdometer}
            />
          </div>
          <Input
            label="Miles driven this week"
            type="number"
            step="1"
            min="0"
            value={weeklyValues.milesDriven}
            onChange={(e) => {
              setMilesDrivenTouched(true);
              setWeekly("milesDriven", e.target.value);
            }}
            error={weeklyErrors.milesDriven}
          />
          {weeklyMpgPreview > 0 && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              ~{weeklyMpgPreview.toFixed(1)} MPG estimated
            </p>
          )}
          <Input
            label="Number of fill-ups (optional)"
            type="number"
            step="1"
            min="0"
            value={weeklyValues.fillUpCount}
            onChange={(e) => setWeekly("fillUpCount", e.target.value)}
            error={weeklyErrors.fillUpCount}
          />
          <Textarea
            label="Notes (optional)"
            value={weeklyValues.notes}
            onChange={(e) => setWeekly("notes", e.target.value)}
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
      )}
    </Modal>
  );
}
