import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { isVehicleOwnedBy } from "@/lib/vehicleQueries";
import { getDailyOdometerEntries, getDailyOdometerStats, upsertDailyOdometer } from "@/lib/dailyOdometerQueries";

// Callers always pass their browser's local calendar date ("today") explicitly — computing "today"
// from the server's own clock would misclassify entries near midnight for users in other timezones.
function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const todayParam = searchParams.get("today");
  if (!todayParam) {
    return NextResponse.json({ error: "Missing 'today' query param." }, { status: 400 });
  }
  const today = parseDateOnly(todayParam);

  const to = searchParams.get("to") ? parseDateOnly(searchParams.get("to")!) : today;
  const from = searchParams.get("from")
    ? parseDateOnly(searchParams.get("from")!)
    : (() => {
        const d = new Date(to);
        d.setUTCDate(d.getUTCDate() - 89);
        return d;
      })();

  const [entries, stats] = await Promise.all([
    getDailyOdometerEntries(vehicleId, from, to),
    getDailyOdometerStats(vehicleId, today),
  ]);

  return NextResponse.json({ entries, stats });
}

type DailyOdometerBody = {
  date?: string;
  miles?: number | string;
  notes?: string | null;
};

export async function POST(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vehicleId } = await params;
  if (!(await isVehicleOwnedBy(vehicleId, user.id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as DailyOdometerBody;
  if (!body.date || body.miles === undefined || body.miles === "" || Number.isNaN(Number(body.miles))) {
    return NextResponse.json({ error: "A date and odometer reading are required." }, { status: 400 });
  }

  const entry = await upsertDailyOdometer(
    vehicleId,
    parseDateOnly(body.date),
    Number(body.miles),
    body.notes?.trim() || null
  );

  return NextResponse.json(entry, { status: 201 });
}
