"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Pencil, Trash2, Receipt, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { TransactionForm } from "@/components/TransactionForm";
import { CATEGORIES, type Transaction } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
type SortKey = "date" | "amount" | "title";

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();

  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => typeFilter === "all" || t.type === typeFilter)
      .filter((t) => categoryFilter === "all" || t.category === categoryFilter)
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (sortKey === "amount") cmp = a.amount - b.amount;
        else cmp = a.title.localeCompare(b.title);
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [transactions, typeFilter, categoryFilter, sortKey, sortDir]);

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

  function openEdit(t: Transaction) {
    setEditing(t);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100">
            <Receipt className="size-6 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No transactions yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Add your first income or expense to start tracking your finances.
          </p>
          <Button onClick={openAdd} className="mt-2">
            <Plus className="size-4" />
            Add Transaction
          </Button>
        </Card>
        <TransactionForm
          key={formOpen ? (editing?.id ?? "new") : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          transaction={editing}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as typeof typeFilter);
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-auto"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add Transaction
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted">
            No transactions match these filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <SortableHeader label="Title" sortKey="title" active={sortKey} dir={sortDir} onClick={toggleSort} />
                  <th className="px-4 py-3">Category</th>
                  <SortableHeader label="Date" sortKey="date" active={sortKey} dir={sortDir} onClick={toggleSort} />
                  <SortableHeader label="Amount" sortKey="amount" active={sortKey} dir={sortDir} onClick={toggleSort} align="right" />
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => (
                  <tr key={t.id} className="border-b border-black/[0.08] last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-text-primary">{t.title}</td>
                    <td className="px-4 py-3">
                      <Badge color="slate">{t.category}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(t.date)}</td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-medium tabular-nums",
                        t.type === "income" ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          aria-label={`Edit ${t.title}`}
                          className="rounded-md p-1.5 text-text-muted hover:bg-slate-100 hover:text-text-secondary"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          disabled={deletingId === t.id}
                          aria-label={`Delete ${t.title}`}
                          className="rounded-md p-1.5 text-text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
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
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => p - 1)}
              >
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

      <TransactionForm
          key={formOpen ? (editing?.id ?? "new") : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          transaction={editing}
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
        className={cn(
          "inline-flex items-center gap-1 hover:text-text-secondary",
          align === "right" && "flex-row-reverse"
        )}
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
