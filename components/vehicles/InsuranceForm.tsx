"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { COVERAGE_TYPES, type Insurance } from "@/lib/types";
import { toDateInputValue, toStoredDateInputValue } from "@/lib/utils";
import {
  validateInsurance,
  type InsuranceFieldErrors,
  type InsuranceFormValues,
} from "@/lib/vehicleValidation";

function emptyValues(): InsuranceFormValues {
  return {
    provider: "",
    policyNumber: "",
    monthlyCost: "",
    startDate: toDateInputValue(new Date()),
    renewalDate: "",
    coverageType: "",
    notes: "",
  };
}

function valuesFromPolicy(policy: Insurance): InsuranceFormValues {
  return {
    provider: policy.provider,
    policyNumber: policy.policyNumber ?? "",
    monthlyCost: String(policy.monthlyCost),
    startDate: toStoredDateInputValue(policy.startDate),
    renewalDate: toStoredDateInputValue(policy.renewalDate),
    coverageType: policy.coverageType,
    notes: policy.notes ?? "",
  };
}

export interface InsuranceFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  policy?: Insurance | null;
}

export function InsuranceForm({ open, onClose, vehicleId, policy }: InsuranceFormProps) {
  const router = useRouter();
  const isEdit = !!policy;

  const [values, setValues] = useState<InsuranceFormValues>(() =>
    policy ? valuesFromPolicy(policy) : emptyValues()
  );
  const [errors, setErrors] = useState<InsuranceFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof InsuranceFormValues>(key: K, value: InsuranceFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const { valid, errors: fieldErrors } = validateInsurance(values);
    if (!valid) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = isEdit
        ? `/api/vehicles/${vehicleId}/insurance/${policy!.id}`
        : `/api/vehicles/${vehicleId}/insurance`;
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.errors) setErrors(data.errors);
        setFormError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit Insurance Policy" : "Add Insurance Policy"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Provider"
          value={values.provider}
          onChange={(e) => set("provider", e.target.value)}
          error={errors.provider}
        />
        <Input
          label="Policy number (optional)"
          value={values.policyNumber}
          onChange={(e) => set("policyNumber", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monthly cost"
            type="number"
            step="0.01"
            min="0"
            value={values.monthlyCost}
            onChange={(e) => set("monthlyCost", e.target.value)}
            error={errors.monthlyCost}
          />
          <Select
            label="Coverage type"
            value={values.coverageType}
            onChange={(e) => set("coverageType", e.target.value)}
            error={errors.coverageType}
          >
            <option value="" disabled>
              Select type
            </option>
            {COVERAGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            value={values.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="Renewal date"
            type="date"
            value={values.renewalDate}
            onChange={(e) => set("renewalDate", e.target.value)}
            error={errors.renewalDate}
          />
        </div>
        <Textarea
          label="Notes (optional)"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
        />

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600" loading={submitting}>
            {isEdit ? "Save Changes" : "Add Policy"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
