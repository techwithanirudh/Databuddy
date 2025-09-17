import { t } from 'elysia';

export const AssistantRequestSchema = t.Object(
	{
		id: t.Required(t.String()),
		message: t.Object({
			id: t.String(),
			role: t.Union([t.Literal('user'), t.Literal('assistant')]),
			parts: t.Array(
				t.Object({
					type: t.Literal('text'),
					text: t.String(),
				})
			),
		}),
		websiteId: t.Required(t.String()),
		mode: t.Required(
			t.Union([t.Literal('chat'), t.Literal('agent'), t.Literal('agent-max')])
		),
	},
	{ additionalProperties: false }
);

export type AssistantRequestType = typeof AssistantRequestSchema.static;
