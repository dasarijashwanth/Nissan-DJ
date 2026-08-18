import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeColor = "green" | "red" | "indigo" | "slate" | "blue" | "amber";

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: "bg-emerald-50 text-emerald-700",
  red: "bg-red-50 text-red-700",
  indigo: "bg-indigo-50 text-indigo-700",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-700",
  amber: "bg-amber-50 text-amber-700",
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
