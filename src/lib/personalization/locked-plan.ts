import { products, specs } from '../catalog';
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

	const nextCategory = accepted.category === undefined ? current.category : accepted.category;
	const categoryChanged = nextCategory !== current.category;
	const categoryBlocked = patch.category !== undefined && patch.category !== nextCategory;
	if (categoryBlocked && nextCategory === null) {
		// Terms from a rejected category have no single definition across the full catalog.
		delete accepted.highlightedSpecs;
		delete accepted.specPreferences;
		return accepted;
	}
	if (nextCategory && (categoryChanged || categoryBlocked)) {
		const rejectedDefinitions =
			categoryBlocked && patch.category ? specs[patch.category] : undefined;
		const definitions = specs[nextCategory].filter(
			(spec) =>
				!rejectedDefinitions ||
				rejectedDefinitions.some(
					(rejected) =>
						rejected.key === spec.key &&
						rejected.unit === spec.unit &&
						rejected.direction === spec.direction &&
						rejected.label.en === spec.label.en &&
						rejected.label.th === spec.label.th
				)
		);
		const highlights =
			accepted.highlightedSpecs ?? (categoryChanged ? current.highlightedSpecs : []);
		const preferences =
			accepted.specPreferences ?? (categoryChanged ? current.specPreferences : {});
		const scopedHighlights = highlights.filter((key) =>
			definitions.some((spec) => spec.key === key)
		);
		const scopedPreferences = Object.entries(preferences).filter(([key]) =>
			definitions.some((spec) => spec.key === key && spec.direction)
		);

		if (categoryBlocked) {
			// Shared terms can refine the current category without replacing its other preferences.
			if (scopedHighlights.length)
				accepted.highlightedSpecs = [
					...new Set([...scopedHighlights, ...current.highlightedSpecs])
				];
			else delete accepted.highlightedSpecs;
			if (scopedPreferences.length)
				accepted.specPreferences = {
					...current.specPreferences,
					...Object.fromEntries(scopedPreferences)
				};
			else delete accepted.specPreferences;
		} else {
			if (scopedHighlights.length !== highlights.length)
				accepted.highlightedSpecs = scopedHighlights;
			if (scopedPreferences.length !== Object.keys(preferences).length)
				accepted.specPreferences = Object.fromEntries(scopedPreferences);
		}
	}
	return accepted;
}
