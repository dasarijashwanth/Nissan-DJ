import { prisma } from "@/lib/prisma";

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return user?.isAdmin ?? false;
}

export type AdminUserSummary = {
  id: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  vehicleCount: number;
  transactionCount: number;
};

/** Every user in the system, for the admin user-picker — not scoped to the caller. */
export async function getAllUsersForAdmin(): Promise<AdminUserSummary[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { transactions: true } },
      vehicles: { where: { isActive: true }, select: { id: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    createdAt: u.createdAt.toISOString(),
    isAdmin: u.isAdmin,
    vehicleCount: u.vehicles.length,
    transactionCount: u._count.transactions,
  }));
}

export async function getUserById(userId: string): Promise<{ id: string; email: string; createdAt: string } | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return { id: user.id, email: user.email, createdAt: user.createdAt.toISOString() };
}
