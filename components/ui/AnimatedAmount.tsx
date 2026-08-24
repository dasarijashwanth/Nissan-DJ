"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { formatCurrency, formatINR, formatMiles } from "@/lib/utils";

// A Server Component can't pass a plain function as a prop to a Client Component (functions
// aren't serializable across that boundary) — so this takes a formatType string and looks up the
// formatter itself, instead of accepting `format: (n: number) => string` directly.
const FORMATTERS = {
  usd: formatCurrency,
  inr: formatINR,
  miles: formatMiles,
  integer: (n: number) => Math.round(n).toLocaleString(),
  decimal1: (n: number) => n.toFixed(1),
  percent0: (n: number) => `${n.toFixed(0)}%`,
  percent1: (n: number) => `${n.toFixed(1)}%`,
} as const;

export type AnimatedAmountFormatType = keyof typeof FORMATTERS;

/** Drop-in count-up for a formatted number inside a Server Component — useCountUp itself needs a Client Component. */
export function AnimatedAmount({ value, formatType }: { value: number; formatType: AnimatedAmountFormatType }) {
  const animated = useCountUp(value);
  return <>{FORMATTERS[formatType](animated)}</>;
}
