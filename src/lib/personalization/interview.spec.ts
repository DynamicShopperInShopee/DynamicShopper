import { describe, expect, it } from 'vitest';
import { products } from '../catalog';
import { defaultPlan } from './plan';
import { interview, interviewProposal, inferInterview, sanitizeAnswers } from './interview';

describe('interview proposals on the main catalog', () => {
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
			if (Object.keys(input).length < 4) expect(result.backend).toBe('incomplete');
			expect(result.dropped).toEqual([]);
		}
		expect(plan.query).toBe('rice cooker');
		expect(plan.maxPrice).toBe(1500);
		expect(JSON.stringify(products)).toBe(before);
	});
	it('drops hostile answers independently and leaves skipped settings alone', () => {
		expect(sanitizeAnswers({ goal: 'compare', reading: '<script>', price: 1 })).toEqual({
			goal: 'compare'
		});
		expect(interviewProposal({}, defaultPlan).patch).toEqual({});
		const result = interviewProposal({ goal: 'compare', price: 1 }, defaultPlan);
		expect(result.patch.layout).toBe('table');
		expect(result.patch.theme).toBeUndefined();
		expect(result.patch.details).toBeUndefined();
	});
	it('protects a theme lock while applying independent model heads', () => {
		const answers = {
			goal: 'browse',
			evidence: 'photos',
			priority: 'value',
			reading: 'comfortable'
		};
		const prediction = inferInterview(answers);
		const result = interviewProposal(
			answers,
			{ ...defaultPlan, theme: 'minimal' },
			{
				themeLocked: true,
				infer: () => ({
					...prediction,
					labels: { ...prediction.labels, theme: 'vibrant' },
					themeScore: 1
				})
			}
		);
		expect(result.backend).toBe('cnn');
		expect(result.patch.theme).toBeUndefined();
		expect(result.patch.layout).toBeDefined();
	});
	it('falls back per invalid head and fully on inference failure', () => {
		const answers = { goal: 'compare', evidence: 'specs', priority: 'value', reading: 'large' };
		const prediction = inferInterview(answers);
		const poisoned = interviewProposal(answers, defaultPlan, {
			infer: () => ({ ...prediction, labels: { ...prediction.labels, layout: '<script>' } })
		});
		expect(poisoned.patch.layout).toBe('table');
		expect(poisoned.dropped).toContain('layout');
		expect(poisoned.patch.theme).toBe('large-print');
		const failed = interviewProposal(answers, defaultPlan, {
			infer: () => {
				throw new Error('Unavailable');
			}
		});
		expect(failed.backend).toBe('unavailable');
		expect(failed.patch).toEqual(
			interviewProposal(answers, defaultPlan, { directOnly: true }).patch
		);
	});
});
