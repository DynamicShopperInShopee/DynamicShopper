import { describe, expect, it } from 'vitest';
import { optimizeDeal, DEFAULT_COIN_BALANCE } from '../pricing/index.ts';
import { defaultCatalog as catalog } from './catalog-port.ts';
import { mergePlan, standardPlan } from './plan.ts';
import { rankProducts } from './ranking.ts';
import { applyPatch, initialState } from './store.ts';
import { handleTurn, resolveBasket } from './turn.ts';
import type { StoreState } from './types.ts';

const clock = { openedAt: 1_800_000_000_000, now: 1_800_000_000_000 + 60_000 };
const deps = { catalog, clock };
const shaped: StoreState = {
	...applyPatch(
		initialState(),
		{
			theme: 'minimal',
			filters: { category: 'mouse' },
			specPrefs: [{ key: 'battery', direction: 'higher' }]
		},
		'explicit',
		catalog
	).state,
	focus: ['aero-x']
};
const order = (state: StoreState) => rankProducts(catalog, state.plan).map((row) => row.product.id);
const model = (envelope: unknown, citable: string[] = []) => ({ remote: { envelope, citable } });

describe('R6 · a question never changes the store; it cites or declines', () => {
	it('ignores a patch attached to a question and keeps plan, explicit set, undo and rank', () => {
		const result = handleTurn(
			shaped,
			{
				message: 'does it last all day?',
				...model(
					{
						intent: 'ask',
						patch: { theme: 'vibrant', filters: { category: 'earbuds' } },
						citations: [{ productId: 'aero-x', kind: 'spec', key: 'battery' }],
						reply: 'Here is what the listing says about the battery.'
					},
					['aero-x']
				)
			},
			deps
		);
		expect(result.backend).toBe('model');
		expect(result.state.plan).toEqual(shaped.plan);
		expect(result.state.explicit).toEqual(shaped.explicit);
		expect(result.state.undo).toEqual(shaped.undo);
		expect(result.ranked.map((row) => row.product.id)).toEqual(order(shaped));
		expect(result.turn).toMatchObject({
			intent: 'ask',
			citations: [{ productId: 'aero-x', kind: 'spec', key: 'battery' }]
		});
		expect(result.trace.dropped).toContainEqual({ place: 'intent', code: 'ignored_for_intent' });
	});

	it('drops citations to products not read this turn and to parts that do not exist', () => {
		const result = handleTurn(
			shaped,
			{
				message: 'is it light?',
				...model(
					{
						intent: 'ask',
						citations: [
							{ productId: 'titan-max', kind: 'spec', key: 'weight' },
							{ productId: 'aero-x', kind: 'spec', key: 'waterproof' },
							{ productId: 'aero-x', kind: 'review', key: '7' },
							{ productId: 'ghost', kind: 'summary', key: 'summary' }
						],
						reply: 'Yes, very light.'
					},
					['aero-x']
				)
			},
			deps
		);
		expect(result.turn).toMatchObject({ intent: 'ask', citations: [] });
		expect(result.turn.reply.text).toBe("I can't confirm that from the listing.");
		expect(result.trace.dropped.filter((d) => d.code === 'invalid_citation')).toHaveLength(4);
	});
});

describe('R7 · a deal prices "this" through the shared optimizer and never re-ranks', () => {
	it('resolves named products, else focus, else cart, else asks', () => {
		const state = { ...initialState(), focus: ['aero-x'], cart: ['playlite', 'slimcharge'] };
		expect(resolveBasket(['nova-lite'], state)).toEqual(['nova-lite']);
		expect(resolveBasket([], state)).toEqual(['aero-x']);
		expect(resolveBasket([], { ...state, focus: [] })).toEqual(['playlite', 'slimcharge']);
		expect(resolveBasket([], initialState())).toEqual([]);
	});

	it('returns the optimizer receipt for the resolved basket and leaves the store alone', () => {
		const result = handleTurn(shaped, { message: 'cheapest way to get this?' }, deps);
		expect(result.turn.intent).toBe('find_deal');
		expect(result.basket).toEqual(['aero-x']);
		expect(result.deal).toEqual(
			optimizeDeal([{ productId: 'aero-x', quantity: 1 }], {
				...clock,
				coinBalance: DEFAULT_COIN_BALANCE
			})
		);
		expect(result.state.plan).toEqual(shaped.plan);
		expect(result.ranked.map((row) => row.product.id)).toEqual(order(shaped));
	});

	it('uses named products from the model, dropping unknown ids', () => {
		const result = handleTurn(
			shaped,
			{
				message: 'best price for these',
				...model({ intent: 'find_deal', productIds: ['nova-lite', 'fake'], reply: 'Here you go.' })
			},
			deps
		);
		expect(result.basket).toEqual(['nova-lite']);
		expect(result.trace.dropped).toContainEqual({ place: 'productId', code: 'unknown_product' });
	});

	it('asks which product when there is nothing to price', () => {
		const result = handleTurn(initialState(), { message: 'best deal please' }, deps);
		expect(result.deal).toBeNull();
		expect(result.turn.reply.text).toBe('Which product do you mean?');
	});
});

describe('turn pipeline · store commands and honesty', () => {
	it('undo and reset are performed by the store; a model patch cannot do either', () => {
		const after = handleTurn(
			shaped,
			{
				message: 'undo',
				...model({ intent: 'undo', patch: { theme: 'vibrant' }, reply: 'Done.' })
			},
			deps
		);
		expect(after.state.plan).toEqual(standardPlan);
		expect(after.trace.dropped).toContainEqual({ place: 'intent', code: 'ignored_for_intent' });
		const fresh = handleTurn(
			shaped,
			{ message: 'start over', ...model({ intent: 'reset', reply: 'Back to normal.' }) },
			deps
		);
		expect(fresh.state.plan).toEqual(standardPlan);
		expect(fresh.state.undo).toHaveLength(shaped.undo.length + 1);
	});

	it('says nothing changed when a change request changed nothing', () => {
		const result = handleTurn(
			shaped,
			{
				message: 'minimal',
				...model({ intent: 'restyle', patch: { theme: 'minimal' }, reply: 'Restyled!' })
			},
			deps
		);
		expect(result.changes).toEqual([]);
		expect(result.turn.reply.text).toBe("That's already how the store looks.");
	});

	it('a wholly malformed envelope falls back to the keyword parser', () => {
		for (const envelope of ['not json', { intent: 'hack' }, [1, 2], 42]) {
			const result = handleTurn(
				initialState(),
				{ message: 'make it colourful', ...model(envelope) },
				deps
			);
			expect(result.backend).toBe('offline');
			expect(result.trace.fallbackReason).toBe('invalid_output');
			expect(result.state.plan.theme).toBe('vibrant');
		}
	});

	it('a partly valid envelope keeps its valid parts and lists the drops', () => {
		const result = handleTurn(
			initialState(),
			{
				message: 'make it calm',
				...model({
					intent: 'restyle',
					patch: { theme: 'minimal', layout: 'hologram' },
					reply: 'Calmer now.',
					extra: 1
				})
			},
			deps
		);
		expect(result.backend).toBe('model');
		expect(result.state.plan.theme).toBe('minimal');
		expect(result.trace.dropped).toEqual([
			{ place: 'unknown', code: 'unknown_field' },
			{ place: 'layout', code: 'unknown_value' }
		]);
		expect(result.turn.reply.text).toBe('Calmer now.');
	});

	it('a model cannot change what the shopper set directly', () => {
		const result = handleTurn(
			shaped,
			{
				message: 'colourful',
				...model({
					intent: 'restyle',
					patch: { theme: 'vibrant', density: 'spacious' },
					reply: 'Brighter.'
				})
			},
			deps
		);
		expect(result.state.plan.theme).toBe('minimal');
		expect(result.state.plan.density).toBe('spacious');
		expect(result.trace.dropped).toContainEqual({ place: 'theme', code: 'explicit_wins' });
	});

	it('force offline skips the model answer entirely', () => {
		const result = handleTurn(
			initialState(),
			{
				message: 'make it colourful',
				forceOffline: true,
				...model({ intent: 'restyle', patch: { theme: 'minimal' } })
			},
			deps
		);
		expect(result.backend).toBe('offline');
		expect(result.trace.fallbackReason).toBe('forced_offline');
		expect(result.state.plan.theme).toBe('vibrant');
	});

	it('a budget comes from the shopper message even when the model answered', () => {
		const plan = mergePlan(standardPlan, { filters: { category: 'mouse' } }, catalog);
		const result = handleTurn(
			{ ...initialState(), plan },
			{
				message: 'mice under 1500 please',
				...model({ intent: 'search', patch: { filters: { maxPrice: 1 } }, reply: 'Here they are.' })
			},
			deps
		);
		expect(result.state.plan.filters.maxPrice).toBe(1500);
		expect(result.trace.dropped).toContainEqual({
			place: 'filters.maxPrice',
			code: 'model_number'
		});
	});
});
