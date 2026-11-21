import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import BetterSqlite3 from 'better-sqlite3';
import { CatalogStore } from '../../src/lib/server/catalog/store.ts';
import { handleRequest, type CatalogD1, type CatalogStatement, type Env } from './worker.ts';

const directory = mkdtempSync(join(tmpdir(), 'catalog-worker-test-'));
const path = join(directory, 'catalog.sqlite');
const source = new CatalogStore(path);
const snapshot = {
	items: [10, 10, 30, null].map((price, index) => ({
		id: `1.${index + 1}`,
		name: { en: `Fixture ${index + 1}`, th: `ทดสอบ ${index + 1}` },
		category: index < 2 ? 'alpha' : 'beta',
		price,
		currency: 'THB',
		size: null,
		source: `https://shopee.co.th/product/1/${index + 1}`,
		image: `/api/catalog/images/1.${index + 1}`,
		imageSource: `https://down-th.img.susercontent.com/file/fixture${index + 1}`
	})),
	categories: [
		{ id: 'alpha', name: { en: 'Alpha', th: 'อัลฟา' }, count: 2 },
		{ id: 'beta', name: { en: 'Beta', th: 'เบตา' }, count: 2 }
	],
	snapshot: {
		id: 'fixture',
		source: 'https://shopee.co.th/',
		observedAt: '2026-11-21',
		importedAt: '2026-11-21',
		total: 4
	}
};
source.importSnapshot(snapshot);
const sqlite = new BetterSqlite3(path, { readonly: true });
class Statement implements CatalogStatement {
	readonly sql: string;
	readonly values: (string | number | null)[];
	constructor(sql: string, values: (string | number | null)[] = []) {
		this.sql = sql;
		this.values = values;
	}
	bind(...values: (string | number | null)[]) {
		return new Statement(this.sql, values);
	}
}
const db: CatalogD1 = {
	prepare(sql) {
		assert.match(sql, /^SELECT /);
		return new Statement(sql);
	},
	batch<T>(statements: CatalogStatement[]) {
		return Promise.resolve(
			sqlite.transaction(() =>
				statements.map((statement) => {
					const { sql, values } = statement as Statement;
					return { results: sqlite.prepare(sql).all(...values) as T[] };
				})
			)()
		);
	}
};
const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
const env: Env = {
	DB: db,
	ASSETS: {
		fetch(request) {
			const path = new URL(request.url).pathname;
			if (path === '/_catalog-images/1.1.jpg')
				return Promise.resolve(new Response(png, { headers: { 'content-type': 'image/jpeg' } }));
			if (path === '/_catalog-images/1.2.jpg')
				return Promise.resolve(new Response('<html>not an image</html>'));
			return Promise.resolve(
				new Response(path === '/' ? '<html>shop</html>' : '', {
					status: path === '/' ? 200 : 404
				})
			);
		}
	}
};
const request = (path: string, options?: RequestInit) =>
	handleRequest(new Request(`https://example.test${path}`, options), env);
after(() => {
	sqlite.close();
	source.close();
	rmSync(directory, { recursive: true, force: true });
});

void test('D1 snapshot, filtering and stable pagination match the Node catalog facts', async () => {
	assert.deepEqual(await (await request('/api/catalog/snapshot')).json(), snapshot);
	for (const query of [
		'',
		'page=2&pageSize=2',
		'sort=price-high',
		'sort=price-low&maxPrice=10',
		'category=beta',
		'q=Fixture%203',
		'q=%27%20OR%201%3D1%20--',
		`q=${encodeURIComponent('a '.repeat(128).trim())}`
	]) {
		const result = await request('/api/catalog?' + query);
		assert.equal(result.status, 200);
		assert.deepEqual(await result.json(), source.list(new URLSearchParams(query)));
	}
	assert.deepEqual(await (await request('/api/catalog/1.3')).json(), snapshot.items[2]);
});

void test('read-only API rejects unsafe inputs and never sends unknown API routes to SPA assets', async () => {
	for (const path of [
		'/api/catalog?pageSize=101',
		'/api/catalog?sort=DELETE',
		'/api/catalog?page=1&page=2',
		'/api/catalog/snapshot?q=anything',
		'/api/catalog/images/not-an-id'
	])
		assert.equal((await request(path)).status, 400);
	assert.equal((await request('/api/catalog', { method: 'POST' })).status, 405);
	assert.equal((await request('/api/catalog/9.9')).status, 404);
	const missing = await request('/api/unknown', { headers: { accept: 'text/html' } });
	assert.equal(missing.status, 404);
	assert.match(missing.headers.get('content-type') ?? '', /application\/json/);
});

void test('images keep their bytes and actual MIME, with explicit missing-image handling', async () => {
	const image = await request('/api/catalog/images/1.1');
	assert.equal(image.headers.get('content-type'), 'image/png');
	assert.deepEqual(new Uint8Array(await image.arrayBuffer()), png);
	assert.equal((await request('/api/catalog/images/1.2')).status, 404);
	assert.equal((await request('/api/catalog/images/1.3')).status, 404);
	assert.equal((await request('/api/catalog/images/9.9')).status, 404);
});

void test('absent catalog returns 503 while frontend routes still render', async () => {
	const unavailable: Env = {
		...env,
		DB: {
			prepare: (sql) => db.prepare(sql),
			batch() {
				return Promise.resolve([{ results: [] }]);
			}
		}
	};
	const response = await handleRequest(
		new Request('https://example.test/api/catalog'),
		unavailable
	);
	assert.equal(response.status, 503);
	assert.deepEqual(await response.json(), { error: 'catalog_unavailable' });
	assert.equal(
		await (await request('/shopping', { headers: { accept: 'text/html' } })).text(),
		'<html>shop</html>'
	);
});
