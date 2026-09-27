"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Repeat, Bell, PiggyBank, ShieldCheck, MoreHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import type { TrackingMode } from "@/lib/trackingMode";

export function MobileMoreMenu({
  trackingMode,
  isAdmin,
  unreadAlertCount,
}: {
  trackingMode: TrackingMode;
  isAdmin: boolean;
  unreadAlertCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isVehicleMode = trackingMode === "vehicle";

  const items = [
    { href: "/monthly", label: "Monthly", icon: Calendar },
    { href: "/recurring", label: "Recurring", icon: Repeat },
    { href: "/alerts", label: "Alerts", icon: Bell, badge: unreadAlertCount },
    // Sent to India is already in the main bar's swapped slot in Life mode, and both India and
    // Cheeti are hidden entirely in Vehicle mode (matching the desktop sidebar), so only Cheeti
    // needs a spot here — Sent to India never needs a duplicate entry.
    ...(!isVehicleMode ? [{ href: "/cheeti", label: "Cheeti", icon: PiggyBank }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  const active = items.some((i) => pathname.startsWith(i.href));

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-center text-[10px] leading-tight font-medium transition-colors",
          active ? "text-primary" : "text-text-muted"
        )}
      >
        <MoreHorizontal className="size-5 shrink-0" />
        More
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="More">
        <nav className="-mx-2 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-black/[0.06] text-text-primary"
                  : "text-text-secondary hover:bg-black/[0.04]"
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge! > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                  {item.badge! > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </Modal>
    </>
  );
}
