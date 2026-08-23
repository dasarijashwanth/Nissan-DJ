"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Pencil, Trash2, Send, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IndiaTransferForm } from "@/components/IndiaTransferForm";
import type { IndiaTransfer } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
type SortKey = "date" | "amount";

export function IndiaTransferTable({ transfers }: { transfers: IndiaTransfer[] }) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IndiaTransfer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transfers
      .filter(
        (t) =>
          query === "" ||
          t.recipient.toLowerCase().includes(query) ||
          (t.notes ?? "").toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const cmp = sortKey === "date" ? new Date(a.date).getTime() - new Date(b.date).getTime() : a.amount - b.amount;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [transfers, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  }

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(t: IndiaTransfer) {
    setEditing(t);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transfer? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/india-transfers/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (transfers.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-black/[0.06]">
            <Send className="size-6 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No transfers logged yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Keep a running note of money you send to family in India — this never affects your income or
            expense totals.
          </p>
          <Button onClick={openAdd} className="mt-2">
            <Plus className="size-4" />
            Log Transfer
          </Button>
        </Card>
        <IndiaTransferForm
          key={formOpen ? (editing?.id ?? "new") : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          transfer={editing}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          type="search"
          placeholder="Search recipient or notes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-56"
        />
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Log Transfer
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted">No transfers match this search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Recipient</th>
                  <SortableHeader label="Date" sortKey="date" active={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortableHeader
                    label="Amount"
                    sortKey="amount"
                    active={sortKey}
                    dir={sortDir}
                    onClick={toggleSort}
                    align="right"
                  />
                  <th className="px-4 py-3">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => (
                  <tr key={t.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
                    <td className="px-4 py-3 font-medium text-text-primary">{t.recipient}</td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-text-primary">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-text-muted">{t.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          aria-label={`Edit transfer to ${t.recipient}`}
                          className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          aria-label={`Delete transfer to ${t.recipient}`}
                          className="rounded-md p-1.5 text-text-muted hover:bg-red-500/10 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <IndiaTransferForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        transfer={editing}
      />
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey;
  dir: "asc" | "desc";
  onClick: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  return (
    <th className={cn("px-4 py-3", align === "right" && "text-right")}>
      <button
        onClick={() => onClick(sortKey)}
        className={cn("inline-flex items-center gap-1 hover:text-text-secondary", align === "right" && "flex-row-reverse")}
      >
        {label}
        <ArrowUpDown
          className={cn(
            "size-3",
            active === sortKey ? "text-text-secondary" : "text-slate-300",
            active === sortKey && dir === "asc" && "rotate-180"
          )}
        />
      </button>
    </th>
  );
}
