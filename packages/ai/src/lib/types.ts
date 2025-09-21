import type { InferUITool, UIMessage } from 'ai';
import { z } from 'zod';
import type { executeSQLQueryTool } from '../tools/execute-sql-query';

export type DataPart = { type: 'append-message'; message: string };

export const messageMetadataSchema = z.object({
	createdAt: z.string(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

type executeSQLQuery = InferUITool<typeof executeSQLQueryTool>;

export type ChatTools = {
	executeSQLQuery: executeSQLQuery;
};

export type ChatMessage = UIMessage<MessageMetadata, ChatTools>;

export interface Attachment {
	name: string;
	url: string;
	contentType: string;
}
