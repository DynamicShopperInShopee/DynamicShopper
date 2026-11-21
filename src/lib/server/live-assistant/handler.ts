import { parseLiveHints } from '../../personalization/live';
import { requestLivePatch } from './openai';
import { readJson } from './read-json';

import { localJsonGuard, headers, error } from '../utils/local-json';

export async function handleLocalAssistant(
	request: Request,
	url: URL,
	options: { enabled: boolean; peer: string; apiKey?: string; model?: string },
	provider: typeof fetch = fetch
) {
	const denied = localJsonGuard(request, url, options.enabled, options.peer);
	if (denied) return denied;

	let body: unknown;
	try {
		body = await readJson(request.body, 1024);
	} catch {
		return error(400, 'invalid-request');
	}
	if (body === undefined) return error(413, 'invalid-request');
	if (!body || typeof body !== 'object' || Object.keys(body).length !== 1 || !('hints' in body)) {
		return error(400, 'invalid-request');
	}
	const hints = parseLiveHints(body.hints);
	if (!hints?.length) return error(400, 'invalid-request');

	const apiKey = options.apiKey?.trim();
	if (!apiKey) return error(503, 'unavailable');
	const result = await requestLivePatch(
		hints,
		{ apiKey, model: options.model, signal: request.signal },
		provider
	);
	return result ? Response.json(result, { headers }) : error(502, 'unavailable');
}
