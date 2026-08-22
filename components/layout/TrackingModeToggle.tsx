"use client";

import { useTransition } from "react";
import { Wallet, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import { setTrackingMode } from "@/lib/trackingModeActions";
import type { TrackingMode } from "@/lib/trackingMode";

export function TrackingModeToggle({ mode }: { mode: TrackingMode }) {
  const [pending, startTransition] = useTransition();

  function select(next: TrackingMode) {
    if (next === mode || pending) return;
    startTransition(() => {
      setTrackingMode(next);
    });
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg bg-black/[0.06] p-0.5"
      role="radiogroup"
      aria-label="Tracking mode"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === "life"}
        aria-label="Daily Life"
        title="Daily Life"
        onClick={() => select("life")}
        disabled={pending}
        className={cn(
          "flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-60",
          mode === "life" ? "bg-surface-card text-text-primary shadow-sm" : "text-text-muted hover:text-text-secondary"
        )}
      >
        <Wallet className="size-4" />
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === "vehicle"}
        aria-label="Vehicle"
        title="Vehicle"
        onClick={() => select("vehicle")}
        disabled={pending}
        className={cn(
          "flex size-8 items-center justify-center rounded-md transition-colors disabled:opacity-60",
          mode === "vehicle"
            ? "bg-surface-card text-text-primary shadow-sm"
            : "text-text-muted hover:text-text-secondary"
        )}
      >
        <Car className="size-4" />
      </button>
    </div>
  );
}
