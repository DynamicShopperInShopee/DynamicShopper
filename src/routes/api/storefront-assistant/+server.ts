import { createDatabase } from '#lib/server/db/index.ts';
import { reserveDemoCall } from '#lib/server/db/demo-assistant.ts';
import { handlePublicAssistant } from '#lib/server/live-assistant/handler.ts';
import { error } from '#lib/server/utils/local-json.ts';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url, platform }) => {
	const bindings =
		platform?.env ??
		(import.meta.env.D1_WORKER
			? ((await import('cloudflare:workers')).env as App.Platform['env'])
			: undefined);
	if (!bindings?.DB || !bindings.OPENAI_API_KEY) return error(503, 'unavailable');
	const database = bindings.DB;
	return handlePublicAssistant(request, url, {
		apiKey: bindings.OPENAI_API_KEY,
		reserve: async () => reserveDemoCall(await createDatabase(database, undefined))
	});
};
