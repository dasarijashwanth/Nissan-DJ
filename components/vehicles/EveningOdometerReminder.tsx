"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDailyOdometer } from "@/hooks/useDailyOdometer";

const EVENING_HOUR = 18;

export function EveningOdometerReminder({ vehicleId }: { vehicleId: string }) {
  const { stats, isLoading, submitting, logToday } = useDailyOdometer(vehicleId);
  const [value, setValue] = useState("");
  const [dismissed, setDismissed] = useState(false);

  // The hour of day is only meaningful in the visitor's own timezone, which the server can't
  // know — compute it after mount so SSR and first client paint both render nothing here.
  const [isEvening, setIsEvening] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setIsEvening(new Date().getHours() >= EVENING_HOUR);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  if (isLoading || !stats || dismissed || !isEvening || stats.todayLogged) return null;

  async function handleLog() {
    const miles = value !== "" ? Number(value) : stats!.currentOdometer;
    if (Number.isNaN(miles) || miles < 0) return;
    const ok = await logToday(miles);
    if (ok) setDismissed(true);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-indigo-500/10 px-4 py-3 text-sm">
      <p className="font-medium text-indigo-800 dark:text-indigo-300">Don&apos;t forget to log today&apos;s odometer! 📍</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          placeholder={stats.currentOdometer ? String(stats.currentOdometer) : "Odometer"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 rounded-md border border-indigo-500/30 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button size="sm" onClick={handleLog} loading={submitting}>
          <MapPin className="size-3.5" />
          Log
        </Button>
        <button type="button" onClick={() => setDismissed(true)} className="text-xs text-indigo-400 hover:text-indigo-600">
          Dismiss
        </button>
      </div>
    </div>
  );
}
