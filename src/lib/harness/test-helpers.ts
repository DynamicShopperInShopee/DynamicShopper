import {
	CARD_FIELDS,
	DENSITIES,
	LANGUAGES,
	LAYOUTS,
	PRIORITIES,
	SECTIONS,
	THEMES,
	type Plan
} from './types.ts';

/** A plan is valid when every part holds an allowed value and the product list is present. */
export function isValidPlan(plan: Plan): boolean {
	const inList = (list: readonly unknown[], value: unknown) => list.includes(value);
	return (
		inList(THEMES, plan.theme) &&
		inList(LAYOUTS, plan.layout) &&
		inList(DENSITIES, plan.density) &&
		inList(LANGUAGES, plan.language) &&
		plan.cardFields.length > 0 &&
		plan.cardFields.every((field) => inList(CARD_FIELDS, field)) &&
		PRIORITIES.every((key) => plan.priorities[key] >= 0 && plan.priorities[key] <= 1) &&
		plan.sections.includes('products') &&
		plan.sections.length <= 7 &&
		new Set(plan.sections).size === plan.sections.length &&
		plan.sections.every((section) => inList(SECTIONS, section)) &&
		(plan.filters.maxPrice === null ||
			(Number.isInteger(plan.filters.maxPrice) && plan.filters.maxPrice >= 1))
	);
}
