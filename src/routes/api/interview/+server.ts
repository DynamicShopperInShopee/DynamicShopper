import { dev } from '$app/env';
import { OPENAI_API_KEY, OPENAI_MODEL } from '$app/env/private';
import { handleInterview } from '#lib/server/handlers/interview.ts';
import { error, headers, localJsonGuard, socketPeer } from '#lib/server/utils/local-json.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const denied = localJsonGuard(request, url, dev, dev ? socketPeer(getClientAddress) : '');
	if (denied) return denied;
	try {
		const response = await handleInterview(request, { apiKey: OPENAI_API_KEY, model: OPENAI_MODEL });
		return new Response(response.body, { status: response.status, headers });
	} catch { return error(500, 'unavailable'); }
};
