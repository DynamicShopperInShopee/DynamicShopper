import { describe, expect, it } from 'vitest';
import { products } from '../catalog';
import { defaultPlan } from './plan';
import { rankProducts } from './ranking';
import { interview, interviewProposal } from './interview';

const answers = { goal: 'compare', evidence: 'specs', priority: 'durability', reading: 'large' };

describe('storefront interview proposal', () => {
	it.each(['comfortable', 'compact', 'spacious'])(
		'lets a shopper leave large text by explicitly choosing %s',
		(reading) => {
			const plan = {
				...structuredClone(defaultPlan),
				theme: 'large-print' as const,
				density: 'spacious' as const
			};
			const result = interviewProposal({ reading }, plan);
			expect({ ...plan, ...result.patch }).toMatchObject({ theme: 'standard', density: reading });
			expect(interviewProposal({}, plan).patch).toEqual({});
		}
	);
	it('keeps facts and search context unchanged for every complete or skipped combination', () => {
		const before = JSON.stringify(products);
		const plan = { ...structuredClone(defaultPlan), query: 'rice cooker', maxPrice: 1500 };
		let inputs: Record<string, string>[] = [{}];
		for (const q of interview.questions)
			inputs = inputs.flatMap((input) => [
				input,
				...q.options.map((o) => ({ ...input, [q.id]: o.id }))
			]);
		expect(inputs).toHaveLength(625);
		for (const input of inputs) {
			const result = interviewProposal(input, plan);
			expect(
				Object.keys(result.patch).every((k) =>
					['theme', 'layout', 'density', 'details', 'sections', 'priorities'].includes(k)
				)
			).toBe(true);
			if (result.patch.sections) expect(result.patch.sections).toContain('products');
			if (result.patch.details) expect(result.patch.details).toContain('price');
			if (input.reading === 'large')
				expect(result.patch).toMatchObject({ theme: 'large-print', density: 'spacious' });
			const chosen = Object.entries(input).map(
				([question, answer]) => interviewProposal({ [question]: answer }, plan).patch
			);
			expect(result.patch).toEqual(Object.assign({}, ...chosen));
			expect(result.dropped).toEqual([]);
		}
		expect(plan.query).toBe('rice cooker');
		expect(plan.maxPrice).toBe(1500);
		expect(JSON.stringify(products)).toBe(before);
	});
	it('composes catalog-backed views without changing filters, language, or facts', () => {
		const before = JSON.stringify(products);
		const plan = {
			...structuredClone(defaultPlan),
			category: 'rice-cooker' as const,
			maxPrice: 1600,
			locale: 'th' as const
		};
		const result = interviewProposal(answers, plan);
		const next = { ...plan, ...result.patch };
		expect(next.layout).toBe('table');
		expect(next.theme).toBe('large-print');
		expect(next.density).toBe('spacious');
		expect(next.details).toContain('specs');
		expect(next.locale).toBe('th');
		expect(next.maxPrice).toBe(1600);
		const ranked = rankProducts(products, next);
		expect(ranked.length).toBeGreaterThan(0);
		expect(
			ranked.every(({ product }) => product.category === 'rice-cooker' && product.price <= 1600)
		).toBe(true);
		expect(JSON.stringify(products)).toBe(before);
	});
	it('keeps valid choices when other answers are unknown and preserves an unselected theme', () => {
		const plan = { ...defaultPlan, theme: 'minimal' as const };
		const partial = interviewProposal({ goal: 'compare', evidence: 'unknown' }, plan);
		expect(partial.answers).toEqual({ goal: 'compare' });
		expect(partial.patch.layout).toBe('table');
		expect(partial.patch).not.toHaveProperty('details');
		const full = { goal: 'browse', evidence: 'photos', priority: 'value', reading: 'spacious' };
		expect(interviewProposal(full, plan).patch).not.toHaveProperty('theme');
		expect(interviewProposal({}, plan).patch).toEqual({});
	});
});
