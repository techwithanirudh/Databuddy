export const QUICK_INSIGHTS = [
  { label: "Show traffic trends", prompt: "Show me my traffic trends for the last 7 days" },
  { label: "Top pages analysis", prompt: "What are my top performing pages?" },
  { label: "Bounce rate insights", prompt: "How is my bounce rate compared to last month?" },
  { label: "User demographics", prompt: "Create a chart of my visitor demographics" },
  { label: "Performance metrics", prompt: "What insights can you provide about my website performance?" },
  { label: "Conversion analysis", prompt: "How can I improve my website's conversion rate?" },
];

export const CHART_TYPES = [
  { id: 'bar', label: 'Bar', icon: 'BarChart3' },
  { id: 'line', label: 'Line', icon: 'LineChart' },
  { id: 'pie', label: 'Pie', icon: 'PieChart' },
] as const;

export const EXAMPLE_PROMPTS = [
  "Show me my traffic trends for the last 7 days",
  "What are my top performing pages?",
  "How is my bounce rate compared to last month?",
  "Create a chart of my visitor demographics",
  "What insights can you provide about my user behavior?",
  "How can I improve my website's performance?",
  "Which pages have the highest exit rates?",
  "What's my average session duration?",
  "Show me traffic by device type",
  "Compare this month's performance to last month",
];

export const AI_RESPONSES = [
  {
    content: "Based on your question about '{query}', I can see from your analytics data that there are some interesting patterns. This is a placeholder response that would be replaced with actual AI-generated insights.",
    hasVisualizationChance: 0.6,
  },
  {
    content: "Great question! Looking at '{query}' in the context of your website data, I notice several trends worth exploring. In a full implementation, I would analyze your specific metrics and provide actionable insights.",
    hasVisualizationChance: 0.4,
  },
  {
    content: "Your inquiry about '{query}' touches on some key performance indicators. I would typically examine your traffic patterns, user behavior, and conversion metrics to provide detailed analysis and recommendations.",
    hasVisualizationChance: 0.5,
  },
  {
    content: "Excellent question about '{query}'! From what I can see in your analytics data, there are several key insights I can share. Let me break down the most important findings for you.",
    hasVisualizationChance: 0.7,
  },
  {
    content: "I've analyzed your data regarding '{query}' and found some compelling trends. Here's what stands out and what it means for your website's performance.",
    hasVisualizationChance: 0.8,
  },
];

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "I'm having trouble connecting to the analytics service. Please check your connection and try again.",
  TIMEOUT_ERROR: "The request is taking longer than expected. Please try again in a moment.",
  GENERIC_ERROR: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
  RATE_LIMIT_ERROR: "You've sent too many messages too quickly. Please wait a moment before sending another message.",
} as const; 