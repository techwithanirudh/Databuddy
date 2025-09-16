import { type ModelMessage, smoothStream, stepCountIs, streamText } from 'ai';
import { systemPrompt } from './prompts';
import { tools } from './tools';

import { config, provider } from './providers';

export const modes = ['chat', 'agent', 'agent_max'] as const;
export type Mode = (typeof modes)[number];

export async function handleMessage(
	messages: ModelMessage[],
	mode: Mode,
	websiteId: string,
	websiteHostname: string
) {
    const system = systemPrompt({
      selectedChatModel: 'chat-model',
      requestHints: {
        websiteId,
        websiteHostname,
        timestamp: new Date().toISOString(),
      },
    });
	const modeConfig = config[mode];

	const response = streamText({
		model: provider.languageModel(`${mode}-model`),
		system,
		tools,
		stopWhen: stepCountIs(modeConfig.stepCount),
		messages,
		temperature: modeConfig.temperature,
		experimental_transform: smoothStream({ chunking: 'word' }),
	});

	return response.toUIMessageStreamResponse();
}
