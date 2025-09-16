export const modes = ['chat', 'agent', 'agent-max'] as const;
export type Mode = (typeof modes)[number];
