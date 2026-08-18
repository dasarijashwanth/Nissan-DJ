import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { isCarOwnedBy, getInsurancePolicies, createCarTransaction } from "@/lib/carQueries";
import { validateInsurance, type InsuranceFormValues } from "@/lib/carValidation";

export async function GET(_request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(await getInsurancePolicies(carId));
}

export async function POST(request: Request, { params }: { params: Promise<{ carId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { carId } = await params;
  if (!(await isCarOwnedBy(carId, user.id))) {
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

  const monthlyCost = Number(values.monthlyCost);
  const startDate = new Date(values.startDate);

  const policy = await prisma.insurance.create({
    data: {
      carId,
      provider: values.provider.trim(),
      policyNumber: values.policyNumber.trim() || null,
      monthlyCost,
      startDate,
      renewalDate: new Date(values.renewalDate),
      coverageType: values.coverageType,
      notes: values.notes.trim() || null,
    },
  });

  await createCarTransaction(user.id, "insurance", `${values.provider.trim()} insurance`, monthlyCost, startDate);

  return NextResponse.json(policy, { status: 201 });
}
