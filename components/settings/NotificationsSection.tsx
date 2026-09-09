"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { UserPreferences } from "@/lib/types";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

type PushStatus = "unsupported" | "checking" | "subscribed" | "unsubscribed" | "denied";

function PushToggle() {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsupported"));
  }, []);

  async function subscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus("unsupported");
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setStatus("subscribed");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported") return null;

  return (
    <div className="flex items-center justify-between gap-4 border-b border-black/[0.08] pb-4">
      <div className="flex items-center gap-3">
        {status === "subscribed" ? (
          <Bell className="size-4 text-indigo-600" />
        ) : (
          <BellOff className="size-4 text-text-muted" />
        )}
        <div>
          <p className="text-sm font-medium text-text-primary">Push notifications on this device</p>
          <p className="text-xs text-text-muted">
            {status === "denied"
              ? "Blocked in your browser settings — enable notifications for this site to turn it back on."
              : "Get a notification here even when the app isn't open."}
          </p>
        </div>
      </div>
      {status !== "denied" && (
        <Button
          variant="outline"
          size="sm"
          disabled={busy || status === "checking"}
          onClick={status === "subscribed" ? unsubscribe : subscribe}
        >
          {status === "subscribed" ? "Disable" : "Enable"}
        </Button>
      )}
    </div>
  );
}

const TOGGLES: { key: keyof UserPreferences["notifications"]; label: string; description: string }[] = [
  {
    key: "budgetWarnings",
    label: "Budget warning alerts",
    description: "Notify when spending approaches or exceeds a budget.",
  },
  {
    key: "carMaintenanceAlerts",
    label: "Car maintenance alerts",
    description: "Notify when maintenance or insurance renewal is due soon.",
  },
  {
    key: "recurringReminders",
    label: "Recurring transaction reminders",
    description: "Notify when a recurring transaction is posted.",
  },
];

export function NotificationsSection({ notifications }: { notifications: UserPreferences["notifications"] }) {
  const [values, setValues] = useState(notifications);

  async function toggle(key: keyof UserPreferences["notifications"]) {
    const next = { ...values, [key]: !values[key] };
    setValues(next);
    await fetch("/api/settings/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifications: next }),
    });
  }

  return (
    <Card className="p-5">
      <p className="mb-4 text-sm font-semibold text-text-primary">Notifications</p>
      <div className="space-y-4">
        <PushToggle />
        {TOGGLES.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-primary">{t.label}</p>
              <p className="text-xs text-text-muted">{t.description}</p>
            </div>
            <button
              onClick={() => toggle(t.key)}
              aria-label={t.label}
              aria-pressed={values[t.key]}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                values[t.key] ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                  values[t.key] ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
