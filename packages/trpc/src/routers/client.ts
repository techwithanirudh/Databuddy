import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { ClientService, ClientType } from '@databuddy/db';
import { router, protectedProcedure } from '../trpc';

const clientCreateSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.nativeEnum(ClientType).default(ClientType.COMPANY),
  organizationId: z.string().uuid(),
});

const clientUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  type: z.nativeEnum(ClientType).optional(),
});

export const clientRouter = router({
  // Create a new client
  create: protectedProcedure
    .input(clientCreateSchema)
    .mutation(async ({ input }) => {
      try {
        const client = await ClientService.create({
          name: input.name,
          email: input.email,
          phone: input.phone,
          type: input.type,
          organization: {
            connect: { id: input.organizationId }
          }
        });
        return client;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create client',
          cause: error,
        });
      }
    }),

  // Get client by ID
  byId: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      const client = await ClientService.findById(input);
      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }
      return client;
    }),

  // List clients by organization
  byOrganization: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      try {
        const clients = await ClientService.findByOrganization(input);
        return clients;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to list clients',
          cause: error,
        });
      }
    }),

  // Update client
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: clientUpdateSchema,
    }))
    .mutation(async ({ input }) => {
      try {
        const client = await ClientService.update(input.id, input.data);
        return client;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update client',
          cause: error,
        });
      }
    }),

  // Delete client
  delete: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input }) => {
      try {
        await ClientService.delete(input);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete client',
          cause: error,
        });
      }
    }),
}); 