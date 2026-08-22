"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Trash2, Inbox } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { cn, formatDate } from "@/lib/utils";
import type { Alert, AlertType } from "@/lib/types";

const PAGE_SIZE = 10;

type FilterKey = "all" | "budget" | "car" | "recurring";

const FILTER_GROUPS: Record<FilterKey, AlertType[] | null> = {
  all: null,
  budget: ["budget_warning", "budget_exceeded"],
  car: ["maintenance_due", "insurance_due", "oil_change_due", "mpg_drop", "fuel_price_spike"],
  recurring: ["recurring_due"],
};

export function AlertList({ alerts: initialAlerts }: { alerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const types = FILTER_GROUPS[filter];
    return types ? alerts.filter((a) => types.includes(a.type)) : alerts;
  }, [alerts, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    await fetch("/api/alerts", { method: "PATCH" });
  }

  async function markRead(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
    await fetch(`/api/alerts/${id}/read`, { method: "PATCH" });
  }

  async function deleteAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/alerts/${id}`, { method: "DELETE" });
  }

  if (alerts.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-black/[0.06]">
          <Bell className="size-6 text-text-muted" />
        </div>
        <p className="text-sm font-medium text-text-secondary">No alerts yet</p>
        <p className="max-w-xs text-sm text-text-muted">
          Budget warnings, car maintenance reminders, and recurring transaction alerts will show up here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as FilterKey);
            setPage(1);
          }}
          className="w-auto"
        >
          <option value="all">All</option>
          <option value="budget">Budget</option>
          <option value="car">Car</option>
          <option value="recurring">Recurring</option>
        </Select>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all read
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Inbox className="size-5 text-slate-300" />
            <p className="text-sm text-text-muted">No alerts in this category.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.08]">
            {pageItems.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3",
                  !a.isRead && "border-l-2 border-indigo-600 bg-indigo-500/10"
                )}
              >
                <div className="min-w-0 flex-1">
                  {a.link ? (
                    <Link
                      href={a.link}
                      onClick={() => !a.isRead && markRead(a.id)}
                      className="text-sm font-medium text-text-primary hover:text-indigo-600"
                    >
                      {a.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  )}
                  <p className="mt-0.5 text-sm text-text-muted">{a.message}</p>
                  <p className="mt-1 text-xs text-text-muted">{formatDate(a.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {!a.isRead && (
                    <button
                      onClick={() => markRead(a.id)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-500/12"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(a.id)}
                    aria-label="Delete alert"
                    className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/[0.08] px-4 py-3">
            <p className="text-sm text-text-muted">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
