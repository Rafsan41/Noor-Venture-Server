import { PrismaClient } from "@prisma/client";
import { logger } from "../config/logger";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
    ],
  });

prisma.$on("error" as never, (e: any) => {
  logger.error(`Prisma error: ${e.message}`);
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
