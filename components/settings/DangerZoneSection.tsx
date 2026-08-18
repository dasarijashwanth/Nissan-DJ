"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, UserX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function DangerZoneSection() {
  const router = useRouter();
  const [deletingTransactions, setDeletingTransactions] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  async function handleDeleteTransactions() {
    if (!confirm("Delete ALL transactions? This cannot be undone.")) return;
    setDeletingTransactions(true);
    try {
      const res = await fetch("/api/settings/transactions", { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setDeletingTransactions(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") return;
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      if (res.ok) router.push("/login");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <Card className="border-red-200 p-5">
      <p className="mb-4 text-sm font-semibold text-red-700">Danger Zone</p>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 pb-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Export all my data</p>
            <p className="text-xs text-slate-500">Download a JSON file of everything in your account.</p>
          </div>
          <a
            href="/api/settings/export-data"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="size-4" />
            Export JSON
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 pb-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Delete all transactions</p>
            <p className="text-xs text-slate-500">Removes every income/expense entry. Car data is kept.</p>
          </div>
          <Button variant="danger" size="sm" onClick={handleDeleteTransactions} loading={deletingTransactions}>
            <Trash2 className="size-4" />
            Delete Transactions
          </Button>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">Delete account</p>
              <p className="text-xs text-slate-500">Permanently deletes your account and all data.</p>
            </div>
            {!showDeleteAccount && (
              <Button variant="danger" size="sm" onClick={() => setShowDeleteAccount(true)}>
                <UserX className="size-4" />
                Delete Account
              </Button>
            )}
          </div>

          {showDeleteAccount && (
            <div className="mt-3 space-y-3 rounded-lg bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Type <span className="font-semibold">DELETE</span> to confirm. This cannot be undone.
              </p>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={confirmText !== "DELETE"}
                  loading={deletingAccount}
                  onClick={handleDeleteAccount}
                >
                  Permanently Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
