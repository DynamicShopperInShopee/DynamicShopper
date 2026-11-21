import {
	categories as catalogCategories,
	products as catalogProducts,
	shops as catalogShops,
	specs as catalogSpecs
} from '../catalog/index.ts';
import type { Category, Localized, Product, Shop, SpecDefinition } from '../catalog/index.ts';

/**
 * The only door from the harness to the catalog. Swapping the catalog (for example to real
 * listings later) means providing another port; nothing else in the harness imports catalog data.
 */
export type CatalogPort = Readonly<{
	products: readonly Product[];
	shops: readonly Shop[];
	specs: Readonly<Record<Category, readonly SpecDefinition[]>>;
	categories: Readonly<Record<Category, Localized>>;
}>;

export const defaultCatalog: CatalogPort = {
	products: catalogProducts,
	shops: catalogShops,
	specs: catalogSpecs,
	categories: catalogCategories
};

export function findProduct(catalog: CatalogPort, id: unknown): Product | undefined {
	return typeof id === 'string' ? catalog.products.find((product) => product.id === id) : undefined;
}

export function findShop(catalog: CatalogPort, id: unknown): Shop | undefined {
	return typeof id === 'string' ? catalog.shops.find((shop) => shop.id === id) : undefined;
}

export function isCategory(catalog: CatalogPort, value: unknown): value is Category {
	return typeof value === 'string' && Object.hasOwn(catalog.categories, value);
}

export function specDefinition(
	catalog: CatalogPort,
	category: Category,
	key: unknown
): SpecDefinition | undefined {
	return catalog.specs[category].find((definition) => definition.key === key);
}
