const loopback = ['localhost', '127.0.0.1', '[::1]'];
const loopbackPeers = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
export const headers = { 'cache-control': 'no-store' };

export function error(status: number, reason: string) {
	return Response.json({ error: reason }, { status, headers });
}

export function localJsonGuard(request: Request, url: URL, dev: boolean, peer: string) {
	if (!dev || !loopback.includes(url.hostname) || !loopbackPeers.includes(peer))
		return error(404, 'unavailable');
	if (request.headers.get('origin') !== url.origin) return error(403, 'invalid-request');
	if (
		request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
	) {
		return error(415, 'invalid-request');
	}
	return null;
}

export function socketPeer(getClientAddress: () => string) {
	try {
		return getClientAddress();
	} catch {
		return '';
	}
}
