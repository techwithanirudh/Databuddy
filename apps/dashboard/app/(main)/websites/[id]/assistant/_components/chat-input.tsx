import type { UseChatHelpers } from '@ai-sdk/react';
import type { ChatMessage } from '@databuddy/ai/types';
import { chatModels } from '@databuddy/ai/models';
import { CpuIcon } from '@phosphor-icons/react';
import type { ChatStatus, UIMessage } from 'ai';
import { memo, startTransition, useEffect, useState } from 'react';
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
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputToolbar,
	PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { SelectItem, SelectTrigger } from '@/components/ui/select';
import { saveChatModelAsCookie } from '../actions';
import { SuggestedActions } from './suggested-actions';

export function ChatInput({
	status,
	selectedModelId,
	onModelChange,
	messages,
	chatId,
	websiteId,
	sendMessage,
}: {
	messages: UIMessage[];
	chatId: string;
	sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
	status: ChatStatus;
	selectedModelId: string;
	onModelChange?: (modelId: string) => void;
	websiteId: string;
}) {
	const [input, setInput] = useState('');

	function handleSubmit(message: PromptInputMessage) {
		window.history.replaceState(
			{},
			'',
			`/websites/${websiteId}/assistant/${chatId}`
		);

		const hasText = Boolean(message.text);
		const hasAttachments = Boolean(message.files?.length);

		if (!(hasText || hasAttachments)) {
			return;
		}

		sendMessage({
			text: message.text || 'Sent with attachments',
			files: message.files,
		});
		setInput('');
	}

	return (
		<div className="space-y-4">
			{messages.length === 0 && (
				<SuggestedActions
					chatId={chatId}
					sendMessage={sendMessage}
					websiteId={websiteId}
				/>
			)}

			{/* <div className="border-t border-border -mx-6 mt-6" /> */}

			<PromptInput
				className="h-min"
				globalDrop
				multiple
				onSubmit={handleSubmit}
			>
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
						<ModelSelectorCompact
							onModelChange={onModelChange}
							selectedModelId={selectedModelId}
						/>
					</PromptInputTools>
					<PromptInputSubmit disabled={!(input || status)} status={status} />
				</PromptInputToolbar>
			</PromptInput>
		</div>
	);
}

function PureModelSelectorCompact({
	selectedModelId,
	onModelChange,
}: {
	selectedModelId: string;
	onModelChange?: (modelId: string) => void;
}) {
	const [optimisticModelId, setOptimisticModelId] = useState(selectedModelId);

	useEffect(() => {
		setOptimisticModelId(selectedModelId);
	}, [selectedModelId]);

	const selectedModel = chatModels.find(
		(model) => model.id === optimisticModelId
	);

	return (
		<PromptInputModelSelect
			onValueChange={(modelName) => {
				const model = chatModels.find((m) => m.name === modelName);
				if (model) {
					setOptimisticModelId(model.id);
					onModelChange?.(model.id);
					startTransition(() => {
						saveChatModelAsCookie(model.id);
					});
				}
			}}
			value={selectedModel?.name}
		>
			<SelectTrigger
				className="flex h-8 items-center gap-2 rounded-lg border-0 bg-background px-2 text-foreground shadow-none transition-colors hover:bg-accent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
				type="button"
			>
				<CpuIcon size={16} />
				<span className="hidden font-medium text-xs sm:block">
					{selectedModel?.name}
				</span>
			</SelectTrigger>
			<PromptInputModelSelectContent className="min-w-[260px] p-0">
				<div className="flex flex-col gap-px">
					{chatModels.map((model) => (
						<SelectItem
							className="px-3 py-2 text-xs"
							key={model.id}
							value={model.name}
						>
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="truncate font-medium text-xs">{model.name}</div>
								<div className="truncate text-[10px] text-muted-foreground leading-tight">
									{model.description}
								</div>
							</div>
						</SelectItem>
					))}
				</div>
			</PromptInputModelSelectContent>
		</PromptInputModelSelect>
	);
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);
