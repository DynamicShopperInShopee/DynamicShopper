import { socketPeer } from '#lib/server/utils/local-json.ts';
import { dev } from '$app/env';
import { OPENAI_API_KEY, OPENAI_LOG_USAGE, OPENAI_MODEL } from '$app/env/private';
import { handleLocalAssistant } from '#lib/server/live-assistant/handler.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = ({ request, url, getClientAddress }) => {
	return handleLocalAssistant(request, url, {
		enabled: dev,
		peer: dev ? socketPeer(getClientAddress) : '',
		apiKey: OPENAI_API_KEY,
		model: OPENAI_MODEL,
		onUsage:
			dev && OPENAI_LOG_USAGE === '1'
				? (usage) => console.info('Local OpenAI usage', JSON.stringify(usage))
				: undefined
	});
};
