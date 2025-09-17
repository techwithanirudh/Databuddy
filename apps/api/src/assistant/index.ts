import {
	convertToModelMessages,
	createUIMessageStream,
	createUIMessageStreamResponse,
	smoothStream,
	stepCountIs,
	streamText,
} from 'ai';
import { systemPrompt } from '@databuddy/ai/prompts';

import { config, provider } from '@databuddy/ai/providers';
import { getChatById, saveChat, getMessagesByChatId, saveMessages } from './db';
import type { ChatMessage } from '@databuddy/ai/lib/types';
import { generateTitleFromUserMessage } from './utils';
import type { RequestHints } from '../types/agent';
import type { User } from '@databuddy/auth';
import type { AssistantRequestType } from '../schemas/assistant-schemas';
import { convertToUIMessages, generateUUID } from '@databuddy/ai/lib/utils';
import { setContext } from '@databuddy/ai/context';
import { tools } from '@databuddy/ai/tools';

interface HandleMessageProps {
	id: string;
	message: ChatMessage;
	selectedChatModel: AssistantRequestType['selectedChatModel'];
	requestHints: RequestHints;
	user: User;
}

export async function handleMessage({
	id,
	message,
	selectedChatModel,
	requestHints,
	user,
}: HandleMessageProps) {
	const chat = await getChatById({ id });

	if (!chat) {
		const title = await generateTitleFromUserMessage({
			message,
		});

		await saveChat({
			id,
			userId: user.id,
			title,
		});
	} else {
		if (chat.userId !== user.id) {
			return new Error('forbidden:chat');
		}
	}

	const messagesFromDb = await getMessagesByChatId({ id });
	const uiMessages = [...convertToUIMessages(messagesFromDb), message];

	await saveMessages({
		messages: [
			{
				chatId: id,
				id: message.id,
				role: 'user',
				parts: message.parts,
				attachments: [],
				createdAt: new Date(),
			},
		],
	});

	const system = systemPrompt({
		selectedChatModel,
		requestHints,
	});

	const modeConfig = config[selectedChatModel];


	const stream = createUIMessageStream({
		execute: ({ writer }) => {
			setContext({
				writer,
				userId: user.id,
				fullName: user.name,
			});

			const result = streamText({
				model: provider.languageModel(selectedChatModel),
				system,
				// activeTools: selectedChatModel === 'chat-model' ? ['analyzeBurnRate', 'e'] : [],
				tools: tools,
				stopWhen: stepCountIs(modeConfig.stepCount),
				messages: convertToModelMessages(uiMessages),
				temperature: modeConfig.temperature,
				experimental_transform: smoothStream({ chunking: 'word' }),
			});

			writer.merge(result.toUIMessageStream());
		},
		onFinish: async ({ messages }) => {
			await saveMessages({
				messages: messages.map((message) => ({
					id: message.id,
					role: message.role,
					parts: message.parts,
					createdAt: new Date(),
					attachments: [],
					chatId: id,
				})),
			});
		},
		onError: () => {
			return 'Oops, an error occurred!';
		},
		generateId: generateUUID,
	});

	return createUIMessageStreamResponse({ stream });

}
