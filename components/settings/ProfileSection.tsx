"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ProfileSection({
  email,
  displayName: initialDisplayName,
}: {
  email: string;
  displayName: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveDisplayName() {
    setSavingName(true);
    setNameSaved(false);
    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      if (res.ok) setNameSaved(true);
    } finally {
      setSavingName(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPasswordError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Card className="space-y-6 p-5">
      <div>
        <p className="mb-4 text-sm font-semibold text-slate-900">Profile</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setNameSaved(false);
            }}
            onBlur={saveDisplayName}
          />
          <Input label="Email" value={email} disabled readOnly />
        </div>
        {savingName && <p className="mt-1.5 text-xs text-slate-400">Saving…</p>}
        {nameSaved && !savingName && <p className="mt-1.5 text-xs text-emerald-600">Saved</p>}
      </div>

      <div className="border-t border-slate-100 pt-6">
        <p className="mb-4 text-sm font-semibold text-slate-900">Change Password</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
          {passwordSuccess && <p className="text-sm text-emerald-600">Password updated.</p>}
          <Button type="submit" loading={savingPassword}>
            Update Password
          </Button>
        </form>
      </div>
    </Card>
  );
}
