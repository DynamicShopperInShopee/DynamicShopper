import { dev } from '$app/env';
import { OPENAI_API_KEY, OPENAI_MODEL } from '$app/env/private';
import { handleAssistant, MAX_BODY_BYTES } from '#lib/server/handlers/assistant.ts';
import { readText } from '#lib/server/live-assistant/read-json.ts';
import { error, headers, localJsonGuard, socketPeer } from '#lib/server/utils/local-json.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	const denied = localJsonGuard(request, url, dev, dev ? socketPeer(getClientAddress) : '');
	if (denied) return denied;
	let text: string | undefined;
	try {
		text = await readText(request.body, MAX_BODY_BYTES);
	} catch {
		return error(400, 'invalid-request');
	}
	if (text === undefined) return error(413, 'invalid-request');
	try {
		const result = await handleAssistant(text, {
			dev,
			apiKey: OPENAI_API_KEY,
			model: OPENAI_MODEL
		});
		return Response.json(result.body, { status: result.status, headers });
	} catch {
		return error(500, 'unavailable');
	}
};
