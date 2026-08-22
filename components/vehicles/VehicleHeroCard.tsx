"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Car as CarIcon, Camera, Pencil, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { formatMiles } from "@/lib/utils";
import type { Vehicle } from "@/lib/types";

const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height, 1);
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to compress image"))),
      "image/jpeg",
      0.85
    );
  });
}

export function VehicleHeroCard({ vehicle, currentOdometer }: { vehicle: Vehicle; currentOdometer: number }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [editingPlate, setEditingPlate] = useState(false);
  const [plateValue, setPlateValue] = useState(vehicle.licensePlate ?? "");
  const [savingPlate, setSavingPlate] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed, "car-photo.jpg");
      formData.append("vehicleId", vehicle.id);
      const res = await fetch("/api/vehicles/photo", { method: "POST", body: formData });
      if (res.ok) router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function savePlate() {
    setSavingPlate(true);
    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licensePlate: plateValue.trim() || null }),
      });
      if (res.ok) {
        setEditingPlate(false);
        router.refresh();
      }
    } finally {
      setSavingPlate(false);
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 bg-slate-100 sm:aspect-auto sm:w-72">
          {vehicle.photoUrl ? (
            <Image src={vehicle.photoUrl} alt={`${vehicle.make} ${vehicle.model}`} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <CarIcon className="size-16 text-slate-300" strokeWidth={1} />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur hover:bg-white disabled:opacity-50"
          >
            <Camera className="size-3.5" />
            {uploading ? "Uploading..." : vehicle.photoUrl ? "Change photo" : "Add photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-3 p-6">
          <h1 className="text-2xl font-bold text-text-primary">{vehicle.nickname}</h1>
          <p className="-mt-2 text-sm text-text-muted">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </p>
          <p className="text-sm text-text-muted">
            Color: {vehicle.color} <span className="mx-1.5 text-slate-300">|</span> Year: {vehicle.year}
          </p>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-text-muted">Plate:</span>
            {editingPlate ? (
              <>
                <input
                  autoFocus
                  value={plateValue}
                  onChange={(e) => setPlateValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePlate()}
                  className="w-28 rounded-md border border-black/[0.08] bg-surface-page px-2 py-1 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={savePlate}
                  disabled={savingPlate}
                  aria-label="Save license plate"
                  className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"
                >
                  <Check className="size-4" />
                </button>
                <button
                  onClick={() => {
                    setPlateValue(vehicle.licensePlate ?? "");
                    setEditingPlate(false);
                  }}
                  aria-label="Cancel"
                  className="rounded-md p-1 text-text-muted hover:bg-slate-100"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingPlate(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-text-secondary hover:bg-slate-100"
              >
                {vehicle.licensePlate || <span className="text-text-muted">Add plate</span>}
                <Pencil className="size-3" />
              </button>
            )}
          </div>

          <p className="text-sm text-text-muted">
            Odometer:{" "}
            <span className="font-medium text-text-primary">{formatMiles(currentOdometer)}</span>
          </p>

          <div className="mt-1 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="w-fit" onClick={() => setDetailsOpen(true)}>
              Edit vehicle details
            </Button>
          </div>
        </div>
      </div>

      <VehicleForm open={detailsOpen} onClose={() => setDetailsOpen(false)} vehicle={vehicle} />
    </Card>
  );
}
