import { prisma } from "@/lib/prisma";
import type { IndiaTransfer } from "@/lib/types";

export async function getIndiaTransfers(userId: string): Promise<IndiaTransfer[]> {
  const transfers = await prisma.indiaTransfer.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return transfers.map((t) => ({
    ...t,
    date: t.date.toISOString(),
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function isIndiaTransferOwnedBy(id: string, userId: string): Promise<boolean> {
  const t = await prisma.indiaTransfer.findUnique({ where: { id }, select: { userId: true } });
  return t?.userId === userId;
}
