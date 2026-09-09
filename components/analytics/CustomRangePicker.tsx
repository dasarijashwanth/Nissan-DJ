"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function CustomRangePicker({
  tab,
  active,
  from,
  to,
}: {
  tab: string;
  active: boolean;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fromValue, setFromValue] = useState(from ?? "");
  const [toValue, setToValue] = useState(to ?? "");

  const invalid = fromValue !== "" && toValue !== "" && fromValue > toValue;

  function apply() {
    if (!fromValue || !toValue || invalid) return;
    router.push(`/analytics?tab=${tab}&period=custom&from=${fromValue}&to=${toValue}`);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          active
            ? "bg-indigo-600 text-white"
            : "border border-black/[0.08] bg-surface-card text-text-secondary hover:bg-black/[0.04]"
        )}
      >
        <Calendar className="size-3.5" />
        {active && from && to ? `${from} – ${to}` : "Custom range"}
      </button>

      {open && (
        <div className="absolute left-0 z-10 mt-2 flex w-64 flex-col gap-3 rounded-lg border border-black/[0.08] bg-surface-card p-4 shadow-lg">
          <Input
            type="date"
            label="From"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
          />
          <Input
            type="date"
            label="To"
            value={toValue}
            onChange={(e) => setToValue(e.target.value)}
            error={invalid ? "End date must be after start date" : undefined}
          />
          <Button size="sm" onClick={apply} disabled={!fromValue || !toValue || invalid}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
