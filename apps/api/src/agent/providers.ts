import { customProvider } from 'ai';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export const config = {
	chat: {
		stepCount: 3,
		temperature: 0.1,
	},
	agent: {
		stepCount: 10,
		temperature: 0.2,
	},
	agent_max: {
		stepCount: 20,
		temperature: 0.1,
	},
} as const;


export const provider = customProvider({
  languageModels: {
    // "chat-model": hackclub("llama-3.3-70b-versatile"),
    // 'chat-model': openai.responses('gpt-4.1-mini'),
    'chat-model': openrouter.chat('google/gemini-2.5-flash-lite-preview-06-17'),
    'agent-model': openrouter.chat('openai/gpt-5'),
    // 'relevance-model': openai.responses('gpt-4.1-nano'),
    'agent-max-model': openrouter.chat('anthropic/claude-3-5-sonnet-20241022'),
  },
  imageModels: {
    // 'small-model': openai.imageModel('dall-e-2'),
  },
});