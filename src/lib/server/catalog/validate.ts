import type {
	CatalogCategory,
	CatalogSnapshot,
	CatalogSnapshotInfo,
	LocalizedText,
	ShopListing
} from '../../catalog-api/types.ts';

export class CatalogInputError extends Error {}

function record(value: unknown, field: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new CatalogInputError(`${field} must be an object`);
	}
	return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max = 4000): string {
	if (
		typeof value !== 'string' ||
		!value.trim() ||
		value.length > max ||
		Array.from(value).some((character) => {
			const code = character.charCodeAt(0);
			return code < 32 && ![9, 10, 13].includes(code);
		})
	) {
		throw new CatalogInputError(`${field} must be nonempty text within its length limit`);
	}
	return value;
}

function localized(value: unknown, field: string): LocalizedText {
	const input = record(value, field);
	return { en: text(input.en, `${field}.en`), th: text(input.th, `${field}.th`) };
}

function count(value: unknown, field: string): number {
	if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
		throw new CatalogInputError(`${field} must be a nonnegative safe integer`);
	}
	return value;
}

function date(value: unknown, field: string): string {
	const result = text(value, field, 40);
	if (
		!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z)?$/.test(result) ||
		!Number.isFinite(Date.parse(result)) ||
		new Date(result).toISOString().slice(0, 10) !== result.slice(0, 10)
	) {
		throw new CatalogInputError(`${field} must be an ISO date or UTC timestamp`);
	}
	return result;
}

function httpsUrl(value: unknown, field: string): string {
	const result = text(value, field, 10000);
	let url: URL;
	try {
		url = new URL(result);
	} catch {
		throw new CatalogInputError(`${field} must be an HTTPS URL`);
	}
	if (url.protocol !== 'https:' || url.username || url.password)
		throw new CatalogInputError(`${field} must be an HTTPS URL without credentials`);
	return result;
}

export function validListingId(value: string): boolean {
	return /^\d{1,20}\.\d{1,20}$/.test(value);
}

function listingSource(value: unknown, id: string): string {
	const result = httpsUrl(value, 'item.source');
	const url = new URL(result);
	const pair = url.pathname.match(/(?:^\/product\/(\d+)\/(\d+)\/?$|-i\.(\d+)\.(\d+)\/?$)/);
	const linkedId = pair ? `${pair[1] ?? pair[3]}.${pair[2] ?? pair[4]}` : '';
	if (!['shopee.co.th', 'www.shopee.co.th'].includes(url.hostname) || linkedId !== id) {
		throw new CatalogInputError('item.source must link to its Thai Shopee shop/item pair');
	}
	return result;
}

function imageSource(value: unknown, field: string): string {
	const result = httpsUrl(value, field);
	const url = new URL(result);
	if (!/(?:^|\.)susercontent\.com$/.test(url.hostname))
		throw new CatalogInputError(`${field} must use the original Shopee image CDN`);
	return result;
}

function categoryId(value: unknown): string {
	const result = text(value, 'category.id', 64);
	if (!/^[a-z0-9][a-z0-9_-]*$/.test(result)) throw new CatalogInputError('category.id is invalid');
	return result;
}

function listing(value: unknown): ShopListing {
	const input = record(value, 'item');
	const id = text(input.id, 'item.id', 41);
	if (!validListingId(id)) throw new CatalogInputError('item.id must be a shopId.itemId pair');
	if (input.currency !== 'THB')
		throw new CatalogInputError('item.currency must be THB; no conversion is performed');
	const price = input.price === null ? null : count(input.price, 'item.price');
	let image: string | null = null;
	if (input.image !== null) {
		const candidate = text(input.image, 'item.image', 10000);
		image =
			candidate === `/api/catalog/images/${id}` ? candidate : imageSource(candidate, 'item.image');
	}
	if (image?.startsWith('/api/catalog/images/') && !input.imageSource) {
		throw new CatalogInputError('Cached product images require their original imageSource');
	}
	const result: ShopListing = {
		id,
		name: localized(input.name, 'item.name'),
		category: categoryId(input.category),
		price,
		currency: 'THB',
		image,
		source: listingSource(input.source, id),
		size: input.size === null ? null : localized(input.size, 'item.size'),
		...(input.sellerName !== undefined
			? {
					sellerName:
						input.sellerName === null ? null : text(input.sellerName, 'item.sellerName', 500)
				}
			: {}),
		...(input.observedAt !== undefined
			? { observedAt: input.observedAt === null ? null : date(input.observedAt, 'item.observedAt') }
			: {}),
		...(input.collectedAt !== undefined
			? { collectedAt: date(input.collectedAt, 'item.collectedAt') }
			: {}),
		...(input.priceSource !== undefined
			? {
					priceSource:
						input.priceSource === null ? null : httpsUrl(input.priceSource, 'item.priceSource')
				}
			: {}),
		...(input.imageSource !== undefined
			? {
					imageSource:
						input.imageSource === null ? null : imageSource(input.imageSource, 'item.imageSource')
				}
			: {}),
		...(input.sourceLabel !== undefined
			? { sourceLabel: localized(input.sourceLabel, 'item.sourceLabel') }
			: {})
	};
	return result;
}

/** Import is an explicit operator action. Reject an invalid import before touching the database. */
export function validateCatalogSnapshot(value: unknown): CatalogSnapshot {
	const input = record(value, 'catalog');
	if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 100_000)
		throw new CatalogInputError(
			'catalog.items must contain between one and one hundred thousand listings'
		);
	const items = input.items.map(listing);
	if (new Set(items.map(({ id }) => id)).size !== items.length)
		throw new CatalogInputError('catalog contains duplicate shop/item pairs');
	if (!Array.isArray(input.categories) || input.categories.length > 500)
		throw new CatalogInputError('catalog.categories is invalid');
	const categoryCounts = new Map<string, number>();
	for (const item of items)
		categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
	const categories: CatalogCategory[] = input.categories.map((value: unknown) => {
		const row = record(value, 'category');
		const id = categoryId(row.id);
		const total = count(row.count, 'category.count');
		if (categoryCounts.get(id) !== total)
			throw new CatalogInputError('category count must match its sourced listing records');
		return { id, name: localized(row.name, 'category.name'), count: total };
	});
	if (
		new Set(categories.map(({ id }) => id)).size !== categories.length ||
		categories.length !== categoryCounts.size
	)
		throw new CatalogInputError('every listing category needs exactly one category record');
	const rawMeta = record(input.snapshot, 'snapshot');
	const id = text(rawMeta.id, 'snapshot.id', 128);
	if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(id))
		throw new CatalogInputError('snapshot.id is invalid');
	const total = count(rawMeta.total, 'snapshot.total');
	if (total !== items.length)
		throw new CatalogInputError('snapshot.total must match its listing records');
	const snapshot: CatalogSnapshotInfo = {
		id,
		source: httpsUrl(rawMeta.source, 'snapshot.source'),
		observedAt:
			rawMeta.observedAt === null ? null : date(rawMeta.observedAt, 'snapshot.observedAt'),
		importedAt: date(rawMeta.importedAt, 'snapshot.importedAt'),
		total,
		...(rawMeta.license !== undefined
			? { license: text(rawMeta.license, 'snapshot.license', 2000) }
			: {})
	};
	return { items, categories, snapshot };
}
