'use client';

import { motion } from 'framer-motion';

export const ThinkingMessage = () => {
	return <LoadingText>Thinking...</LoadingText>;
};

const LoadingText = ({ children }: { children: React.ReactNode }) => {
	return (
		<motion.div
			animate={{ backgroundPosition: ['100% 50%', '-100% 50%'] }}
			className="flex items-center text-transparent"
			style={{
				background:
					'linear-gradient(90deg, hsl(var(--muted-foreground)) 0%, hsl(var(--muted-foreground)) 35%, hsl(var(--foreground)) 50%, hsl(var(--muted-foreground)) 65%, hsl(var(--muted-foreground)) 100%)',
				backgroundSize: '200% 100%',
				WebkitBackgroundClip: 'text',
				backgroundClip: 'text',
			}}
			transition={{
				duration: 1.5,
				repeat: Number.POSITIVE_INFINITY,
				ease: 'linear',
			}}
		>
			{children}
		</motion.div>
	);
};
