import { error, json } from '@sveltejs/kit';
import { dev } from '$app/env';
import { ASSISTANT_LOCAL, OPENAI_API_KEY, OPENAI_MODEL } from '$app/env/private';
import { handleAssistant } from '#lib/server/handlers/assistant.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// Public builds never expose the model endpoint, whatever the request asks for.
	if (!dev && ASSISTANT_LOCAL !== '1') error(404, 'Not found');
	try {
		const result = await handleAssistant(await request.text(), {
			enabled: true,
			dev,
			apiKey: OPENAI_API_KEY,
			model: OPENAI_MODEL
		});
		return json(result.body, { status: result.status });
	} catch {
		error(500, 'Assistant unavailable');
	}
};
