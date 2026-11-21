import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { inferInterview, interviewProposal, type Head } from '../personalization/interview';
import {
	initialView,
	applyInterview,
	removeInterviewPreference,
	resetView,
	interpret
} from './engine';
import { previewInterview, examples } from './interview-examples';
import { listings } from './shop-data';

const reference = JSON.parse(
	readFileSync(
		new URL('../../../experiments/interview-cnn/results/browser-reference.json', import.meta.url),
		'utf8'
	)
) as {
	answers: Record<string, string>;
	logits: Record<Head, number[]>;
}[];
const answers = { goal: 'compare', evidence: 'specs', priority: 'durability', reading: 'large' };

describe('live interview CNN', () => {
	it('uses CNN layout, information and section heads, not just its theme', () => {
		const prediction = inferInterview(answers);
		const result = interviewProposal(answers, initialView().plan, {
			infer: () => ({
				...prediction,
				labels: { ...prediction.labels, layout: 'list', details: 'reviews', sections: 'gift' }
			})
		});
		expect(result.patch.layout).toBe('list');
		expect(result.patch.details).toContain('reviews');
		expect(result.patch.details).not.toContain('specs');
		expect(result.patch.sections).toEqual(['top-picks', 'reviews', 'products']);
		expect(result.patch.theme).toBe('large-print');
		expect(result.patch.density).toBe('spacious');
	});
	it('previews use independent neutral baselines without mutating answers', () => {
		const original = JSON.stringify(examples);
		const plans = examples.map((example) => previewInterview(example.answers, 'th').plan);
		expect(plans.map((p) => p.layout)).toEqual(['grid', 'table', 'list']);
		expect(plans.map((p) => p.theme)).toEqual(['vibrant', 'minimal', 'large-print']);
		expect(JSON.stringify(examples)).toBe(original);
	});
	it('rejects poisoned presentation heads independently and keeps safe fallbacks', () => {
		const prediction = inferInterview(answers);
		const result = interviewProposal(answers, initialView().plan, {
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
		expect(result.patch.sections).toEqual(['what-matters', 'products']);
		expect(result.patch.details).toContain('summary');
		expect(result.sources.details).toBe('cnn');
		expect(result.sources.layout).toBe('answer');
		expect(result.dropped).toEqual(['layout', 'sections']);
	});
	it('drops a poisoned CNN theme while keeping direct answers', () => {
		const prediction = inferInterview(answers);
		const result = interviewProposal({ ...answers, reading: 'comfortable' }, initialView().plan, {
			infer: () => ({
				...prediction,
				labels: { ...prediction.labels, theme: '<script>price=1</script>' },
				themeScore: 1
			})
		});
		expect(result.patch.theme).toBeUndefined();
		expect(result.patch.layout).toBe('table');
		expect(result.dropped).toContain('theme');
	});
	it('matches PyTorch logits on every complete answer combination', () => {
		for (const sample of reference) {
			const actual = inferInterview(sample.answers);
			for (const head of Object.keys(sample.logits) as Head[])
				sample.logits[head].forEach((value, i) =>
					expect(actual.logits[head][i]).toBeCloseTo(value, 4)
				);
		}
	});
	it('applies explicit answers atomically without changing the source facts or language', () => {
		const original = JSON.stringify(listings);
		const before = initialView();
		const next = applyInterview(before, answers);
		expect(next.plan).toMatchObject({
			theme: 'large-print',
			layout: 'table',
			density: 'spacious',
			locale: 'th'
		});
		expect(next.interview?.backend).toBe('cnn');
		expect(before.plan.layout).toBe('grid');
		expect(JSON.stringify(listings)).toBe(original);
		expect(applyInterview(next, answers)).toBe(next);
	});
	it('can remove a preference and reset without changing an explicit language', () => {
		const before = initialView();
		before.plan.locale = 'en';
		before.languageLocked = true;
		const next = applyInterview(before, answers);
		const removed = removeInterviewPreference(next, 'layout');
		expect(removed.plan.layout).toBe(before.plan.layout);
		expect(removed.plan.theme).toBe('large-print');
		expect(resetView(next).plan.locale).toBe('en');
		expect(resetView(next).interview).toBeNull();
	});
	it('remembers direct-only mode when the accepted recipe already matches the store', () => {
		const state = applyInterview(initialView(), answers);
		const next = applyInterview(state, answers, true);
		expect(next.plan).toEqual(state.plan);
		expect(next.interviewDirectOnly).toBe(true);
		expect(next.interview?.backend).toBe('direct');
		expect(next.interview?.before).toEqual(state.interview?.before);
		expect(next.interview?.applied).toEqual(state.interview?.applied);
		expect(applyInterview(next, answers, true)).toBe(next);
	});
	it('retains explicit reading and inference controls without inventing a presentation change', () => {
		const state = initialView();
		state.plan.theme = 'large-print';
		state.plan.density = 'spacious';
		const next = applyInterview(state, { reading: 'large' }, true);
		expect(next.plan).toEqual(state.plan);
		expect(next.themeLocked).toBe(true);
		expect(next.interviewDirectOnly).toBe(true);
		expect(next.interview?.answers).toEqual({ reading: 'large' });
		expect(applyInterview(next, {}, false).interviewDirectOnly).toBe(false);
		expect(resetView(next).interviewDirectOnly).toBe(false);
	});
	it('keeps unrelated explicit themes through later CNN suggestions and chat', () => {
		const before = initialView();
		before.themeLocked = true;
		before.plan.theme = 'minimal';
		const next = applyInterview(before, { ...answers, reading: 'comfortable', evidence: 'photos' });
		expect(next.plan.theme).toBe('minimal');
		expect(interpret('for my mom', next).state.plan.theme).toBe('minimal');
	});
	it('preserves skipped fields and works when the model is disabled or broken', () => {
		const before = initialView();
		const result = interviewProposal(
			{ goal: 'compare', reading: '<script>', price: 1 },
			before.plan
		);
		expect(result.patch).toEqual({ layout: 'table', sections: ['what-matters', 'products'] });
		expect(result.backend).toBe('incomplete');
		const fallback = interviewProposal(answers, before.plan, {
			infer: () => {
				throw new Error('unavailable');
			}
		});
		expect(fallback.backend).toBe('unavailable');
		expect(fallback.patch.theme).toBe('large-print');
		expect(interviewProposal(answers, before.plan, { directOnly: true }).backend).toBe('direct');
		expect(applyInterview(before, {}).plan).toEqual(before.plan);
		expect(applyInterview(before, {}).interview?.backend).toBe('incomplete');
	});
});
