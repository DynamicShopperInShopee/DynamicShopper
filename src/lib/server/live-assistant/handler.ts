import { parseLiveHints } from '../../personalization/live';
import { requestLivePatch } from './openai';
import { readJson } from './read-json';

const loopback = ['localhost', '127.0.0.1', '[::1]'];
const loopbackPeers = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
const headers = { 'cache-control': 'no-store' };

function error(status: number, reason: string) {
	return Response.json({ error: reason }, { status, headers });
}

export async function handleLocalAssistant(
	request: Request,
	url: URL,
	options: { enabled: boolean; peer: string; apiKey?: string; model?: string },
	provider: typeof fetch = fetch
) {
	if (!options.enabled || !loopback.includes(url.hostname) || !loopbackPeers.includes(options.peer))
		return error(404, 'unavailable');
	if (request.headers.get('origin') !== url.origin) return error(403, 'invalid-request');
	if (
		request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
	) {
		return error(415, 'invalid-request');
	}

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
