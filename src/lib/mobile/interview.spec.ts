import { describe, expect, it } from 'vitest';
import { interviewProposal } from '../personalization/interview';
import {
	initialView,
	applyInterview,
	removeInterviewPreference,
	resetView,
	interpret
} from './engine';
import { previewInterview, examples } from './interview-examples';
import { listings } from './shop-data';

const answers = { goal: 'compare', evidence: 'specs', priority: 'durability', reading: 'large' };

describe('sourced-shop interview', () => {
	it('maps a complete interview to the selected fields and leaves other settings intact', () => {
		const state = initialView();
		state.plan.theme = 'minimal';
		const result = applyInterview(state, { ...answers, reading: 'compact' });
		expect(result.plan).toMatchObject({ theme: 'minimal', layout: 'table', density: 'compact' });
		expect(result.plan.details).toContain('specs');
		expect(result.plan.priorities.durability).toBe(1);
		expect(result.plan.locale).toBe(state.plan.locale);
	});
	it('previews use independent neutral baselines without mutating answers', () => {
		const original = JSON.stringify(examples);
		const plans = examples.map((example) => previewInterview(example.answers, 'th').plan);
		expect(plans.map((p) => p.layout)).toEqual(['grid', 'table', 'list']);
		expect(plans.map((p) => p.theme)).toEqual(['standard', 'standard', 'large-print']);
		expect(JSON.stringify(examples)).toBe(original);
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
	it('keeps an explicit theme through unrelated interview choices and chat', () => {
		const before = initialView();
		before.themeLocked = true;
		before.plan.theme = 'minimal';
		const next = applyInterview(before, { ...answers, reading: 'comfortable', evidence: 'photos' });
		expect(next.plan.theme).toBe('minimal');
		expect(interpret('for my mom', next).state.plan.theme).toBe('minimal');
	});
	it('applies a recognized answer independently of skipped and unrecognized fields', () => {
		const before = initialView();
		const result = interviewProposal(
			{ goal: 'compare', reading: 'invalid', price: 1 },
			before.plan
		);
		expect(result.patch).toEqual({ layout: 'table', sections: ['what-matters', 'products'] });
		expect(applyInterview(before, {}).plan).toEqual(before.plan);
	});
});
