import {
	PromptInput,
	PromptInputActionAddAttachments,
	PromptInputActionMenu,
	PromptInputActionMenuContent,
	PromptInputActionMenuTrigger,
	PromptInputAttachment,
	PromptInputAttachments,
	PromptInputBody,
	PromptInputButton,
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
import type { ChatStatus } from 'ai';

export function MultimodalInput({
	handleSubmit,
	models,
	status,
	input,
	setInput,
	model,
	setModel,
}: {
	handleSubmit: (message: PromptInputMessage) => void;
	models: { name: string; value: string }[];
	status: ChatStatus;
	input: string;
	setInput: (input: string) => void;
	model: string;
	setModel: (model: string) => void;
}) {
	return (
		<PromptInput onSubmit={handleSubmit} className="mt-4" globalDrop multiple>
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
	);
}
