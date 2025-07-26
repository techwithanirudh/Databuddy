import { Node } from '@logtail/js';

const logger = new Node(process.env.LOGTAIL_SOURCE_TOKEN as string, {
	endpoint: 'https://s1447431.eu-nbg-2.betterstackdata.com',
});

export { logger };
