import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { CatalogStore } from './store.ts';
import { CatalogUnavailableError } from './store.ts';
import { CatalogInputError, validListingId } from './validate.ts';

function json(value: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
	return Response.json(value, {
		status,
		headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...extraHeaders }
	});
}

/** A Fetch handler shared by the standalone server and SvelteKit endpoints. */
export async function handleCatalogRequest(
	request: Request,
	store: CatalogStore,
	imagesDirectory = resolve('data/shopee/images')
): Promise<Response> {
	if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { allow: 'GET' });
	try {
		const url = new URL(request.url);
		const path = url.pathname.replace(/\/$/, '');
		if (path === '/api/catalog') return json(store.list(url.searchParams));
		if (path === '/api/catalog/snapshot') {
			if (url.search) throw new CatalogInputError('Snapshot does not accept query parameters');
			return json(store.snapshot());
		}
		const imageMatch = path.match(/^\/api\/catalog\/images\/([^/]+)$/);
		if (imageMatch) {
			const id = imageMatch[1];
			if (!validListingId(id)) throw new CatalogInputError('Invalid listing id');
			if (!store.get(id)) return json({ error: 'not_found' }, 404);
			try {
				const bytes = await readFile(resolve(imagesDirectory, `${id}.jpg`));
				// Importers may save original PNG/WebP bytes with a stable cache filename.
				const type =
					bytes[0] === 0xff && bytes[1] === 0xd8
						? 'image/jpeg'
						: bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
							? 'image/png'
							: bytes.subarray(0, 4).toString() === 'RIFF' &&
								  bytes.subarray(8, 12).toString() === 'WEBP'
								? 'image/webp'
								: null;
				if (!type) return json({ error: 'image_unavailable' }, 404);
				return new Response(bytes, {
					headers: {
						'content-type': type,
						'cache-control': 'public, max-age=86400',
						'x-content-type-options': 'nosniff'
					}
				});
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === 'ENOENT')
					return json({ error: 'image_unavailable' }, 404);
				throw error;
			}
		}
		const detail = path.match(/^\/api\/catalog\/([^/]+)$/);
		if (detail) {
			if (!validListingId(detail[1])) throw new CatalogInputError('Invalid listing id');
			const item = store.get(detail[1]);
			return item ? json(item) : json({ error: 'not_found' }, 404);
		}
		return json({ error: 'not_found' }, 404);
	} catch (error) {
		if (error instanceof CatalogInputError)
			return json({ error: 'invalid_request', message: error.message }, 400);
		if (error instanceof CatalogUnavailableError)
			return json({ error: 'catalog_unavailable' }, 503);
		throw error;
	}
}
