"use client";

import { useState } from "react";
import { MapPin, Check, Pencil, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { formatDate, formatMiles } from "@/lib/utils";
import { useDailyOdometer } from "@/hooks/useDailyOdometer";
import { MileageStreakBadge } from "@/components/vehicles/MileageStreakBadge";

export function DailyOdometerWidget({ vehicleId }: { vehicleId: string }) {
  const { entries, stats, isLoading, submitting, logToday, logDate, today } = useDailyOdometer(vehicleId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [justLogged, setJustLogged] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillDate, setBackfillDate] = useState("");
  const [backfillValue, setBackfillValue] = useState("");

  if (isLoading || !stats) {
    return <Card className="h-40 animate-pulse p-5" />;
  }

  const todayEntry = entries.find((e) => e.date === today);
  const isLoggedToday = !!todayEntry && !editing;

  const displayValue =
    value !== ""
      ? value
      : todayEntry
        ? String(todayEntry.miles)
        : stats.currentOdometer > 0
          ? String(stats.currentOdometer)
          : "";

  function startEditing() {
    setValue(todayEntry ? String(todayEntry.miles) : "");
    setEditing(true);
  }

  async function handleLog() {
    const miles = value !== "" ? Number(value) : stats!.currentOdometer;
    if (Number.isNaN(miles) || miles < 0) return;
    const ok = await logToday(miles);
    if (ok) {
      setEditing(false);
      setValue("");
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 3000);
    }
  }

  async function handleBackfill() {
    if (!backfillDate || backfillValue === "" || Number.isNaN(Number(backfillValue))) return;
    const ok = await logDate(backfillDate, Number(backfillValue));
    if (ok) {
      setBackfilling(false);
      setBackfillDate("");
      setBackfillValue("");
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <MapPin className="size-4 text-amber-500" />
          Today&apos;s Drive
        </div>
        <span className="text-xs text-text-muted">{formatDate(new Date())}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <Input
          label="Current odometer"
          type="number"
          min="0"
          value={displayValue}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoggedToday}
          className="max-w-[160px]"
        />
        {isLoggedToday ? (
          <Button variant="outline" size="sm" onClick={startEditing}>
            <Pencil className="size-3.5" />
            Edit
          </Button>
        ) : (
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={handleLog} loading={submitting}>
            <Check className="size-3.5" />
            Log today
          </Button>
        )}
        {justLogged && <span className="text-xs font-medium text-emerald-600">Saved!</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-black/[0.08] pt-4 text-sm">
        <p className="text-text-secondary">
          Today: <span className="font-semibold text-text-primary">{formatMiles(stats.todayMiles)}</span>
        </p>
        <span className="text-slate-200">|</span>
        <p className="text-text-secondary">
          This week: <span className="font-semibold text-text-primary">{formatMiles(stats.weekMiles)}</span>
        </p>
        <span className="text-slate-200">|</span>
        <p className="text-text-secondary">
          Month: <span className="font-semibold text-text-primary">{formatMiles(stats.monthMiles)}</span>
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span>Daily avg (30d): {stats.avgMilesPerDay.toFixed(1)} mi/day</span>
        <MileageStreakBadge streak={stats.currentStreak} />
      </div>

      {stats.missingDays.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-3.5 shrink-0" />
              Missing log{stats.missingDays.length > 1 ? "s" : ""} for{" "}
              {stats.missingDays
                .slice()
                .reverse()
                .map((d) => formatDate(d))
                .join(", ")}
            </span>
            {!backfilling && (
              <button
                type="button"
                onClick={() => {
                  setBackfilling(true);
                  setBackfillDate(stats.missingDays[0]);
                }}
                className="shrink-0 font-medium underline hover:no-underline"
              >
                Log now?
              </button>
            )}
          </div>

          {backfilling && (
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <Select value={backfillDate} onChange={(e) => setBackfillDate(e.target.value)} className="w-auto">
                {stats.missingDays.map((d) => (
                  <option key={d} value={d}>
                    {formatDate(d)}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                min="0"
                placeholder="Odometer"
                value={backfillValue}
                onChange={(e) => setBackfillValue(e.target.value)}
                className="max-w-[140px]"
              />
              <Button size="sm" onClick={handleBackfill} loading={submitting}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBackfilling(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
