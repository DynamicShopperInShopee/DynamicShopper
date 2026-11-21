import { describe, expect, it } from 'vitest';
import { products } from '../catalog';
import { defaultPlan } from './plan';
import { rankProducts } from './ranking';
import { inferInterview, interviewProposal } from './interview';

const answers = { goal: 'compare', evidence: 'specs', priority: 'durability', reading: 'large' };

describe('storefront interview proposal', () => {
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
		expect(result.backend).toBe('cnn');
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
	it('rejects hostile heads independently while keeping safe answers and model suggestions', () => {
		const prediction = inferInterview(answers);
		const result = interviewProposal(answers, defaultPlan, {
			infer: () => ({
				...prediction,
				labels: {
					...prediction.labels,
					layout: '<script>',
					details: 'summary',
					sections: '__proto__'
				}
			})
		});
		expect(result.patch.layout).toBe('table');
		expect(result.patch.details).toContain('summary');
		expect(result.patch.sections).toEqual(['what-matters', 'products']);
		expect(result.dropped).toEqual(['layout', 'sections']);
		expect(result.patch).not.toHaveProperty('price');
	});
	it('preserves explicit themes and keeps partial or failed inference usable', () => {
		const plan = { ...structuredClone(defaultPlan), theme: 'minimal' as const };
		const full = { goal: 'browse', evidence: 'photos', priority: 'value', reading: 'spacious' };
		expect(interviewProposal(full, plan, { themeLocked: true }).patch).not.toHaveProperty('theme');
		const partial = interviewProposal({ goal: 'compare', evidence: '<script>' }, plan);
		expect(partial.backend).toBe('incomplete');
		expect(partial.patch.layout).toBe('table');
		expect(partial.patch).not.toHaveProperty('details');
		const failed = interviewProposal(full, plan, {
			infer: () => {
				throw new Error('unavailable');
			}
		});
		expect(failed.backend).toBe('unavailable');
		expect(failed.patch.layout).toBe('grid');
		expect(failed.patch.details).toContain('image');
	});
});
