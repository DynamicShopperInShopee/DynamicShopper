import { describe, expect, it } from 'vitest';
import { defaultCatalog as catalog } from './catalog-port.ts';
import { sameValue } from './plan.ts';
import {
	SUGGESTION_THRESHOLD,
	acceptSuggestion,
	dismissSuggestion,
	interviewPatch,
	recordSignal
} from './signals.ts';
import { applyPatch, initialState } from './store.ts';
import { SIGNAL_KINDS, type StoreState } from './types.ts';

const signal = (kind: string, at = 1) => ({ kind, at });

describe('R16 · behaviour only suggests; the shopper decides', () => {
	it('one isolated action never creates a suggestion; repeated ones do', () => {
		let state = initialState();
		for (let i = 1; i < SUGGESTION_THRESHOLD; i++)
			state = recordSignal(state, signal('open_compare', i), catalog);
		expect(state.suggestions).toEqual([]);
		state = recordSignal(state, signal('open_compare', 9), catalog);
		expect(state.suggestions).toEqual([
			{ id: 'open_compare', patch: { layout: 'table' }, evidence: SUGGESTION_THRESHOLD }
		]);
		expect(state.plan).toEqual(initialState().plan);
	});

	it('exploration: no sequence of behaviour signals alone ever changes the plan (depth 6)', () => {
		const kinds = [...SIGNAL_KINDS, 'bogus'];
		let sequences = 0;
		let suggested = 0;
		const walk = (state: StoreState, depth: number) => {
			if (depth === 6) {
				sequences += 1;
				if (state.suggestions.length > 0) suggested += 1;
				expect(sameValue(state.plan, initialState().plan)).toBe(true);
				expect(state.undo).toEqual([]);
				return;
			}
			for (const kind of kinds.slice(0, 4))
				walk(recordSignal(state, signal(kind, depth), catalog), depth + 1);
		};
		walk(initialState(), 0);
		expect(sequences).toBe(4 ** 6);
		expect(suggested).toBeGreaterThan(0);
	});

	it('accepting applies one explicit, undoable step; dismissing hides it', () => {
		let state = initialState();
		for (let i = 0; i < 3; i++) state = recordSignal(state, signal('zoom_text', i), catalog);
		const accepted = acceptSuggestion(state, 'zoom_text', catalog).state;
		expect(accepted.plan.theme).toBe('large-print');
		expect(accepted.explicit).toContain('theme');
		expect(accepted.undo).toHaveLength(1);
		expect(accepted.suggestions).toEqual([]);
		for (let i = 0; i < 3; i++) state = recordSignal(state, signal('sort_price', i), catalog);
		expect(
			dismissSuggestion(state, 'sort_price', catalog).suggestions.map((s) => s.id)
		).not.toContain('sort_price');
	});

	it('never suggests changing what the shopper set directly, and ignores junk signals', () => {
		let state = applyPatch(initialState(), { layout: 'list' }, 'explicit', catalog).state;
		for (let i = 0; i < 5; i++) state = recordSignal(state, signal('open_compare', i), catalog);
		expect(state.suggestions).toEqual([]);
		expect(recordSignal(state, { kind: 'hack', at: 1 }, catalog)).toBe(state);
		expect(recordSignal(state, null, catalog)).toBe(state);
	});
});

describe('interview answers apply directly as explicit choices', () => {
	it('maps answers to a plan change and reports what the fixed library cannot show', () => {
		const { patch, unsupported } = interviewPatch({
			goal: 'compare',
			matters: 'performance',
			detail: 'detailed',
			help: 'refills',
			access: 'larger-text',
			junk: 'x'
		});
		expect(patch).toMatchObject({
			layout: 'table',
			density: 'compact',
			theme: 'large-print',
			priorities: { performance: 1 }
		});
		expect(patch.sections).toEqual(['what-matters', 'products']);
		expect(unsupported).toEqual(['refills']);
		expect(interviewPatch({ goal: 'nonsense' })).toEqual({ patch: {}, unsupported: [] });
		expect(interviewPatch(null)).toEqual({ patch: {}, unsupported: [] });
	});
});
