import { PrismaClient } from "../../generated/client/edge";
// import { PrismaPg } from '@prisma/adapter-pg'

export * from '../../generated/client/edge';

const connectionString = `${process.env.DATABASE_URL}`
// const adapter = new PrismaPg({ connectionString })

export const prisma = new PrismaClient({
  // adapter,
}); 