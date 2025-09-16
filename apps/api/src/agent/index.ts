import { type ModelMessage, smoothStream, stepCountIs, streamText } from 'ai';
import { systemPrompt } from '@databuddy/ai/prompts';
import { tools } from '@databuddy/ai/tools';

import { config, provider } from '@databuddy/ai/providers';
import type { Mode } from '@databuddy/ai/lib/utils';

interface HandleMessageProps {
	messages: ModelMessage[];
	mode: Mode;
	websiteId: string;
	websiteHostname: string;
}

export async function handleMessage({
	messages,
	mode,
	websiteId,
	websiteHostname
}: HandleMessageProps) {
	const selectedChatModel = `${mode}-model`;
    const system = systemPrompt({
      selectedChatModel,
      requestHints: {
        websiteId,
        websiteHostname,
        timestamp: new Date().toISOString(),
      },
    });

	const modeConfig = config[mode];
	const response = streamText({
		model: provider.languageModel(selectedChatModel),
		system,
		tools,
		stopWhen: stepCountIs(modeConfig.stepCount),
		messages,
		temperature: modeConfig.temperature,
		experimental_transform: smoothStream({ chunking: 'word' }),
	});

	return response.toUIMessageStreamResponse();
}
