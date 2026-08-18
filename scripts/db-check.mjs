import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client.ts";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const vehicles = await prisma.vehicle.findMany();
console.log("Vehicles:", JSON.stringify(vehicles, null, 2));

const users = await prisma.user.findMany({ include: { vehicles: true } });
console.log("Users with vehicles:", JSON.stringify(users, null, 2));

await prisma.$disconnect();
