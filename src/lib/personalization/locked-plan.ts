import { products } from '../catalog';
import type { ShopperPlan } from './plan';
import { matchesQuery } from './ranking';

export function reconcilePlanPatch(
	current: ShopperPlan,
	patch: Partial<ShopperPlan>,
	locks: readonly (keyof ShopperPlan)[],
	requestedCategory?: ShopperPlan['category']
): Partial<ShopperPlan> {
	const accepted: Partial<ShopperPlan> = Object.fromEntries(
		Object.entries(patch).filter(
			([key, value]) => value !== undefined && !locks.includes(key as keyof ShopperPlan)
		)
	);
	const { category } = accepted;
	if (
		category &&
		category !== current.category &&
		current.query &&
		locks.includes('query') &&
		!products.some(
			(product) => product.category === category && matchesQuery(product, current.query)
		)
	) {
		if (category === requestedCategory) accepted.query = '';
		else delete accepted.category;
	}
	return accepted;
}
