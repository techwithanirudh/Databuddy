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
import { memo, useEffect, useState } from 'react';
import { CpuIcon, ChevronDownIcon } from 'lucide-react';
import { SelectItem } from '@/components/ui/select';
import { chatModels } from '@databuddy/ai/models';
import * as SelectPrimitive from '@radix-ui/react-select';

export function ChatInput({
	status,
	selectedModelId,
	onModelChange,
	messages,
	chatId,
	websiteId,
	sendMessage,
}: {
	messages: Array<UIMessage>;
	chatId: string;
	sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
	status: ChatStatus;
	selectedModelId: string;
	onModelChange?: (modelId: string) => void;
	websiteId: string;
}) {
	const [input, setInput] = useState('');

	function handleSubmit(message: PromptInputMessage) {
		window.history.replaceState({}, '', `/websites/${websiteId}/assistant/${chatId}`);

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
						<ModelSelectorCompact selectedModelId={selectedModelId} onModelChange={onModelChange} />
					</PromptInputTools>
					<PromptInputSubmit disabled={!input && !status} status={status} />
				</PromptInputToolbar>
			</PromptInput>
		</>
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
		(model) => model.id === optimisticModelId,
	);

	return (
		<PromptInputModelSelect
			value={selectedModel?.name}
			onValueChange={(modelName) => {
				const model = chatModels.find((m) => m.name === modelName);
				if (model) {
					setOptimisticModelId(model.id);
					onModelChange?.(model.id);
					// startTransition(() => {
					// 	saveChatModelAsCookie(model.id);
					// });
				}
			}}
		>
			<SelectPrimitive.Trigger
				type="button"
				className="flex gap-2 items-center px-2 h-8 rounded-lg border-0 shadow-none transition-colors bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
			>
				<CpuIcon size={16} />
				<span className="hidden text-xs font-medium sm:block">
					{selectedModel?.name}
				</span>
				<ChevronDownIcon size={16} />
			</SelectPrimitive.Trigger>
			<PromptInputModelSelectContent className="min-w-[260px] p-0">
				<div className="flex flex-col gap-px">
					{chatModels.map((model) => (
						<SelectItem
							key={model.id}
							value={model.name}
							className="px-3 py-2 text-xs"
						>
							<div className="flex flex-col flex-1 gap-1 min-w-0">
								<div className="text-xs font-medium truncate">{model.name}</div>
								<div className="text-[10px] text-muted-foreground truncate leading-tight">
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
