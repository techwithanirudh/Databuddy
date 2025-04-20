import { PrismaClient } from "../../generated/client";

export * from '../../generated/client';
/**
 * Get a properly configured PrismaClient instance
 */
const getPrismaClient = () => {
  const client = new PrismaClient({
    // log: ['error'],
  });

  return client;
};

// Add prisma to the global type
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
};

// Export a singleton instance of PrismaClient
export const prisma = globalForPrisma.prisma ?? getPrismaClient();