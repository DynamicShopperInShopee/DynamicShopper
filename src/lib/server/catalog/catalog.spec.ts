import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CatalogStore } from './store';
import { handleCatalogRequest } from './api';

const directories: string[] = [];
afterEach(() => {
	for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true });
});

function snapshot() {
	const items = [
		['1.10', 'Phone Alpha', 'phones', 600],
		['1.11', 'Phone Beta', 'phones', 600],
		['2.20', 'สบู่ Soap', 'care', 40],
		['2.21', 'สบู่ Unsourced price', 'care', null]
	].map(([id, title, category, price]) => ({
		id,
		name: { en: title, th: title },
		category,
		price,
		currency: 'THB',
		image: null,
		source: `https://shopee.co.th/product/${String(id).replace('.', '/')}`,
		size: null,
		observedAt: '2025-05-31',
		collectedAt: '2026-11-21'
	}));
	return {
		items,
		categories: [
			{ id: 'phones', name: { en: 'Phones', th: 'โทรศัพท์' }, count: 2 },
			{ id: 'care', name: { en: 'Care', th: 'ดูแลตัวเอง' }, count: 2 }
		],
		snapshot: {
			id: 'test-source',
			source: 'https://www.kaggle.com/datasets/example/shopee-thailand',
			observedAt: '2025-05-31',
			importedAt: '2026-11-21',
			total: items.length
		}
	};
}

function store() {
	const directory = mkdtempSync(join(tmpdir(), 'dynamicshopper-catalog-test-'));
	directories.push(directory);
	const path = join(directory, 'catalog.sqlite');
	return { db: new CatalogStore(path), path };
}

describe('durable sourced catalog', () => {
	it('preserves exact facts across restart and imports the same snapshot idempotently', () => {
		const { db, path } = store();
		const source = snapshot();
		const first = db.importSnapshot(source);
		const second = db.importSnapshot(source);
		expect(first.changed).toBe(true);
		expect(second.changed).toBe(false);
		expect(second.total).toBe(4);
		db.close();
		const reopened = new CatalogStore(path);
		expect(reopened.snapshot()).toEqual(source);
		reopened.close();
	});

	it('preserves UTC timestamps with the precision emitted by the observation importer', () => {
		const { db } = store();
		const source = snapshot();
		source.items[0].observedAt = '2026-11-21T07:29:37.558000Z';
		source.items[0].collectedAt = '2026-11-21T07:30:01.123456Z';
		source.snapshot.importedAt = source.items[0].collectedAt;
		try {
			db.importSnapshot(source);
			expect(db.snapshot()).toEqual(source);
		} finally {
			db.close();
		}
	});

	it('rejects duplicate or invalid facts without replacing the last good catalog', () => {
		const { db } = store();
		const original = snapshot();
		db.importSnapshot(original);
		for (const mutate of [
			(value: ReturnType<typeof snapshot>) => {
				value.items[1].id = value.items[0].id;
			},
			(value: ReturnType<typeof snapshot>) => {
				value.items[0].currency = 'SGD';
			},
			(value: ReturnType<typeof snapshot>) => {
				value.items[0].price = 600.5;
			},
			(value: ReturnType<typeof snapshot>) => {
				value.items[0].source = 'javascript:alert(1)';
			},
			(value: ReturnType<typeof snapshot>) => {
				value.items[0].source = 'https://shopee.co.th/product/99/99';
			},
			(value: ReturnType<typeof snapshot>) => {
				value.items[0].observedAt = '2026-02-31T07:30:01.123456Z';
			},
			(value: ReturnType<typeof snapshot>) => {
				value.snapshot.total = 100;
			}
		]) {
			const invalid = snapshot();
			mutate(invalid);
			expect(() => db.importSnapshot(invalid)).toThrow();
			expect(db.snapshot()).toEqual(original);
		}
		db.close();
	});

	it('filters before stable pagination, keeps unknown prices last, and never treats query text as SQL', () => {
		const { db } = store();
		db.importSnapshot(snapshot());
		const first = db.list(new URLSearchParams('q=phone&sort=price-low&pageSize=1'));
		const second = db.list(new URLSearchParams('q=phone&sort=price-low&pageSize=1&page=2'));
		expect(first.total).toBe(2);
		expect(first.items.map((item) => item.id)).toEqual(['1.10']);
		expect(second.items.map((item) => item.id)).toEqual(['1.11']);
		expect(db.list(new URLSearchParams('q=สบู่&maxPrice=100')).items.map((item) => item.id)).toEqual([
			'2.20'
		]);
		expect(db.list(new URLSearchParams('sort=price-high')).items.at(-1)?.price).toBeNull();
		expect(db.list(new URLSearchParams({ q: "' OR 1=1 --" })).total).toBe(0);
		expect(db.snapshot().items).toHaveLength(4);
		db.close();
	});

	it('bounds untrusted API parameters and exposes only reads', async () => {
		const { db } = store();
		db.importSnapshot(snapshot());
		for (const query of [
			'page=0',
			'page=1.5',
			'pageSize=99999',
			'sort=drop-table',
			'maxPrice=-1',
			'q=' + 'x'.repeat(257)
		]) {
			const response = await handleCatalogRequest(
				new Request(`http://localhost/api/catalog?${query}`),
				db
			);
			expect(response.status).toBe(400);
		}
		const posted = await handleCatalogRequest(
			new Request('http://localhost/api/catalog', { method: 'POST' }),
			db
		);
		expect(posted.status).toBe(405);
		const detail = await handleCatalogRequest(new Request('http://localhost/api/catalog/1.10'), db);
		expect(detail.status).toBe(200);
		expect(((await detail.json()) as { price: number }).price).toBe(600);
		const missing = await handleCatalogRequest(
			new Request('http://localhost/api/catalog/9.99'),
			db
		);
		expect(missing.status).toBe(404);
		const all = await handleCatalogRequest(
			new Request('http://localhost/api/catalog/snapshot'),
			db
		);
		expect(((await all.json()) as { items: unknown[] }).items).toHaveLength(4);
		db.close();
	});
});
