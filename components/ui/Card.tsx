import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-slide-up-fade rounded-lg border border-black/[0.06] bg-surface-card p-6 shadow-card transition-shadow duration-[250ms] hover:shadow-md",
        className
      )}
      {...props}
    />
  );
}

/** Frosted-glass variant for dark/photo backdrops (the car section). */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-slide-up-fade rounded-lg border border-white/10 p-6 shadow-md backdrop-blur-2xl",
        className
      )}
      style={{ background: "var(--surface-glass)" }}
      {...props}
    />
  );
}
