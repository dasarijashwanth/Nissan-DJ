"use client";

import Link from "next/link";
import { Bell, Inbox } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { Alert } from "@/lib/types";

export interface AlertDropdownProps {
  alerts: Alert[];
  onMarkAllRead: () => void;
  onAlertClick: (alert: Alert) => void;
}

export function AlertDropdown({ alerts, onMarkAllRead, onAlertClick }: AlertDropdownProps) {
  return (
    <div className="absolute right-0 top-full z-40 mt-2 w-80 rounded-xl border border-black/[0.08] bg-surface-card shadow-lg">
      <div className="flex items-center justify-between border-b border-black/[0.08] px-4 py-3">
        <p className="text-sm font-semibold text-text-primary">Notifications</p>
        <button onClick={onMarkAllRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="size-5 text-slate-300" />
            <p className="text-sm text-text-muted">No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/[0.08]">
            {alerts.map((a) => {
              const content = (
                <div
                  className={cn(
                    "block px-4 py-3 hover:bg-black/[0.04]",
                    !a.isRead && "border-l-2 border-indigo-600 bg-indigo-500/10"
                  )}
                >
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{a.message}</p>
                  <p className="mt-1 text-[11px] text-text-muted">{formatDate(a.createdAt)}</p>
                </div>
              );

              return (
                <li key={a.id}>
                  {a.link ? (
                    <Link href={a.link} onClick={() => onAlertClick(a)}>
                      {content}
                    </Link>
                  ) : (
                    <button className="w-full text-left" onClick={() => onAlertClick(a)}>
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Link
        href="/alerts"
        className="flex items-center justify-center gap-1.5 border-t border-black/[0.08] py-2.5 text-xs font-medium text-text-muted hover:bg-black/[0.04]"
      >
        <Bell className="size-3.5" />
        View all alerts
      </Link>
    </div>
  );
}
