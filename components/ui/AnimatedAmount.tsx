"use client";

import { useCountUp } from "@/hooks/useCountUp";

/** Drop-in count-up for a formatted number inside a Server Component — useCountUp itself needs a Client Component. */
export function AnimatedAmount({ value, format }: { value: number; format: (n: number) => string }) {
  const animated = useCountUp(value);
  return <>{format(animated)}</>;
}
