import { getShop, specs, type Locale } from '../catalog';
import { defaultPlan, priorities, type ShopperPlan } from '../personalization/plan';
import { assistantCopy, rankingTerms } from './copy';
import { describePlanChanges } from './describePlanChanges';

type PreferenceField = keyof ShopperPlan;

export type PreferenceChip = {
	id: string;
	field: PreferenceField;
	label: string;
	patch: Partial<ShopperPlan>;
	resetField: boolean;
};

const presentationFields = [
	'theme',
	'layout',
	'density',
	'locale',
	'details',
	'highlightedSpecs',
	'query',
	'category',
	'maxPrice',
	'mallOnly',
	'simplified',
	'sections'
] as const satisfies readonly PreferenceField[];

const specKeys = [
	...new Set(Object.values(specs).flatMap((definitions) => definitions.map(({ key }) => key)))
];

function currentLabel(change: string): string {
	const separator = ' → ';
	const after = change.indexOf(separator);
	if (after === -1) return change;
	return change.slice(0, change.indexOf(' · ')) + ' · ' + change.slice(after + separator.length);
}

function matchesDefault(field: (typeof presentationFields)[number], plan: ShopperPlan): boolean {
	const value = plan[field];
	const initial = defaultPlan[field];
	return Array.isArray(value) && Array.isArray(initial)
		? value.length === initial.length && value.every((item, index) => item === initial[index])
		: value === initial;
}

function presentationLabel(
	field: (typeof presentationFields)[number],
	plan: ShopperPlan,
	locale: Locale
): string | undefined {
	if (field === 'query') return `${assistantCopy[locale].query} · ${plan.query}`;
	const [change] = describePlanChanges(
		defaultPlan,
		{ ...defaultPlan, [field]: plan[field] },
		locale
	);
	return change && currentLabel(change);
}

export function derivePreferenceChips(plan: ShopperPlan, locale: Locale): PreferenceChip[] {
	const chips: PreferenceChip[] = [];

	for (const field of presentationFields) {
		if (matchesDefault(field, plan)) continue;
		const label = presentationLabel(field, plan, locale);
		if (label) {
			chips.push({
				id: field,
				field,
				label,
				patch: { [field]: defaultPlan[field] },
				resetField: true
			});
		}
	}

	const shopLabel = locale === 'th' ? 'ร้านค้า' : 'Shops';
	for (const id of new Set(plan.shops)) {
		const shop = getShop(id);
		if (!shop) continue;
		const shops = plan.shops.filter((value) => value !== id);
		chips.push({
			id: `shops:${id}`,
			field: 'shops',
			label: `${shopLabel} · ${shop.name[locale]}`,
			patch: { shops },
			resetField: shops.length === 0
		});
	}

	for (const key of priorities) {
		const value = plan.priorities[key];
		const initial = defaultPlan.priorities[key];
		if (value === initial) continue;
		const restored = { ...plan.priorities };
		if (initial === undefined) delete restored[key];
		else restored[key] = initial;
		const [change] = describePlanChanges(
			defaultPlan,
			{ ...defaultPlan, priorities: { ...defaultPlan.priorities, [key]: value } },
			locale
		);
		const fallback = `${assistantCopy[locale].priorities} · ${rankingTerms[key][locale === 'th' ? 1 : 0]}`;
		chips.push({
			id: `priorities:${key}`,
			field: 'priorities',
			label: change ?? fallback,
			patch: { priorities: restored },
			resetField: priorities.every(
				(priority) => restored[priority] === defaultPlan.priorities[priority]
			)
		});
	}

	for (const key of specKeys) {
		const value = plan.specPreferences[key];
		if (!value) continue;
		const [change] = describePlanChanges(
			defaultPlan,
			{ ...defaultPlan, specPreferences: { [key]: value } },
			locale
		);
		const restored = { ...plan.specPreferences };
		delete restored[key];
		chips.push({
			id: `specPreferences:${key}`,
			field: 'specPreferences',
			label: currentLabel(change),
			patch: { specPreferences: restored },
			resetField: specKeys.every((spec) => restored[spec] === undefined)
		});
	}

	return chips;
}
