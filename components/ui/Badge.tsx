import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeColor = "green" | "red" | "indigo" | "slate" | "blue" | "amber";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  red: "bg-red-500/12 text-red-700 dark:text-red-400",
  indigo: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-400",
  slate: "bg-black/[0.06] text-text-secondary",
  blue: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  amber: "bg-amber-500/12 text-amber-700 dark:text-amber-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export function Badge({ className, color = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        COLOR_CLASSES[color],
        className
      )}
      {...props}
    />
  );
}
