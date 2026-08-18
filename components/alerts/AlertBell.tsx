"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { AlertDropdown } from "@/components/alerts/AlertDropdown";
import type { Alert } from "@/lib/types";

export function AlertBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/alerts")
      .then((res) => (res.ok ? res.json() : []))
      .then(setAlerts)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  async function markAllRead() {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    await fetch("/api/alerts", { method: "PATCH" });
  }

  async function handleAlertClick(alert: Alert) {
    setOpen(false);
    if (alert.isRead) return;
    setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, isRead: true } : a)));
    await fetch(`/api/alerts/${alert.id}/read`, { method: "PATCH" });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-text-muted hover:bg-slate-100"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <AlertDropdown alerts={alerts.slice(0, 10)} onMarkAllRead={markAllRead} onAlertClick={handleAlertClick} />
      )}
    </div>
  );
}
