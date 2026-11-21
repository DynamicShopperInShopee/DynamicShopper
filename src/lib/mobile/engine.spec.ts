import { describe, it, expect } from 'vitest';
import { initialView, applyInterview, interpret, visibleListings } from './engine';
import { listings } from './shop-data';
import { examples } from './interview-examples';

describe('Sourced-shop presentation boundary', () => {
	it('keeps an explicit price order through interview and chat changes', () => {
		const state = { ...initialView(), order: 'price-high' as const };
		const next = interpret('ขอแบบเรียบๆ', state).state;
		const prices = visibleListings(next, '')
			.map((p) => p.price)
			.filter((price): price is number => price !== null);
		expect(prices).toEqual([...prices].sort((a, b) => b - a));
		expect(next.order).toBe('price-high');
	});
	it('keeps source facts unchanged across interview-driven presentations', () => {
		const before = JSON.stringify(listings);
		examples.forEach(({ answers }) => {
			const view = applyInterview(initialView(), answers);
			for (const p of visibleListings(view, '')) expect(listings).toContain(p);
		});
		expect(JSON.stringify(listings)).toBe(before);
	});
	it('uses the existing interpreter for a local budget ceiling', () => {
		const result = interpret('งบไม่เกิน 500 บาท', initialView());
		expect(result.state.plan.maxPrice).toBe(500);
		expect(visibleListings(result.state, '').every((p) => p.price !== null && p.price <= 500)).toBe(
			true
		);
		expect(visibleListings(result.state, '')).toContain(listings[0]);
	});
	it('questions and deals cannot change the view or expose synthetic references', () => {
		const state = applyInterview(initialView(), { goal: 'compare' });
		for (const message of ['Is this waterproof?', 'best deal', 'รับประกันกี่ปี']) {
			const result = interpret(message, state);
			expect(result.state).toBe(state);
			expect(result).not.toHaveProperty('productIds');
			expect(result).not.toHaveProperty('citations');
		}
	});
	it('preserves an explicit English choice through inferred mom mode', () => {
		const state = initialView();
		state.languageLocked = true;
		state.plan.locale = 'en';
		expect(interpret('for my mom', state).state.plan.locale).toBe('en');
	});
	it('allows an explicit language request to change that choice', () => {
		const state = initialView();
		state.languageLocked = true;
		expect(interpret('in English', state).state.plan.locale).toBe('en');
	});
});
