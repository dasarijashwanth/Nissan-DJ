"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus, Repeat } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RecurringCard } from "@/components/recurring/RecurringCard";
import { RecurringForm } from "@/components/recurring/RecurringForm";
import { daysUntilDue } from "@/lib/recurringUtils";
import type { RecurringTransaction } from "@/lib/types";

export function RecurringList({ recurring }: { recurring: RecurringTransaction[] }) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [posting, setPosting] = useState(false);

  const dueToday = recurring.filter((r) => r.isActive && daysUntilDue(r.nextDueDate) <= 0);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(r: RecurringTransaction) {
    setEditing(r);
    setFormOpen(true);
  }

  async function postAll() {
    setPosting(true);
    try {
      await Promise.all(dueToday.map((r) => fetch(`/api/recurring/${r.id}`, { method: "POST" })));
      router.refresh();
    } finally {
      setPosting(false);
    }
  }

  if (recurring.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-black/[0.06]">
            <Repeat className="size-6 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No recurring transactions yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Set up salary, rent, or subscriptions to post automatically on schedule.
          </p>
          <Button onClick={openAdd} className="mt-2">
            <Plus className="size-4" />
            Add Recurring
          </Button>
        </Card>
        <RecurringForm key={formOpen ? "open" : "closed"} open={formOpen} onClose={() => setFormOpen(false)} recurring={editing} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {dueToday.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-3 border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0 text-amber-600" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {dueToday.length} recurring transaction{dueToday.length > 1 ? "s are" : " is"} due today
            </p>
          </div>
          <Button size="sm" onClick={postAll} loading={posting} className="bg-amber-500 hover:bg-amber-600">
            Post all
          </Button>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Recurring
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recurring.map((r) => (
          <RecurringCard key={r.id} recurring={r} onEdit={() => openEdit(r)} />
        ))}
      </div>

      <RecurringForm key={formOpen ? (editing?.id ?? "new") : "closed"} open={formOpen} onClose={() => setFormOpen(false)} recurring={editing} />
    </div>
  );
}
