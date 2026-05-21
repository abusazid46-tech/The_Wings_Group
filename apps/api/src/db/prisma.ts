import { PrismaClient } from "@prisma/client";

const globalWithPrisma = globalThis as typeof globalThis & {
  __TWG_TEST_PRISMA__?: PrismaClient;
};

export const prisma = globalWithPrisma.__TWG_TEST_PRISMA__ ?? new PrismaClient();
