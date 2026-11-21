import type { Product } from '../catalog/index.ts';
import { findShop, specDefinition, type CatalogPort } from './catalog-port.ts';
import { priorityLabels } from './labels.ts';
import { matchProducts } from './plan.ts';
import { PRIORITIES, type Localized, type Plan, type Priority, type SpecKey } from './types.ts';

export type RankTerm = Readonly<{
	id: Priority | `spec:${SpecKey}`;
	label: Localized;
	/** weight × 0–1 measure. Used for ordering; UIs show it only as one of four bar widths. */
	contribution: number;
}>;

export type RankedProduct = Readonly<{
	product: Product;
	score: number;
	/** The exact terms summed into `score`, largest first. */
	terms: readonly RankTerm[];
}>;

const scale = (value: number, min: number, max: number) =>
	max === min ? 0 : (value - min) / (max - min);

function range(values: readonly number[]): [number, number] {
	return values.length === 0 ? [0, 0] : [Math.min(...values), Math.max(...values)];
}

function numericSpec(product: Product, key: SpecKey): number | undefined {
	const value = product.specs[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Deterministic, explainable ranking. Filter, score as a sum of weighted 0–1 measures
 * normalised within the filtered set, order with stable tie-breaks, then simplify.
 * The AI only ever sets priorities; it never orders products.
 */
export function rankProducts(catalog: CatalogPort, plan: Plan): RankedProduct[] {
	const eligible = matchProducts(catalog, plan.filters, plan.query);
	const [minPrice, maxPrice] = range(eligible.map((product) => product.price));
	const [minRating, maxRating] = range(eligible.map((product) => product.rating));
	const specRanges = new Map(
		plan.specPrefs.map((pref) => [
			pref.key,
			range(
				eligible
					.map((product) => numericSpec(product, pref.key))
					.filter((value): value is number => value !== undefined)
			)
		])
	);

	const ranked = eligible.map((product): RankedProduct => {
		const terms: RankTerm[] = [];
		for (const priority of PRIORITIES) {
			const weight = plan.priorities[priority];
			if (!weight) continue;
			let measure: number;
			if (priority === 'price') measure = 1 - scale(product.price, minPrice, maxPrice);
			else if (priority === 'rating') measure = scale(product.rating, minRating, maxRating);
			else measure = product.scores[priority];
			if (maxPrice === minPrice && priority === 'price') measure = 0;
			terms.push({ id: priority, label: priorityLabels[priority], contribution: weight * measure });
		}
		for (const pref of plan.specPrefs) {
			const definition = specDefinition(catalog, product.category, pref.key);
			const value = numericSpec(product, pref.key);
			const [min, max] = specRanges.get(pref.key) ?? [0, 0];
			// A missing numeric spec contributes nothing rather than guessing.
			let measure = value === undefined ? 0 : scale(value, min, max);
			if (value !== undefined && pref.direction === 'lower' && max !== min) measure = 1 - measure;
			terms.push({
				id: `spec:${pref.key}`,
				label: definition?.label ?? { en: pref.key, th: pref.key },
				contribution: measure
			});
		}
		terms.sort((a, b) => b.contribution - a.contribution || compareText(a.id, b.id));
		const score = terms.reduce((sum, term) => sum + term.contribution, 0);
		return { product, score, terms };
	});

	ranked.sort(
		(a, b) =>
			b.score - a.score ||
			(findShop(catalog, b.product.shopId)?.rating ?? 0) -
				(findShop(catalog, a.product.shopId)?.rating ?? 0) ||
			compareText(a.product.name.en, b.product.name.en) ||
			compareText(a.product.id, b.product.id)
	);
	return plan.simplified ? ranked.slice(0, 3) : ranked;
}

export type ExplanationBar = Readonly<{ label: Localized; width: 1 | 2 | 3 | 4 }>;

/**
 * "Why this order?": the three biggest terms the score actually summed, as bars in four width
 * steps relative to the largest. No digits. Not offered for a lone product or simplified mode.
 */
export function explainRank(ranked: RankedProduct, count = 3): ExplanationBar[] {
	const top = ranked.terms.filter((term) => term.contribution > 0).slice(0, count);
	const largest = top[0]?.contribution ?? 0;
	return top.map((term) => ({
		label: term.label,
		width: Math.max(1, Math.min(4, Math.ceil((term.contribution / largest) * 4))) as 1 | 2 | 3 | 4
	}));
}
