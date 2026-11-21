import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { CATALOG_CACHE_KEY, decodeCatalogSnapshot, pageListings, readCatalogCache } from './client';
import type { CatalogSnapshot } from './types';
import { initialView, visibleListings, applyInterview } from '../mobile/engine';
import ShopShelf from '../mobile/ShopShelf.svelte';

// Synthetic boundary-test fixtures only; these never enter the storefront catalog.
function fixture(count = 1): CatalogSnapshot {
	return {
		items: Array.from({ length: count }, (_, index) => ({
			id: `1.${index + 1}`,
			name: { en: `Fixture ${index + 1}`, th: `รายการทดสอบ ${index + 1}` },
			category: 'test',
			price: index + 1,
			currency: 'THB',
			image: `/api/catalog/images/1.${index + 1}`,
			imageSource: `https://down-th.img.susercontent.com/file/fixture-${index + 1}`,
			source: `https://shopee.co.th/product/1/${index + 1}`,
			size: null,
			sourceLabel: {
				en: 'Selected variant price; check source terms',
				th: 'ราคาตัวเลือกที่แสดง ตรวจสอบเงื่อนไขต้นทาง'
			},
			observedAt: '2026-11-21',
			collectedAt: '2026-11-21T07:00:00Z'
		})),
		categories: [{ id: 'test', name: { en: 'Test', th: 'ทดสอบ' }, count }],
		snapshot: {
			id: 'test-snapshot',
			source: 'https://shopee.co.th/',
			observedAt: '2026-11-21',
			importedAt: '2026-11-21T07:00:00Z',
			total: count
		}
	};
}

describe('backend catalog and offline cache boundary', () => {
	it('revalidates a complete snapshot without changing its source facts', () => {
		const input = fixture(1500);
		expect(decodeCatalogSnapshot(input)).toEqual(input);
		const saved = JSON.stringify(input);
		expect(
			readCatalogCache({ getItem: (key) => (key === CATALOG_CACHE_KEY ? saved : null) })
		).toEqual(input);
	});
	it('rejects forged saved facts, unsafe links, duplicates and mismatched metadata', () => {
		const original = fixture();
		for (const change of [
			{ price: -1 },
			{ price: 1.25 },
			{ price: '1' },
			{ currency: 'VND' },
			{ source: 'javascript:alert(1)' },
			{ source: 'https://shopee.co.th.evil.example/product/1/1' },
			{ image: '//evil.example/a.jpg' },
			{ image: '/api/catalog/images/../secret' },
			{ id: 'custom-id' },
			{ source: 'https://shopee.co.th/product/2/20' },
			{ source: 'https://shopee.co.th/example-i.2.20' },
			{ image: '/api/catalog/images/2.20' },
			{ imageSource: null },
			{ imageSource: 'https://example.com/fake-product.jpg' },
			{ observedAt: 'not a date' },
			{ observedAt: '2026-02-31' }
		]) {
			expect(
				decodeCatalogSnapshot({ ...original, items: [{ ...original.items[0], ...change }] }),
				JSON.stringify(change)
			).toBeNull();
		}
		expect(
			decodeCatalogSnapshot({
				...original,
				items: [original.items[0], original.items[0]],
				snapshot: { ...original.snapshot, total: 2 }
			})
		).toBeNull();
		expect(
			decodeCatalogSnapshot({ ...original, categories: [{ ...original.categories[0], count: 2 }] })
		).toBeNull();
		expect(readCatalogCache({ getItem: () => '{broken' })).toBeNull();
		expect(
			readCatalogCache({
				getItem: () => {
					throw new Error('disabled');
				}
			})
		).toBeNull();
	});
	it('accepts only source links and image provenance bound to the listing', () => {
		const input = fixture();
		const slug = {
			...input,
			items: [{ ...input.items[0], source: 'https://shopee.co.th/observed-title-i.1.1' }]
		};
		expect(decodeCatalogSnapshot(slug)).toEqual(slug);
	});
	it('keeps unavailable prices unknown and excludes them from a budget result', () => {
		const source = fixture(3);
		const items = [{ ...source.items[0], price: null }, source.items[2], source.items[1]];
		const state = initialView();
		expect(visibleListings(state, '', items).map((item) => item.id)).toEqual(['1.1', '1.3', '1.2']);
		state.order = 'price-low';
		expect(visibleListings(state, '', items).map((item) => item.price)).toEqual([2, 3, null]);
		state.order = 'price-high';
		expect(visibleListings(state, '', items).map((item) => item.price)).toEqual([3, 2, null]);
		state.plan.maxPrice = 2;
		expect(visibleListings(state, '', items).map((item) => item.id)).toEqual(['1.2']);
	});
	it('searches the entire backend snapshot before slicing and retains page on presentation changes', () => {
		const source = fixture(1500);
		const state = { ...initialView(), page: 40 };
		expect(visibleListings(state, 'Fixture 1500', source.items).map((item) => item.id)).toEqual([
			'1.1500'
		]);
		const next = applyInterview(state, {
			goal: 'compare',
			evidence: 'specs',
			priority: 'value',
			reading: 'compact'
		});
		expect(next.page).toBe(40);
		expect(pageListings(source.items, next.page).items).toEqual(
			pageListings(source.items, state.page).items
		);
		const visited = Array.from(
			{ length: 63 },
			(_, index) => pageListings(source.items, index + 1).items
		).flat();
		expect(visited).toEqual(source.items);
		expect(pageListings(source.items, 999).items).toHaveLength(12);
	});
	it('renders only one shared page in grid, list and table with exact raw prices', () => {
		const source = fixture(1500);
		for (const layout of ['grid', 'list', 'table'] as const) {
			const plan = { ...initialView().plan, layout, details: ['price'] as const };
			const html = render(ShopShelf, {
				props: {
					plan: { ...plan, details: [...plan.details] },
					rows: source.items,
					categories: source.categories,
					page: 2,
					onopen: () => {}
				}
			}).body;
			expect(html.match(/data-fact-key="[^"]+:shopPrice"/g)).toHaveLength(24);
			expect(html).toContain('data-fact-key="1.25:shopPrice" data-raw="25"');
			expect(html).not.toContain('data-fact-key="1.49:shopPrice"');
			expect(html).not.toContain('240150px');
			expect(html.match(/data-fact-key="[^"]+:sourceLabel"/g)).toHaveLength(24);
		}
	});
});
