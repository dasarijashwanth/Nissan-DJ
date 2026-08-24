"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  Calendar,
  BarChart3,
  Target,
  Repeat,
  Bell,
  Car,
  Send,
  PiggyBank,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import { VehicleSwitcher } from "@/components/layout/VehicleSwitcher";
import { MobileMoreMenu } from "@/components/layout/MobileMoreMenu";
import type { TrackingMode } from "@/lib/trackingMode";

const NAV_SECTIONS = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: Home },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/transactions", label: "Transactions", icon: CreditCard },
      { href: "/monthly", label: "Monthly", icon: Calendar },
      { href: "/budgets", label: "Budgets", icon: Target },
      { href: "/recurring", label: "Recurring", icon: Repeat },
    ],
  },
  {
    label: "My Vehicles",
    items: [{ href: "/vehicles", label: "Vehicles", icon: Car }],
  },
  {
    label: "Savings & Transfers",
    items: [
      { href: "/india", label: "Sent to India", icon: Send },
      { href: "/cheeti", label: "Cheeti", icon: PiggyBank },
    ],
  },
] as const;

// Mobile bottom nav only has room for a handful of items; the rest stay reachable from
// the desktop sidebar or in-app links (dashboard budget strip, sentra hub, etc). Vehicles and
// Sent to India share a slot, swapped based on tracking mode, so the bar stays the same size.
// Cheeti isn't in the bottom bar for the same reason Monthly/Recurring/Alerts aren't — reachable
// from the desktop sidebar instead.
const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/india", label: "Sent to India", icon: Send },
  { href: "/budgets", label: "Budgets", icon: Target },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const NOISE_BACKGROUND =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")";

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "my-px flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-150",
        active ? "border-primary-light bg-primary/25 text-white" : "text-white/60 hover:bg-white/[0.07] hover:text-white/90"
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar({
  userEmail,
  unreadAlertCount = 0,
  isAdmin = false,
  trackingMode = "life",
}: {
  userEmail: string;
  unreadAlertCount?: number;
  isAdmin?: boolean;
  trackingMode?: TrackingMode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const isVehicleMode = trackingMode === "vehicle";
  const navSections = NAV_SECTIONS.filter((s) =>
    isVehicleMode ? s.label !== "Savings & Transfers" : s.label !== "My Vehicles"
  );
  const mobileNavItems = MOBILE_NAV_ITEMS.filter((i) =>
    isVehicleMode ? i.href !== "/india" : i.href !== "/vehicles"
  );

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-surface-sidebar lg:flex"
        style={{ backgroundImage: NOISE_BACKGROUND }}
      >
        <div className="flex h-16 items-center gap-2 px-6">
          <span className="text-lg text-primary-light">◈</span>
          <span className="font-display text-lg font-semibold text-white">SentraTrack</span>
        </div>

        {isVehicleMode && <VehicleSwitcher />}

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold tracking-wider text-white/30 uppercase">
                {section.label}
              </p>
              {section.items.map((item) => (
                <NavLink key={item.href} {...item} active={isActive(item.href)} />
              ))}
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-white/10 px-2 py-2">
          <Link
            href="/alerts"
            className={cn(
              "my-px flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-150",
              isActive("/alerts")
                ? "border-primary-light bg-primary/25 text-white"
                : "text-white/60 hover:bg-white/[0.07] hover:text-white/90"
            )}
          >
            <Bell className="size-4.5 shrink-0" />
            <span className="flex-1">Alerts</span>
            {unreadAlertCount > 0 && (
              <span className="flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-semibold text-white">
                {unreadAlertCount > 9 ? "9+" : unreadAlertCount}
              </span>
            )}
          </Link>
          <NavLink href="/settings" label="Settings" icon={Settings} active={isActive("/settings")} />
          {isAdmin && <NavLink href="/admin" label="Admin" icon={ShieldCheck} active={isActive("/admin")} />}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              {userEmail.charAt(0).toUpperCase() || "?"}
            </div>
            <p className="truncate text-xs text-white/50">{userEmail}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white/90"
            >
              <LogOut className="size-4.5 shrink-0" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-black/[0.08] bg-surface-card lg:hidden">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-center text-[10px] leading-tight font-medium transition-colors",
                active ? "text-primary" : "text-text-muted"
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
        <MobileMoreMenu trackingMode={trackingMode} isAdmin={isAdmin} unreadAlertCount={unreadAlertCount} />
      </nav>
    </>
  );
}
