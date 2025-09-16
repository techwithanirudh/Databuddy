export const modes = ['chat', 'agent', 'agent_max'] as const;
export type Mode = (typeof modes)[number];

export const normalizeMode = (value?: string): Mode => {
  if (value === 'chat') return 'chat';
  if (value === 'agent' || value == null) return 'agent';
  if (value === 'agent-max') return 'agent_max';
  return 'chat';
};

