import { z } from 'zod';
import type { executeSqlQuery } from '../tools/execute-sql-query';
import type { InferUITool, UIMessage } from 'ai';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
  createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type executeSqlQueryTool = InferUITool<typeof executeSqlQuery>;

export type ChatTools = {
  executeSqlQuery: executeSqlQueryTool;
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