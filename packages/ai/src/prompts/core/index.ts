import { directivesPrompt } from './directives';
import { personaPrompt } from './persona';
import { schemaPrompt } from './schema';

export const corePrompt = (websiteHostname: string, websiteId: string) => (
    [
        personaPrompt(websiteHostname),
        directivesPrompt(websiteId, websiteHostname),
        schemaPrompt,
    ]
    .filter(Boolean)
    .join('\n\n')
    .trim()
);
