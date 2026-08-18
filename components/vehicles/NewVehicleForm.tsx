"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Car as CarIcon, Camera } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COVERAGE_TYPES } from "@/lib/types";
import { toDateInputValue } from "@/lib/utils";
import { validateNewVehicle, type NewVehicleFieldErrors, type NewVehicleFormValues } from "@/lib/vehicleValidation";
import { useVehicle } from "@/hooks/useVehicle";

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

function emptyValues(): NewVehicleFormValues {
  return {
    nickname: "",
    year: "",
    make: "",
    model: "",
    color: "",
    licensePlate: "",
    purchasePrice: "",
    purchaseDate: "",
    startOdometer: "",
    insuranceProvider: "",
    insuranceMonthlyCost: "",
    insuranceStartDate: toDateInputValue(new Date()),
    insuranceRenewalDate: "",
    insuranceCoverageType: "",
  };
}

export function NewVehicleForm() {
  const router = useRouter();
  const { setActiveVehicle } = useVehicle();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<NewVehicleFormValues>(emptyValues);
  const [errors, setErrors] = useState<NewVehicleFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  function set<K extends keyof NewVehicleFormValues>(key: K, value: NewVehicleFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed, "vehicle-photo.jpg");
      const res = await fetch("/api/vehicles/photo", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setPhotoUrl(data.photoUrl);
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateNewVehicle(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setErrors({});

    try {
      const hasInsurance = values.insuranceProvider.trim().length > 0;

      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: values.nickname.trim(),
          make: values.make.trim(),
          model: values.model.trim(),
          year: values.year,
          color: values.color.trim(),
          licensePlate: values.licensePlate.trim() || null,
          photoUrl,
          purchasePrice: values.purchasePrice === "" ? null : values.purchasePrice,
          purchaseDate: values.purchaseDate || null,
          startOdometer: values.startOdometer,
          insurance: hasInsurance
            ? {
                provider: values.insuranceProvider.trim(),
                monthlyCost: values.insuranceMonthlyCost,
                startDate: values.insuranceStartDate,
                renewalDate: values.insuranceRenewalDate,
                coverageType: values.insuranceCoverageType || "Liability",
              }
            : undefined,
        }),
      });

      if (!res.ok) {
        setFormError("Something went wrong. Please try again.");
        return;
      }

      const vehicle = await res.json();
      setActiveVehicle(vehicle);
      router.push(`/vehicles/${vehicle.id}?welcome=1`);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/vehicles" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ChevronLeft className="size-4" />
          My Vehicles
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-white">Add a vehicle</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              {photoUrl ? (
                <Image src={photoUrl} alt="Vehicle" fill className="object-cover" />
              ) : (
                <CarIcon className="size-8 text-slate-300" strokeWidth={1} />
              )}
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                <Camera className="size-3.5" />
                {uploadingPhoto ? "Uploading..." : photoUrl ? "Change photo" : "Add a photo"}
              </Button>
              <p className="mt-1 text-xs text-text-muted">Optional — you can always add one later.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nickname"
              placeholder="My Sentra"
              value={values.nickname}
              onChange={(e) => set("nickname", e.target.value)}
              error={errors.nickname}
            />
            <Input
              label="Year"
              type="number"
              value={values.year}
              onChange={(e) => set("year", e.target.value)}
              error={errors.year}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Make"
              placeholder="Nissan"
              value={values.make}
              onChange={(e) => set("make", e.target.value)}
              error={errors.make}
            />
            <Input
              label="Model"
              placeholder="Sentra"
              value={values.model}
              onChange={(e) => set("model", e.target.value)}
              error={errors.model}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Color"
              placeholder="Silver"
              value={values.color}
              onChange={(e) => set("color", e.target.value)}
              error={errors.color}
            />
            <Input
              label="License plate (optional)"
              value={values.licensePlate}
              onChange={(e) => set("licensePlate", e.target.value)}
            />
          </div>

          <div className="border-t border-black/[0.08] pt-5">
            <p className="mb-3 text-sm font-medium text-text-secondary">Purchase info (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Purchase price"
                type="number"
                step="0.01"
                min="0"
                value={values.purchasePrice}
                onChange={(e) => set("purchasePrice", e.target.value)}
              />
              <Input
                label="Purchase date"
                type="date"
                value={values.purchaseDate}
                onChange={(e) => set("purchaseDate", e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-black/[0.08] pt-5">
            <p className="mb-1 text-sm font-medium text-text-secondary">Odometer tracking</p>
            <Input
              label="Starting odometer reading"
              type="number"
              step="1"
              min="0"
              value={values.startOdometer}
              onChange={(e) => set("startOdometer", e.target.value)}
              error={errors.startOdometer}
            />
            <p className="mt-1 text-xs text-text-muted">
              The odometer reading when you began tracking. Used to calculate total miles driven and cost per mile.
            </p>
          </div>

          <div className="border-t border-black/[0.08] pt-5">
            <p className="mb-3 text-sm font-medium text-text-secondary">Insurance (optional, add now or later)</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Provider"
                value={values.insuranceProvider}
                onChange={(e) => set("insuranceProvider", e.target.value)}
                error={errors.insuranceProvider}
              />
              <Input
                label="Monthly cost"
                type="number"
                step="0.01"
                min="0"
                value={values.insuranceMonthlyCost}
                onChange={(e) => set("insuranceMonthlyCost", e.target.value)}
                error={errors.insuranceMonthlyCost}
              />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Input
                label="Renewal date"
                type="date"
                value={values.insuranceRenewalDate}
                onChange={(e) => set("insuranceRenewalDate", e.target.value)}
                error={errors.insuranceRenewalDate}
              />
              <Select
                label="Coverage type"
                value={values.insuranceCoverageType}
                onChange={(e) => set("insuranceCoverageType", e.target.value)}
              >
                <option value="">Select type</option>
                {COVERAGE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" loading={submitting}>
            Add vehicle →
          </Button>
        </form>
      </Card>
    </div>
  );
}
