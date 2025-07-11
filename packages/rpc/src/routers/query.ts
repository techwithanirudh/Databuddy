import { z } from 'zod/v4'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { executeQuery } from '../query'

export const queryRouter = createTRPCRouter({
    query: protectedProcedure
        .input(z.object({
            name: z.string(),
            websiteId: z.string(),
            dateRange: z.object({
                from: z.string(),
                to: z.string(),
            }),
            filters: z.record(z.string(), z.union([
                z.string(),
                z.number(),
                z.array(z.string()),
                z.array(z.number()),
            ])).optional(),
            limit: z.number().optional().default(100),
            offset: z.number().optional().default(0),
            groupBy: z.string().optional(),
        }))
        .query(async ({ input }) => {
            const { name, websiteId, dateRange, filters, limit, offset, groupBy } = input
            const data = await executeQuery(name, websiteId, dateRange.from, dateRange.to, limit, offset, filters, groupBy)
            return data
        }),
}) 