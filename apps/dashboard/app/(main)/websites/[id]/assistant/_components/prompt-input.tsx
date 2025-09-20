import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	type PromptInputMessage,
	PromptInputModelSelect,
	PromptInputModelSelectContent,
	PromptInputModelSelectItem,
	PromptInputModelSelectTrigger,
	PromptInputModelSelectValue,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import type { ChatStatus, UIMessage } from 'ai';
import { SuggestedActions } from './suggested-actions';
import type { UseChatHelpers } from '@ai-sdk/react';
import { ChatMessage } from '@databuddy/ai/lib/types';

export function MultimodalInput({
	handleSubmit,
	models,
	status,
	input,
	setInput,
	model,
	setModel,
	messages,
	chatId,
	websiteId,
	sendMessage,
}: {
	handleSubmit: (message: PromptInputMessage) => void;
	messages: Array<UIMessage>;
	chatId: string;
	sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
	models: { name: string; value: string }[];
	status: ChatStatus;
	input: string;
	setInput: (input: string) => void;
	model: string;
	setModel: (model: string) => void;
	websiteId: string;
}) {
	return (
		<>
			{
				messages.length === 0 && (
					<SuggestedActions
						sendMessage={sendMessage}
						chatId={chatId}
						websiteId={websiteId}
					/>
				)
			}

			<PromptInput onSubmit={handleSubmit} className="mt-4 border-t border-border h-min" globalDrop multiple>
				<PromptInputBody>
					<PromptInputAttachments>
						{(attachment) => <PromptInputAttachment data={attachment} />}
					</PromptInputAttachments>
					<PromptInputTextarea
						onChange={(e) => setInput(e.target.value)}
						value={input}
					/>
				</PromptInputBody>
				<PromptInputToolbar>
					<PromptInputTools>
						<PromptInputActionMenu>
							<PromptInputActionMenuTrigger />
							<PromptInputActionMenuContent>
								<PromptInputActionAddAttachments />
							</PromptInputActionMenuContent>
						</PromptInputActionMenu>
						<PromptInputModelSelect
							onValueChange={(value) => {
								setModel(value);
							}}
							value={model}
						>
							<PromptInputModelSelectTrigger>
								<PromptInputModelSelectValue />
							</PromptInputModelSelectTrigger>
							<PromptInputModelSelectContent>
								{models.map((model) => (
									<PromptInputModelSelectItem
										key={model.value}
										value={model.value}
									>
										{model.name}
									</PromptInputModelSelectItem>
								))}
							</PromptInputModelSelectContent>
						</PromptInputModelSelect>
					</PromptInputTools>
					<PromptInputSubmit disabled={!input && !status} status={status} />
				</PromptInputToolbar>
			</PromptInput>
		</>
	);
}
