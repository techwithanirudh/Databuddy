import type { RequestHints } from '../../types/agent';
import { corePrompt } from './core';
import { chatPrompt } from './chat-prompt';

export const getRequestPromptFromHints = (requestHints: RequestHints) => `\
<context>
    <website_id>${requestHints.websiteId}</website_id>
    <website_hostname>${requestHints.websiteHostname}</website_hostname>
    <timestamp>${requestHints.timestamp}</timestamp>
</context>`;

export const systemPrompt = ({
  selectedChatModel,
  requestHints,
}: {
  selectedChatModel: string;
  requestHints: RequestHints;
}) => {
  const { websiteHostname, websiteId } = requestHints;
  const requestPrompt = getRequestPromptFromHints(requestHints);

  if (selectedChatModel === 'chat-model') {
    return [
      corePrompt(websiteHostname, websiteId),
      requestPrompt,
      chatPrompt(websiteId, websiteHostname),
    ]
      .filter(Boolean)
      .join('\n')
      .trim();
  } else if (selectedChatModel === 'relevance-model') {
    return [
      corePrompt(websiteHostname, websiteId),
      requestPrompt,
      chatPrompt(websiteId, websiteHostname),
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
  }
};