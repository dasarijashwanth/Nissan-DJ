"use client";

import { useCallback, useEffect, useState } from "react";
import { toDateInputValue } from "@/lib/utils";
import type { DailyOdometer } from "@/lib/types";
import type { DailyOdometerStats } from "@/lib/dailyOdometerQueries";

export function useDailyOdometer(vehicleId: string, rangeDays = 90) {
  const [entries, setEntries] = useState<DailyOdometer[]>([]);
  const [stats, setStats] = useState<DailyOdometerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = toDateInputValue(new Date());

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = toDateInputValue(new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000));
      const res = await fetch(`/api/vehicles/${vehicleId}/odometer/daily?today=${today}&from=${from}&to=${today}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setStats(data.stats);
      }
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, today, rangeDays]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      load();
    });
    return () => cancelAnimationFrame(raf);
  }, [load]);

  async function logDate(date: string, miles: number, notes?: string): Promise<boolean> {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/odometer/daily`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, miles, notes: notes || null }),
      });
      if (res.ok) {
        await load();
        return true;
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  const logToday = (miles: number, notes?: string) => logDate(today, miles, notes);

  async function deleteEntry(id: string): Promise<boolean> {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/odometer/daily/${id}`, { method: "DELETE" });
      if (res.ok) {
        await load();
        return true;
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return { entries, stats, isLoading, submitting, logToday, logDate, deleteEntry, refetch: load, today };
}
