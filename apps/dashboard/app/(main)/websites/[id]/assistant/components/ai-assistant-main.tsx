'use client';

import { useAtom } from 'jotai';
import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';
import {
	currentMessageAtom,
	messagesAtom,
} from '@/stores/jotai/assistantAtoms';
import type { Message } from '../types/message';
import ChatSection, { ChatSkeleton } from './chat-section';
import VisualizationSection, {
	VisualizationSkeleton,
} from './visualization-section';

export default function AIAssistantMain() {
	const [messages] = useAtom(messagesAtom);
	const [, setCurrentMessage] = useAtom(currentMessageAtom);

	const latestVisualizationMessage = messages
		.slice()
		.reverse()
		.find(
			(m) =>
				m.data &&
				m.chartType &&
				m.type === 'assistant' &&
				m.responseType === 'chart'
		);

	let currentQueryMessage: Message | undefined;
	if (latestVisualizationMessage) {
		const vizMessageIndex = messages.findIndex(
			(m) => m.id === latestVisualizationMessage.id
		);
		if (vizMessageIndex > -1) {
			for (let i = vizMessageIndex - 1; i >= 0; i--) {
				if (messages[i].type === 'user') {
					currentQueryMessage = messages[i];
					break;
				}
			}
		}
	}

	// Update current message atom
	React.useEffect(() => {
		setCurrentMessage(currentQueryMessage);
	}, [currentQueryMessage, setCurrentMessage]);

	const shouldShowVisualization = !!(
		latestVisualizationMessage?.data &&
		latestVisualizationMessage?.chartType &&
		latestVisualizationMessage?.responseType === 'chart' &&
		Array.isArray(latestVisualizationMessage.data) &&
		latestVisualizationMessage.data.length > 0 &&
		!latestVisualizationMessage.content?.includes("couldn't find any data") &&
		!latestVisualizationMessage.content?.includes(
			'Something unexpected happened'
		)
	);

	return (
		<div className="h-full">
			<div className="flex h-full flex-col overflow-hidden lg:flex-row">
				<div
					className={cn(
						'flex min-h-0 flex-col overflow-hidden bg-background',
						shouldShowVisualization ? 'flex-1 lg:flex-[3]' : 'flex-1'
					)}
				>
					<Suspense fallback={<ChatSkeleton />}>
						<ChatSection />
					</Suspense>
				</div>
				{shouldShowVisualization && (
					<div className="flex min-h-0 flex-1 flex-col overflow-hidden border-sidebar-border border-l bg-background lg:flex-[2]">
						<Suspense fallback={<VisualizationSkeleton />}>
							<VisualizationSection />
						</Suspense>
					</div>
				)}
			</div>
		</div>
	);
}
