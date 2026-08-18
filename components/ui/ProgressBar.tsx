"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  className?: string;
}

export function ProgressBar({ value, color = "var(--color-primary)", className }: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const clamped = Math.min(100, Math.max(0, value));

  useEffect(() => {
    const raf = requestAnimationFrame(() => setWidth(clamped));
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${width}%`, background: color }}
      />
    </div>
  );
}
