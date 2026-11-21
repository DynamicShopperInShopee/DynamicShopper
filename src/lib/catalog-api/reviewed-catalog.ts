import { listings, retrieved, shopSource } from '../mobile/shop-data';
import type { CatalogCategory, CatalogSnapshot } from './types';

const categories: CatalogCategory[] = [
	{ id: 'laundry', name: { en: 'Laundry care', th: 'ดูแลเสื้อผ้า' } },
	{ id: 'dishes', name: { en: 'Kitchen care', th: 'ดูแลครัว' } }
].map((group) => ({
	...group,
	count: listings.filter((item) => item.category === group.id).length
}));

export const reviewedCatalog: CatalogSnapshot = {
	items: listings,
	categories,
	snapshot: {
		id: 'starter-seven',
		source: shopSource,
		observedAt: retrieved,
		importedAt: retrieved,
		total: listings.length
	}
};
