import { describe, expect, it } from 'vitest';
import { localJsonGuard, sameOriginJsonGuard } from './local-json';

const url = new URL('https://shop.example/api/interview');

function request(origin = url.origin, contentType = 'application/json') {
	return new Request(url, {
		method: 'POST',
		headers: { origin, 'content-type': contentType },
		body: '{}'
	});
}

describe('same-origin JSON guard', () => {
	it('allows production-hosted same-origin JSON requests', () => {
		expect(sameOriginJsonGuard(request(), url)).toBeNull();
	});

	it('rejects cross-origin and non-JSON requests', () => {
		const crossOrigin = sameOriginJsonGuard(request('https://attacker.example'), url);
		const nonJson = sameOriginJsonGuard(request(url.origin, 'text/plain'), url);
		expect(crossOrigin?.status).toBe(403);
		expect(nonJson?.status).toBe(415);
	});

	it('keeps local-only assistant routes restricted to development loopback', () => {
		expect(localJsonGuard(request(), url, false, '')?.status).toBe(404);
		expect(localJsonGuard(request(), url, true, '192.0.2.1')?.status).toBe(404);
	});
});
