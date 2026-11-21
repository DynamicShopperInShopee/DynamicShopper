import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import InterviewCompare from './InterviewCompare.svelte';
import { applyInterview, initialView, interpret } from './engine';
import { listings } from './shop-data';

describe('interview-led shopper presentation', () => {
	it('keeps comparison examples demonstration-only, with no action to select a store view', () => {
		const html = render(InterviewCompare, {
			props: { lang: 'en', rows: listings, categories: [], onclose: () => {} }
		}).body;
		expect(html).toContain('data-example="A"');
		expect(html).toContain('data-example="B"');
		expect(html).toContain('data-example="C"');
		expect(html).not.toContain('Use this view');
		expect(html).not.toContain('use-view');
		expect(html).toContain('These examples do not change your shop');
	});
	it('records completion even when answers already match the presentation', () => {
		const state = initialView();
		const next = applyInterview(state, { reading: 'comfortable' });
		expect(next.plan).toEqual(state.plan);
		expect(next.interview?.answers).toEqual({ reading: 'comfortable' });
		expect(next.interview?.applied).toEqual({});
		expect(applyInterview(next, { reading: 'comfortable' })).toBe(next);
	});
	it('preserves a theme chosen in chat through a later family request', () => {
		const chosen = interpret('minimal', initialView()).state;
		expect(interpret('for my mother', chosen).state.plan.theme).toBe('minimal');
	});
	it('keeps a theme explicitly changed in chat after the prior interview', () => {
		const first = applyInterview(initialView(), {
			goal: 'compare',
			evidence: 'specs',
			priority: 'durability',
			reading: 'large'
		});
		const changed = interpret('minimal', first).state;
		expect(changed.plan.theme).toBe('minimal');
		const next = applyInterview(changed, {
			goal: 'browse',
			evidence: 'photos',
			priority: 'value',
			reading: 'spacious'
		});
		expect(next.plan.theme).toBe('minimal');
	});
	it('lets a new reading answer replace the large-print preference from a prior interview', () => {
		const before = initialView();
		const first = applyInterview(before, {
			goal: 'compare',
			evidence: 'specs',
			priority: 'durability',
			reading: 'large'
		});
		const next = applyInterview(first, {
			goal: 'browse',
			evidence: 'photos',
			priority: 'value',
			reading: 'spacious'
		});
		expect(first.plan.theme).toBe('large-print');
		expect(next.plan.theme).toBe(before.plan.theme);
		expect(next.plan.layout).toBe('grid');
		expect(next.themeLocked).toBe(false);
		expect(before.plan.theme).toBe('standard');
	});
});
