"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Pencil, Trash2, PiggyBank, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { ChitFundForm } from "@/components/ChitFundForm";
import type { ChitFund } from "@/lib/types";
import { cn, formatINR, formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
type SortKey = "date" | "amount";

export function ChitFundTable({ contributions, usdRate }: { contributions: ChitFund[]; usdRate: number }) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ChitFund | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groups = useMemo(
    () => [...new Set(contributions.map((c) => c.groupName))].sort((a, b) => a.localeCompare(b)),
    [contributions]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contributions
      .filter((c) => groupFilter === "all" || c.groupName === groupFilter)
      .filter(
        (c) =>
          query === "" ||
          c.groupName.toLowerCase().includes(query) ||
          (c.notes ?? "").toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const cmp = sortKey === "date" ? new Date(a.date).getTime() - new Date(b.date).getTime() : a.amount - b.amount;
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [contributions, search, groupFilter, sortKey, sortDir]);

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

  function openEdit(c: ChitFund) {
    setEditing(c);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this contribution? This cannot be undone.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/chit-funds/${id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (contributions.length === 0) {
    return (
      <>
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-black/[0.06]">
            <PiggyBank className="size-6 text-text-muted" />
          </div>
          <p className="text-sm font-medium text-text-secondary">No contributions logged yet</p>
          <p className="max-w-xs text-sm text-text-muted">
            Keep a running note of your monthly Cheeti contributions — this never affects your income or
            expense totals.
          </p>
          <Button onClick={openAdd} className="mt-2">
            <Plus className="size-4" />
            Log Contribution
          </Button>
        </Card>
        <ChitFundForm
          key={formOpen ? (editing?.id ?? "new") : "closed"}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          contribution={editing}
          usdRate={usdRate}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input
            type="search"
            placeholder="Search group or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-56"
          />
          {groups.length > 1 && (
            <Select
              value={groupFilter}
              onChange={(e) => {
                setGroupFilter(e.target.value);
                setPage(1);
              }}
              className="w-auto"
            >
              <option value="all">All groups</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          )}
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Log Contribution
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-text-muted">No contributions match these filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.08] text-left text-xs font-medium uppercase tracking-wide text-text-muted">
                  <th className="px-4 py-3">Group</th>
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
                {pageItems.map((c) => (
                  <tr key={c.id} className="border-b border-black/[0.08] last:border-0 hover:bg-black/[0.04]">
                    <td className="px-4 py-3">
                      <Badge color="indigo">{c.groupName}</Badge>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{formatDate(c.date)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <p className="font-medium text-text-primary">{formatINR(c.amount)}</p>
                      <p className="text-xs text-text-muted">≈ {formatCurrency(c.amount / usdRate)}</p>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-text-muted">{c.notes || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          aria-label={`Edit contribution to ${c.groupName}`}
                          className="rounded-md p-1.5 text-text-muted hover:bg-black/[0.06] hover:text-text-secondary"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          aria-label={`Delete contribution to ${c.groupName}`}
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

      <ChitFundForm
        key={formOpen ? (editing?.id ?? "new") : "closed"}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        contribution={editing}
        usdRate={usdRate}
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
