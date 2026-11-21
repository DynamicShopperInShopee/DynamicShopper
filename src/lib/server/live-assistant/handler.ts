import { parseLiveHints } from '../../personalization/live';
import { requestLivePatch, type LiveUsage, type ProviderFailure } from './openai';
import { readJson } from './read-json';

import { localJsonGuard, sameOriginJsonGuard, headers, error } from '../utils/local-json';

const maxRequestBytes = 1024;

interface ProviderOptions {
	apiKey?: string;
	model?: string;
	onUsage?: (usage: LiveUsage) => void;
}

export async function handleLocalAssistant(
	request: Request,
	url: URL,
	options: ProviderOptions & { enabled: boolean; peer: string },
	provider: typeof fetch = fetch
) {
	const denied = localJsonGuard(request, url, options.enabled, options.peer);
	return denied ?? respondToHints(request, options, provider);
}

export async function handlePublicAssistant(
	request: Request,
	url: URL,
	options: ProviderOptions & { reserve: () => Promise<boolean> },
	provider: typeof fetch = fetch
) {
	const denied = sameOriginJsonGuard(request, url);
	return denied ?? respondToHints(request, options, provider, options.reserve);
}

async function respondToHints(
	request: Request,
	options: ProviderOptions,
	provider: typeof fetch,
	reserve?: () => Promise<boolean>
) {
	// Reject oversized declared bodies before cancelling a streamed read can reset the HTTP socket.
	const contentLength = request.headers.get('content-length');
	if (contentLength !== null && Number(contentLength) > maxRequestBytes)
		return error(413, 'invalid-request');

	let body: unknown;
	try {
		body = await readJson(request.body, maxRequestBytes);
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
	if (reserve) {
		try {
			if (!(await reserve())) return error(429, 'unavailable');
		} catch {
			return error(503, 'unavailable');
		}
	}
	let failure: ProviderFailure = 'runtime';
	const result = await requestLivePatch(
		hints,
		{
			apiKey,
			model: options.model,
			signal: request.signal,
			onUsage: options.onUsage,
			onFailure: (reason) => {
				failure = reason;
			}
		},
		provider
	);
	if (result) return Response.json(result, { headers });
	const fallback = error(502, 'unavailable');
	if (reserve) fallback.headers.set('x-assistant-failure', failure);
	return fallback;
}
