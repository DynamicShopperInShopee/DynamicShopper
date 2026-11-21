import manifest from '../../../catalogs/shopee-2026-11-21/manifest.json' with { type: 'json' };
import type { CatalogCategory, CatalogSnapshot, LocalizedText, ShopListing } from './types';

import { isImageSource, isListingSource, isShopSource, isSnapshotSource } from './provenance.ts';
const CACHE_KEY = 'dynamicshopper.catalog.v1';
const MAX_ITEMS = 10_000;
const MAX_PAYLOAD = 12_000_000;
const listingIdPattern = /^\d{1,20}\.\d{1,20}$/;
const categoryIdPattern = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown, max = 1000): value is string =>
	typeof value === 'string' && value.trim().length > 0 && value.length <= max;
function localized(value: unknown): LocalizedText | null {
	return record(value) && text(value.en) && text(value.th) ? { en: value.en, th: value.th } : null;
}
function date(value: unknown): value is string {
	if (!(
		typeof value === 'string' &&
		value.length <= 40 &&
		/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) &&
		Number.isFinite(Date.parse(value))
	))
		return false;
	const [year, month, day] = value.slice(0, 10).split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value.slice(0, 10);
}
function imageUrl(value: unknown, id: string): value is string {
	return value === `/api/catalog/images/${id}` || isImageSource(value);
}

/** Decode catalog facts from the read-only API or versioned release snapshot. */
export function decodeCatalogSnapshot(raw: unknown): CatalogSnapshot | null {
	if (
		!record(raw) ||
		!Array.isArray(raw.items) ||
		!Array.isArray(raw.categories) ||
		!record(raw.snapshot) ||
		!raw.items.length ||
		raw.items.length > MAX_ITEMS ||
		raw.categories.length > 200
	)
		return null;
	const meta = raw.snapshot;
	if (
		!text(meta.id, 200) ||
		!isSnapshotSource(meta.source) ||
		!date(meta.importedAt) ||
		(meta.observedAt !== null && !date(meta.observedAt)) ||
		meta.total !== raw.items.length ||
		(meta.license !== undefined && !text(meta.license, 1000))
	)
		return null;
	const items: ShopListing[] = [];
	const ids = new Set<string>();
	const categoryCounts = new Map<string, number>();
	for (const item of raw.items) {
		if (
			!record(item) ||
			!text(item.id, 41) ||
			!listingIdPattern.test(item.id) ||
			ids.has(item.id) ||
			!text(item.category, 64) ||
			!categoryIdPattern.test(item.category) ||
			item.category === 'all' ||
			item.currency !== 'THB' ||
			!isListingSource(item.source, item.id) ||
			(item.price !== null && (!Number.isSafeInteger(item.price) || Number(item.price) < 0)) ||
			(item.image !== null && !imageUrl(item.image, item.id)) ||
			(item.sellerName != null && !text(item.sellerName, 300)) ||
			(item.observedAt != null && !date(item.observedAt)) ||
			(item.collectedAt !== undefined && !date(item.collectedAt)) ||
			(item.priceSource != null && !isShopSource(item.priceSource)) ||
			(item.imageSource != null && !isImageSource(item.imageSource)) ||
			(item.image === `/api/catalog/images/${item.id}` && !isImageSource(item.imageSource))
		)
			return null;
		const name = localized(item.name);
		const size = item.size === null ? null : localized(item.size);
		const sourceLabel = item.sourceLabel === undefined ? undefined : localized(item.sourceLabel);
		if (!name || (item.size !== null && !size) || sourceLabel === null) return null;
		ids.add(item.id);
		categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
		items.push({
			id: item.id,
			name,
			category: item.category,
			price: item.price as number | null,
			currency: 'THB',
			image: item.image,
			source: item.source,
			size,
			sellerName: item.sellerName,
			observedAt: item.observedAt,
			collectedAt: item.collectedAt,
			priceSource: item.priceSource,
			imageSource: item.imageSource,
			...(sourceLabel ? { sourceLabel } : {})
		});
	}
	const categories: CatalogCategory[] = [];
	const categoryIds = new Set<string>();
	for (const category of raw.categories) {
		if (
			!record(category) ||
			!text(category.id, 64) ||
			!categoryIdPattern.test(category.id) ||
			category.id === 'all' ||
			categoryIds.has(category.id) ||
			category.count !== categoryCounts.get(category.id)
		)
			return null;
		const name = localized(category.name);
		if (!name) return null;
		categoryIds.add(category.id);
		categories.push({ id: category.id, name, count: category.count as number });
	}
	if (categories.length !== categoryCounts.size) return null;
	return {
		items,
		categories,
		snapshot: {
			id: meta.id,
			source: meta.source,
			observedAt: meta.observedAt,
			importedAt: meta.importedAt,
			total: items.length,
			...(typeof meta.license === 'string' ? { license: meta.license } : {})
		}
	};
}

async function matchesRelease(serialized: string): Promise<boolean> {
	if (!serialized || serialized.length > MAX_PAYLOAD) return false;
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
	return (
		Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('') ===
		manifest.validatedSnapshotChecksum
	);
}

export async function readCatalogCache(
	storage?: Pick<Storage, 'getItem'>
): Promise<CatalogSnapshot | null> {
	try {
		const saved = (storage ?? window.localStorage).getItem(CACHE_KEY);
		return saved && (await matchesRelease(saved)) ? decodeCatalogSnapshot(JSON.parse(saved)) : null;
	} catch {
		return null;
	}
}

export async function writeCatalogCache(snapshot: CatalogSnapshot): Promise<void> {
	// Only the exact published release may supply facts on a later offline visit.
	if (
		snapshot.snapshot.id !== manifest.snapshotId ||
		snapshot.items.length !== manifest.recordCount
	)
		return;
	try {
		const saved = JSON.stringify(snapshot);
		if (await matchesRelease(saved)) window.localStorage.setItem(CACHE_KEY, saved);
	} catch {
		// Storage and Web Crypto are optional. The loaded catalog remains usable.
	}
}

export async function fetchCatalogSnapshot(signal: AbortSignal, transport: typeof fetch = fetch) {
	const response = await transport('/api/catalog/snapshot', {
		signal,
		redirect: 'error',
		headers: { Accept: 'application/json' }
	});
	if (!response.ok) throw new Error('Catalog unavailable');
	const body = await response.text();
	if (body.length > MAX_PAYLOAD) throw new Error('Catalog response too large');
	const snapshot = decodeCatalogSnapshot(JSON.parse(body));
	if (!snapshot) throw new Error('Catalog response invalid');
	return snapshot;
}

export function categoryName(
	id: string,
	categories: readonly CatalogCategory[],
	locale: 'en' | 'th'
) {
	return categories.find((category) => category.id === id)?.name[locale] ?? id;
}

export const CATALOG_PAGE_SIZE = 24;
export function pageListings<T>(items: readonly T[], requestedPage: number) {
	const pages = Math.max(1, Math.ceil(items.length / CATALOG_PAGE_SIZE));
	const page = Math.min(
		pages,
		Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1)
	);
	return {
		page,
		pages,
		start: (page - 1) * CATALOG_PAGE_SIZE,
		items: items.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE)
	};
}
