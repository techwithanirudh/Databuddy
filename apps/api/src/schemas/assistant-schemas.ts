import { t } from 'elysia';

export const AssistantRequestSchema = t.Object(
	{
		conversationId: t.Required(t.String()),
		messages: t.Array(
			t.Object(
				{
					role: t.Union([t.Literal('user'), t.Literal('assistant')]),
					content: t.String(),
				},
				{ additionalProperties: false }
			),
			{ minItems: 1 }
		),
		websiteId: t.Required(t.String()),
		mode: t.Required(
			t.Union([t.Literal('chat'), t.Literal('agent'), t.Literal('agent-max')])
		),
	},
	{ additionalProperties: false }
);

export type AssistantRequestType = typeof AssistantRequestSchema.static;
