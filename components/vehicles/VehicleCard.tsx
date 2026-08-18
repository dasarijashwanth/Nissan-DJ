"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { Car as CarIcon, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatMiles } from "@/lib/utils";
import { useVehicle } from "@/hooks/useVehicle";
import type { Vehicle } from "@/lib/types";

export function VehicleCard({
  vehicle,
  currentOdometer,
  totalSpend,
  style,
}: {
  vehicle: Vehicle;
  currentOdometer: number;
  totalSpend: number;
  style?: CSSProperties;
}) {
  const router = useRouter();
  const { refetch } = useVehicle();
  const [working, setWorking] = useState(false);

  async function setPrimary() {
    setWorking(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });
      if (res.ok) {
        refetch();
        router.refresh();
      }
    } finally {
      setWorking(false);
    }
  }

  async function archive() {
    if (!confirm(`Archive ${vehicle.nickname}? It'll be hidden from your vehicle list, but its history is kept.`)) {
      return;
    }
    setWorking(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, { method: "DELETE" });
      if (res.ok) {
        refetch();
        router.refresh();
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <Card className="overflow-hidden p-0" style={style}>
      <div className="relative aspect-video w-full bg-slate-100">
        {vehicle.photoUrl ? (
          <Image src={vehicle.photoUrl} alt={vehicle.nickname} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CarIcon className="size-12 text-slate-300" strokeWidth={1} />
          </div>
        )}
        {vehicle.isPrimary && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
            <Star className="size-3" fill="currentColor" />
            Primary
          </span>
        )}
      </div>

      <div className="space-y-1 p-5">
        <p className="text-base font-semibold text-text-primary">{vehicle.nickname}</p>
        <p className="text-sm text-text-muted">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        <p className="text-sm text-text-muted">
          {vehicle.color} · {formatMiles(currentOdometer)}
        </p>
        <p className="text-sm font-medium text-text-secondary">{formatCurrency(totalSpend)} total spent</p>

        <div className="flex flex-wrap gap-2 pt-3">
          <Link href={`/vehicles/${vehicle.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              View
            </Button>
          </Link>
          {!vehicle.isPrimary && (
            <Button variant="outline" size="sm" className="flex-1" onClick={setPrimary} loading={working}>
              Set primary
            </Button>
          )}
          <Button variant="danger" size="sm" className="flex-1" onClick={archive} loading={working}>
            Archive
          </Button>
        </div>
      </div>
    </Card>
  );
}
