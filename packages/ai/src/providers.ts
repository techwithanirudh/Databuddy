import { customProvider } from 'ai';

// import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';

// const openrouter = createOpenRouter({
//   apiKey: process.env.AI_API_KEY!,
// });
const openai = createOpenAI({
  apiKey: process.env.AI_API_KEY!,
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
	'agent-max': {
		stepCount: 20,
		temperature: 0.1,
	},
} as const;


export const provider = customProvider({
  languageModels: {
    'chat-model': openai.responses('gpt-4o-mini'),
    // 'chat-model': openrouter.chat('google/gemini-2.5-flash-lite-preview-06-17'),
    'agent-model': openai.responses('gpt-4o'),
    // 'agent-model': openrouter.chat('openai/gpt-5'),
    'agent-max-model': openai.responses('gpt-5'),
    // 'agent-max-model': openrouter.chat('anthropic/claude-3-5-sonnet-20241022'),
  },
  imageModels: {
    // 'small-model': openai.imageModel('dall-e-2'),
  },
});