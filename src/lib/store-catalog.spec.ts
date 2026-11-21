import { expect, it } from 'vitest';
import { getProduct, products } from './catalog';
import { catalog } from './store-catalog';

it('projects canonical catalog facts without changing existing storefront model IDs', () => {
	expect(catalog.find(({ id }) => id === 'mouse-2')?.catalogId).toBe('vortex-w');
	expect(catalog.find(({ id }) => id === 'cooker-1')?.catalogId).toBe('cooker-one-button');
	expect(new Set(catalog.map(({ catalogId }) => catalogId))).toEqual(
		new Set(products.map(({ id }) => id))
	);

	for (const listing of catalog) {
		const product = getProduct(listing.catalogId);
		expect(product).toBeDefined();
		expect(listing.name).toBe(product?.name);
		expect(listing.price).toBe(product?.price);
		expect(listing.originalPrice).toBe(product?.originalPrice ?? null);
		expect(listing.shipping).toBe(product?.shipping);
		expect(listing.rating).toBe(product?.rating);
		expect(listing.sold).toBe(product?.sold);
	}
});
