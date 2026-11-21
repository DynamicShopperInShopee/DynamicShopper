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
	const query = accepted.query ?? current.query;
	if (
		category &&
		category !== current.category &&
		query &&
		(locks.includes('query') || category === requestedCategory) &&
		!products.some((product) => product.category === category && matchesQuery(product, query))
	) {
		if (category === requestedCategory) accepted.query = '';
		else delete accepted.category;
	}
	return accepted;
}
