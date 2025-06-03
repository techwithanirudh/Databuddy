import type { Message } from "../types/message";
import { AI_RESPONSES, CHART_TYPES, ERROR_MESSAGES, EXAMPLE_PROMPTS } from "./constants";

export interface AIServiceResponse {
  content: string;
  hasVisualization?: boolean;
  chartType?: 'bar' | 'line' | 'pie';
}

export class AIService {
  private static instance: AIService;
  private apiEndpoint = '/api/ai-assistant';

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async sendMessage(
    message: string, 
    websiteId: string,
    context?: {
      previousMessages?: Message[];
      dateRange?: any;
    }
  ): Promise<AIServiceResponse> {
    try {
      // For now, simulate API call with placeholder response
      // In production, this would make actual API calls
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const responseTemplate = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
      const chartTypes = CHART_TYPES.map(type => type.id);
      
      return {
        content: responseTemplate.content.replace('{query}', message),
        hasVisualization: Math.random() < responseTemplate.hasVisualizationChance,
        chartType: chartTypes[Math.floor(Math.random() * chartTypes.length)] as 'bar' | 'line' | 'pie'
      };
      
      // Production implementation would look like:
      // const response = await fetch(this.apiEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message,
      //     websiteId,
      //     context
      //   })
      // });
      // return await response.json();
      
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        content: ERROR_MESSAGES.GENERIC_ERROR,
        hasVisualization: false
      };
    }
  }

  generateWelcomeMessage(websiteName?: string): string {
    const examples = EXAMPLE_PROMPTS.slice(0, 6);
    return `Hello! I'm your analytics AI assistant for ${websiteName || 'your website'}. I can help you understand your data, generate insights, and create visualizations. Try asking me questions like:

${examples.map(prompt => `• "${prompt}"`).join('\n')}`;
  }
} 