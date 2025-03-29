import { z } from 'zod';

export const emailConfigSchema = z.object({
  user: z.string(),
  password: z.string(),
  host: z.string(),
  port: z.number().int().positive().optional(),
  ssl: z.boolean().optional().default(true),
  tls: z.union([z.boolean(), z.record(z.any())]).optional(),
  defaultFrom: z.string().email(),
  timeout: z.number().int().positive().optional(),
  domain: z.string().optional(),
});

export type EmailConfig = z.infer<typeof emailConfigSchema>;

export type EmailTemplate = 'verification' | 'password-reset' | 'welcome';

// Make sure this matches emailjs's MessageAttachment structure
export interface Attachment {
  data?: string;
  path?: string;
  stream?: NodeJS.ReadableStream;
  type?: string;
  name?: string;
  charset?: string;
  method?: string;
  alternative?: boolean;
  inline?: boolean;
  encoded?: boolean;
  headers?: Record<string, string>;
  related?: Attachment[];
  [key: string]: any; // Add index signature to allow any string key
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
} 