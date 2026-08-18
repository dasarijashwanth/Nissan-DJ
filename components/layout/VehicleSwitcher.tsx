"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Car, ChevronDown, Check, Plus } from "lucide-react";
import { useVehicle } from "@/hooks/useVehicle";
import { cn } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";

export function VehicleSwitcher() {
  const { vehicles, activeVehicle, setActiveVehicle, isLoading } = useVehicle();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function selectVehicle(vehicle: Vehicle) {
    setActiveVehicle(vehicle);
    setOpen(false);

    // Preserve the current sub-page (fuel/maintenance/etc) when switching vehicles.
    const match = pathname.match(/^\/vehicles\/[^/]+(\/.*)?$/);
    const suffix = match?.[1] ?? "";
    router.push(`/vehicles/${vehicle.id}${suffix}`);
  }

  if (isLoading || !activeVehicle) {
    return <div className="mx-3 mb-2 h-[42px] animate-pulse rounded-md bg-white/5" />;
  }

  return (
    <div className="relative mx-3 mb-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/10"
      >
        <Car className="size-4 shrink-0 text-accent" />
        <span className="flex-1 truncate">
          {activeVehicle.year} {activeVehicle.nickname}
        </span>
        <ChevronDown className={cn("size-3.5 shrink-0 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 left-0 z-20 mt-1 overflow-hidden rounded-md border border-white/10 bg-surface-sidebar shadow-lg">
            {vehicles.map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => selectVehicle(vehicle)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/5"
              >
                <Check
                  className={cn(
                    "size-3.5 shrink-0",
                    vehicle.id === activeVehicle.id ? "text-primary-light" : "text-transparent"
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{vehicle.nickname}</p>
                  <p className="truncate text-xs text-white/40">
                    {vehicle.color} · {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                </div>
              </button>
            ))}
            <Link
              href="/vehicles/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white"
            >
              <Plus className="size-3.5" />
              Add another vehicle
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
