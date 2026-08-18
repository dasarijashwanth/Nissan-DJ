import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isVehicleOwnedBy } from "@/lib/vehicleQueries";
import { validateInsurance, type InsuranceFormValues } from "@/lib/vehicleValidation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ vehicleId: string; insuranceId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId, insuranceId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await prisma.insurance.findUnique({ where: { id: insuranceId } });
  if (!existing || existing.vehicleId !== vehicleId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<InsuranceFormValues>;
  const values: InsuranceFormValues = {
    provider: body.provider ?? "",
    policyNumber: body.policyNumber ?? "",
    monthlyCost: body.monthlyCost ?? "",
    startDate: body.startDate ?? "",
    renewalDate: body.renewalDate ?? "",
    coverageType: body.coverageType ?? "",
    notes: body.notes ?? "",
  };

  const { valid, errors } = validateInsurance(values);
  if (!valid) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const policy = await prisma.insurance.update({
    where: { id: insuranceId },
    data: {
      provider: values.provider.trim(),
      policyNumber: values.policyNumber.trim() || null,
      monthlyCost: Number(values.monthlyCost),
      startDate: new Date(values.startDate),
      renewalDate: new Date(values.renewalDate),
      coverageType: values.coverageType,
      notes: values.notes.trim() || null,
    },
  });

  return NextResponse.json(policy);
}
