import { z } from 'zod';
import type { executeSqlQueryTool } from '../tools';
import type { InferUITool, UIMessage } from 'ai';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type executeSqlQuery = InferUITool<typeof executeSqlQueryTool>;

export type ChatTools = {
  executeSqlQuery: executeSqlQuery;
};

export type ChatMessage = UIMessage<
  MessageMetadata,
  ChatTools
>;

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
}