import { parseCatalogQuery } from '../../src/lib/server/catalog/query.ts';
import { CatalogInputError, validListingId } from '../../src/lib/server/catalog/validate.ts';
import type {
	CatalogCategory,
	CatalogSnapshotInfo,
	ShopListing
} from '../../src/lib/catalog-api/types.ts';

export interface CatalogStatement {
	bind(...values: (string | number | null)[]): CatalogStatement;
}
export interface CatalogD1 {
	prepare(sql: string): CatalogStatement;
	batch<T = Record<string, unknown>>(statements: CatalogStatement[]): Promise<{ results: T[] }[]>;
}
export interface Env {
	DB: CatalogD1;
	ASSETS: { fetch(request: Request): Promise<Response> };
}

class CatalogUnavailableError extends Error {}
const metadataSql = 'SELECT metadata, categories FROM catalog_meta WHERE id = 1';
function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
	return Response.json(value, {
		status,
		headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers }
	});
}

/** D1 batch executes these reads together, so count, facts and metadata share a snapshot. */
async function read(db: CatalogD1, statements: CatalogStatement[]) {
	const [metadata, ...data] = await db.batch([db.prepare(metadataSql), ...statements]);
	const row = metadata.results[0];
	if (!row) throw new CatalogUnavailableError();
	return {
		snapshot: JSON.parse(row.metadata as string) as CatalogSnapshotInfo,
		categories: JSON.parse(row.categories as string) as CatalogCategory[],
		data
	};
}

async function listing(db: CatalogD1, id: string): Promise<ShopListing | null> {
	const result = await read(db, [
		db.prepare('SELECT body FROM catalog_items WHERE id = ?').bind(id)
	]);
	const row = result.data[0].results[0];
	return row ? (JSON.parse(row.body as string) as ShopListing) : null;
}

async function list(db: CatalogD1, params: URLSearchParams) {
	const query = parseCatalogQuery(params);
	const conditions: string[] = [];
	const bindings: (string | number)[] = [];
	if (query.category !== 'all') {
		conditions.push('category = ?');
		bindings.push(query.category);
	}
	if (query.maxPrice !== null) {
		conditions.push('price IS NOT NULL AND price <= ?');
		bindings.push(query.maxPrice);
	}
	const terms = query.q.toLowerCase().split(/\s+/).filter(Boolean);
	if (terms.length) {
		// One JSON parameter preserves AND/literal semantics without exceeding D1's parameter limit.
		conditions.push('NOT EXISTS (SELECT 1 FROM json_each(?) WHERE instr(searchable, value) = 0)');
		bindings.push(JSON.stringify(terms));
	}
	const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
	const order =
		query.sort === 'catalog'
			? 'position, id'
			: `price IS NULL, price ${query.sort === 'price-low' ? 'ASC' : 'DESC'}, id`;
	const result = await read(db, [
		db.prepare(`SELECT COUNT(*) AS total FROM catalog_items${where}`).bind(...bindings),
		db
			.prepare(`SELECT body FROM catalog_items${where} ORDER BY ${order} LIMIT ? OFFSET ?`)
			.bind(...bindings, query.pageSize, (query.page - 1) * query.pageSize)
	]);
	return {
		snapshot: result.snapshot,
		categories: result.categories,
		items: result.data[1].results.map((row) => JSON.parse(row.body as string) as ShopListing),
		total: result.data[0].results[0].total,
		page: query.page,
		pageSize: query.pageSize
	};
}

function imageType(bytes: Uint8Array): string | null {
	if (bytes[0] === 255 && bytes[1] === 216) return 'image/jpeg';
	if ([137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value))
		return 'image/png';
	const text = new TextDecoder().decode(bytes.subarray(0, 12));
	return text.startsWith('RIFF') && text.endsWith('WEBP') ? 'image/webp' : null;
}

export async function handleRequest(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname.replace(/\/$/, '');
	if (path !== '/api/catalog' && !path.startsWith('/api/catalog/')) {
		if (path === '/api' || path.startsWith('/api/')) return json({ error: 'not_found' }, 404);
		const asset = await env.ASSETS.fetch(request);
		if (
			asset.status !== 404 ||
			request.method !== 'GET' ||
			!request.headers.get('accept')?.includes('text/html')
		)
			return asset;
		// Fetch the root document internally; /index.html would redirect the browser to /.
		return env.ASSETS.fetch(new Request(new URL('/', url), request));
	}
	if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, { allow: 'GET' });
	try {
		if (path === '/api/catalog') return json(await list(env.DB, url.searchParams));
		if (path === '/api/catalog/snapshot') {
			if (url.search) throw new CatalogInputError('Snapshot does not accept query parameters');
			const result = await read(env.DB, [
				env.DB.prepare('SELECT body FROM catalog_items ORDER BY position, id')
			]);
			return json({
				snapshot: result.snapshot,
				categories: result.categories,
				items: result.data[0].results.map((row) => JSON.parse(row.body as string) as ShopListing)
			});
		}
		const image = path.match(/^\/api\/catalog\/images\/([^/]+)$/);
		if (image) {
			const id = image[1];
			if (!validListingId(id)) throw new CatalogInputError('Invalid listing id');
			const item = await listing(env.DB, id);
			if (!item) return json({ error: 'not_found' }, 404);
			if (item.image !== `/api/catalog/images/${id}`)
				return json({ error: 'image_unavailable' }, 404);
			const asset = await env.ASSETS.fetch(new Request(new URL(`/_catalog-images/${id}.jpg`, url)));
			if (!asset.ok) return json({ error: 'image_unavailable' }, 404);
			const bytes = await asset.arrayBuffer();
			const type = imageType(new Uint8Array(bytes));
			if (!type) return json({ error: 'image_unavailable' }, 404);
			return new Response(bytes, {
				headers: {
					'content-type': type,
					'cache-control': 'public, max-age=86400',
					'x-content-type-options': 'nosniff'
				}
			});
		}
		const detail = path.match(/^\/api\/catalog\/([^/]+)$/);
		if (detail) {
			if (!validListingId(detail[1])) throw new CatalogInputError('Invalid listing id');
			const item = await listing(env.DB, detail[1]);
			return item ? json(item) : json({ error: 'not_found' }, 404);
		}
		return json({ error: 'not_found' }, 404);
	} catch (error) {
		if (error instanceof CatalogInputError)
			return json({ error: 'invalid_request', message: error.message }, 400);
		// An absent/unavailable D1 catalog must trigger the client's validated offline fallback.
		return json({ error: 'catalog_unavailable' }, 503);
	}
}

export default { fetch: handleRequest };
