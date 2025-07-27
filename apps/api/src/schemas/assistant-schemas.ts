import { t } from 'elysia';

export const AssistantRequestSchema = t.Object({
	message: t.String(),
	website_id: t.String(),
	model: t.Optional(
		t.Union([t.Literal('chat'), t.Literal('agent'), t.Literal('agent-max')])
	),
	context: t.Optional(
		t.Object({
			previousMessages: t.Optional(
				t.Array(
					t.Object({
						role: t.Optional(t.String()),
						content: t.String(),
					})
				)
			),
		})
	),
});

export type AssistantRequestType = {
	message: string;
	website_id: string;
	model?: 'chat' | 'agent' | 'agent-max';
	context?: {
		previousMessages?: Array<{
			role?: string;
			content: string;
		}>;
	};
};
