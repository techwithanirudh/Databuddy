import type { websites } from '@databuddy/db';

// Explicitly define the insert type to override faulty inference.
// This should be kept in sync with the schema.
export type WebsiteInsert = {
    id: string;
    domain: string;
    name?: string | null;
    status?: 'ACTIVE' | 'HEALTHY' | 'UNHEALTHY' | 'INACTIVE' | 'PENDING';
    userId?: string | null;
    projectId?: string | null;
    isPublic?: boolean;
    organizationId?: string | null;
};

export type WebsiteSelect = typeof websites.$inferSelect;