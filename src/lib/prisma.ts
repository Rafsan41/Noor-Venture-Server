import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";
import { logger } from "../config/logger.js";

const connectionString = process.env.DATABASE_URL as string;

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "error" },
    ],
  });

(prisma as any).$on("error", (e: any) => {
  logger.error(`Prisma error: ${e.message}`);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
