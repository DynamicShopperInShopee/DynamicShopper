import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { validateCatalogSnapshot } from '../src/lib/server/catalog/validate.ts';

const origin = process.argv[2];
if (!origin || !/^https?:\/\//.test(origin)) {
	throw new Error('Usage: node scripts/verify-catalog-deployment.ts https://worker.example');
}
const expected = validateCatalogSnapshot(
	JSON.parse(await readFile('data/shopee/catalog.json', 'utf8'))
);
const base = new URL(origin);
async function get(path: string) {
	const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) });
	assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
	return response;
}
const actual = validateCatalogSnapshot(await (await get('/api/catalog/snapshot')).json());
assert.deepEqual(actual, expected, 'Deployed snapshot must exactly match imported source facts');
assert.equal(actual.items.length, 1500);

const visited: string[] = [];
const pageCount = Math.ceil(expected.items.length / 24);
for (let page = 1; page <= pageCount; page++) {
	const body = (await (await get(`/api/catalog?page=${page}&pageSize=24`)).json()) as {
		items: Array<{ id: string }>;
		total: number;
	};
	assert.equal(body.total, expected.items.length);
	assert.deepEqual(body.items, expected.items.slice((page - 1) * 24, page * 24));
	visited.push(...body.items.map((item) => item.id));
}
assert.equal(new Set(visited).size, 1500, 'Pagination must expose each product exactly once');

const last = expected.items.at(-1)!;
assert.deepEqual(await (await get(`/api/catalog/${last.id}`)).json(), last);
const search = (await (await get('/api/catalog?q=GameSir&pageSize=100')).json()) as {
	items: Array<{ id: string }>;
	total: number;
};
const matching = expected.items.filter((item) =>
	[item.name.en, item.name.th, item.sellerName ?? ''].join(' ').toLowerCase().includes('gamesir')
);
assert.equal(search.total, matching.length);
assert.deepEqual(
	search.items.map((item) => item.id),
	matching.map((item) => item.id)
);

const imageSamples = new Map<string, { id: string; bytes: Buffer }>();
for (const item of expected.items) {
	const bytes = await readFile(`data/shopee/images/${item.id}.jpg`);
	const type = bytes[0] === 0x89 && bytes[1] === 0x50 ? 'image/png' : 'image/jpeg';
	if (!imageSamples.has(type)) imageSamples.set(type, { id: item.id, bytes });
	if (imageSamples.size === 2) break;
}
const hash = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
for (const [type, { id, bytes }] of imageSamples) {
	const response = await get(`/api/catalog/images/${id}`);
	assert.equal(response.headers.get('content-type')?.split(';')[0], type);
	assert.equal(hash(new Uint8Array(await response.arrayBuffer())), hash(bytes));
}
const missing = await fetch(new URL('/api/catalog/unknown/path', base));
assert.equal(missing.status, 404);
assert.match(missing.headers.get('content-type') ?? '', /application\/json/);
const rejectedWrite = await fetch(new URL('/api/catalog', base), { method: 'POST' });
assert.equal(rejectedWrite.status, 405);
const home = await get('/');
assert.match(home.headers.get('content-type') ?? '', /text\/html/);
console.log(
	JSON.stringify(
		{
			origin: base.origin,
			snapshot: actual.snapshot.id,
			total: actual.items.length,
			pages: pageCount,
			groups: actual.categories.length,
			searchMatches: search.total,
			imageTypes: [...imageSamples.keys()],
			result: 'passed'
		},
		null,
		2
	)
);
