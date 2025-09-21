import { useArtifacts } from '@ai-sdk-tools/artifacts/client';
import { BurnRateCanvas } from './burn-rate-canvas';

export function Canvas({ websiteId }: { websiteId: string }) {
	const { current } = useArtifacts();

	switch (current?.type) {
		case 'burn-rate':
			return <BurnRateCanvas websiteId={websiteId} />;
		default:
			return null;
	}
}
