import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  const header = ["Date", "Title", "Type", "Category", "Amount", "Notes"];
  const rows = transactions.map((t) =>
    [
      t.date.toISOString().slice(0, 10),
      t.title,
      t.type,
      t.category,
      t.amount.toFixed(2),
      t.notes ?? "",
    ]
      .map((field) => csvEscape(String(field)))
      .join(",")
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sentratrack-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
