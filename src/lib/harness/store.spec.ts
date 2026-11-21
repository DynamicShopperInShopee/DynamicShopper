import { describe, expect, it } from 'vitest';
import { defaultCatalog as catalog } from './catalog-port.ts';
import { partValue, sameValue, standardPlan } from './plan.ts';
import {
	MAX_UNDO,
	applyPatch,
	applyPersona,
	initialState,
	removeChip,
	reset,
	undo,
	withContext,
	type Transition
} from './store.ts';
import { isValidPlan } from './test-helpers.ts';
import type { StoreState } from './types.ts';

type Event = Readonly<{
	name: string;
	kind: 'inferred' | 'explicit' | 'undo' | 'reset' | 'chip';
	run: (state: StoreState) => Transition;
}>;

const events: readonly Event[] = [
	{
		name: 'infer theme minimal',
		kind: 'inferred',
		run: (s) => applyPatch(s, { theme: 'minimal' }, 'inferred', catalog)
	},
	{
		name: 'infer language th',
		kind: 'inferred',
		run: (s) => applyPatch(s, { language: 'th' }, 'inferred', catalog)
	},
	{
		name: 'infer mom persona',
		kind: 'inferred',
		run: (s) => applyPersona(s, 'mom', {}, 'inferred', catalog)
	},
	{ name: 'infer nothing', kind: 'inferred', run: (s) => applyPatch(s, {}, 'inferred', catalog) },
	{
		name: 'set theme vibrant',
		kind: 'explicit',
		run: (s) => applyPatch(s, { theme: 'vibrant' }, 'explicit', catalog)
	},
	{
		name: 'set language en',
		kind: 'explicit',
		run: (s) => applyPatch(s, { language: 'en' }, 'explicit', catalog)
	},
	{
		name: 'set category rice cooker',
		kind: 'explicit',
		run: (s) => applyPatch(s, { filters: { category: 'rice-cooker' } }, 'explicit', catalog)
	},
	{
		name: 'infer category earbuds',
		kind: 'inferred',
		run: (s) => applyPatch(s, { filters: { category: 'earbuds' } }, 'inferred', catalog)
	},
	{
		name: 'set search wireless',
		kind: 'explicit',
		run: (s) => applyPatch(s, { query: 'wireless' }, 'explicit', catalog)
	},
	{ name: 'undo', kind: 'undo', run: (s) => undo(s) },
	{ name: 'reset', kind: 'reset', run: (s) => reset(s) },
	{ name: 'remove theme chip', kind: 'chip', run: (s) => removeChip(s, 'theme', catalog) }
];

const planChanged = (a: StoreState, b: StoreState) => !sameValue(a.plan, b.plan);

describe('R2 + R3 · bounded exhaustive exploration of store events (depth 4)', () => {
	it('every reachable transition keeps the undo, reset and explicit-wins invariants', () => {
		const outcomes = new Map<string, Set<'changed' | 'unchanged'>>();
		let transitions = 0;
		let explicitBlocks = 0;
		let undoRoundTrips = 0;

		const check = (prev: StoreState, event: Event, depth: number) => {
			const { state: next, dropped } = event.run(prev);
			transitions += 1;
			const changed = planChanged(prev, next);
			const seen = outcomes.get(event.name) ?? new Set();
			seen.add(changed ? 'changed' : 'unchanged');
			outcomes.set(event.name, seen);

			expect(isValidPlan(next.plan)).toBe(true);
			expect(next.undo.length).toBeLessThanOrEqual(MAX_UNDO);

			if (event.kind === 'undo') {
				const top = prev.undo.at(-1);
				if (top) {
					expect(next.plan).toEqual(top.plan);
					expect(next.explicit).toEqual(top.explicit);
					expect(next.undo.length).toBe(prev.undo.length - 1);
				} else {
					expect(next.plan).toEqual(prev.plan);
					expect(next.undo).toEqual(prev.undo);
				}
			} else if (event.kind === 'reset') {
				expect(next.plan).toEqual(standardPlan);
				expect(next.explicit).toEqual(changed ? [] : prev.explicit);
				expect(next.undo.length).toBe(
					changed ? Math.min(prev.undo.length + 1, MAX_UNDO) : prev.undo.length
				);
			} else {
				// One undo step per effective change; a no-op records nothing.
				if (changed) {
					expect(next.undo.length).toBe(Math.min(prev.undo.length + 1, MAX_UNDO));
					expect(next.undo.at(-1)).toEqual({ plan: prev.plan, explicit: prev.explicit });
					// Undo after a change restores exactly the state before it.
					const back = undo(next).state;
					expect(back.plan).toEqual(prev.plan);
					expect(back.explicit).toEqual(prev.explicit);
					undoRoundTrips += 1;
				} else expect(next.undo).toEqual(prev.undo);
			}

			if (event.kind === 'inferred') {
				// R3: inference never changes a part the shopper set, nor the explicit set itself.
				for (const part of prev.explicit)
					expect(partValue(next.plan, part)).toEqual(partValue(prev.plan, part));
				expect(next.explicit).toEqual(prev.explicit);
				if (dropped.some((d) => d.code === 'explicit_wins')) explicitBlocks += 1;
			}

			if (depth < 4) for (const following of events) check(next, following, depth + 1);
		};
		for (const event of events) check(initialState(), event, 1);

		expect(transitions).toBe(12 + 12 ** 2 + 12 ** 3 + 12 ** 4);
		// Trigger reachability: every event both changed and left the plan alone somewhere,
		// except "infer nothing", which can only be a no-op.
		for (const event of events) {
			const seen = outcomes.get(event.name);
			if (event.name === 'infer nothing') expect([...(seen ?? [])]).toEqual(['unchanged']);
			else expect(seen?.size, event.name).toBe(2);
		}
		expect(explicitBlocks).toBeGreaterThan(0);
		expect(undoRoundTrips).toBeGreaterThan(1000);
	});
});

describe('R2 · store transitions', () => {
	it('records one undo step per effective change and none for a no-op', () => {
		const a = applyPatch(initialState(), { theme: 'minimal' }, 'inferred', catalog).state;
		const b = applyPatch(a, { theme: 'minimal' }, 'inferred', catalog).state;
		expect(a.undo).toHaveLength(1);
		expect(b.undo).toHaveLength(1);
		expect(b).toEqual(a);
	});

	it('caps the undo history', () => {
		let state = initialState();
		for (let i = 0; i < MAX_UNDO + 5; i++)
			state = applyPatch(
				state,
				{ theme: i % 2 ? 'minimal' : 'vibrant' },
				'inferred',
				catalog
			).state;
		expect(state.undo).toHaveLength(MAX_UNDO);
	});

	it('removing a chip reverts exactly that part and hands it back to inference', () => {
		let state = applyPatch(
			initialState(),
			{ theme: 'vibrant', layout: 'list' },
			'explicit',
			catalog
		).state;
		state = removeChip(state, 'theme', catalog).state;
		expect(state.plan.theme).toBe('standard');
		expect(state.plan.layout).toBe('list');
		expect(state.explicit).not.toContain('theme');
		expect(applyPatch(state, { theme: 'minimal' }, 'inferred', catalog).state.plan.theme).toBe(
			'minimal'
		);
	});

	it('a direct language choice survives inference', () => {
		const state = applyPatch(initialState(), { language: 'th' }, 'explicit', catalog).state;
		const result = applyPatch(state, { language: 'en', theme: 'minimal' }, 'inferred', catalog);
		expect(result.state.plan.language).toBe('th');
		expect(result.state.plan.theme).toBe('minimal');
		expect(result.dropped).toContainEqual({ place: 'language', code: 'explicit_wins' });
	});

	it('an explicit choice that changes nothing records nothing (spec state table)', () => {
		const state = applyPatch(initialState(), { language: 'en' }, 'explicit', catalog).state;
		expect(state).toEqual(initialState());
		expect(reset(initialState()).state).toEqual(initialState());
	});

	it('an inferred category change may not wipe search words the shopper typed', () => {
		const typed = applyPatch(initialState(), { query: 'wireless' }, 'explicit', catalog).state;
		const result = applyPatch(
			typed,
			{ filters: { category: 'earbuds' }, theme: 'minimal' },
			'inferred',
			catalog
		);
		expect(result.state.plan.query).toBe('wireless');
		expect(result.state.plan.filters.category).toBeNull();
		expect(result.state.plan.theme).toBe('minimal');
		expect(result.dropped).toContainEqual({ place: 'filters.category', code: 'explicit_wins' });
	});

	it('changing category clears old search words and specs the new category lacks', () => {
		let state = applyPatch(
			initialState(),
			{
				query: 'lightweight',
				filters: { category: 'mouse' },
				specPrefs: [
					{ key: 'battery', direction: 'higher' },
					{ key: 'dpi', direction: 'higher' }
				]
			},
			'explicit',
			catalog
		).state;
		state = applyPatch(state, { filters: { category: 'earbuds' } }, 'explicit', catalog).state;
		expect(state.plan.query).toBe('');
		expect(state.plan.specPrefs).toEqual([{ key: 'battery', direction: 'higher' }]);
	});

	it('reduces untrusted focus, cart and viewed lists to known, unique, capped ids', () => {
		const state = withContext(
			initialState(),
			{
				focus: ['aero-x', 'nope', 'aero-x', 'nova-lite', 'vortex-w', 'titan-max'],
				cart: [1, 'playlite']
			},
			catalog
		);
		expect(state.focus).toEqual(['nova-lite', 'vortex-w', 'titan-max']);
		expect(state.cart).toEqual(['playlite']);
	});
});
