import Link from "next/link";
import { cn } from "@/lib/utils";
import type { BudgetStatus } from "@/lib/types";

const STATUS_CLASSES: Record<BudgetStatus, string> = {
  on_track: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  exceeded: "bg-red-50 text-red-700",
};

export interface BudgetPill {
  category: string;
  status: BudgetStatus;
}

export function BudgetStatusStrip({ budgets }: { budgets: BudgetPill[] }) {
  if (budgets.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {budgets.map((b) => (
        <Link
          key={b.category}
          href="/budgets"
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80",
            STATUS_CLASSES[b.status]
          )}
        >
          {b.category}
        </Link>
      ))}
    </div>
  );
}
