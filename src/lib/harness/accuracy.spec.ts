import { describe, expect, it } from 'vitest';
import { goldenTurns, GOLDEN_PROVISIONAL } from '../fixtures/golden-turns.ts';
import { runGoldenSet } from './accuracy.ts';
import { defaultCatalog as catalog } from './catalog-port.ts';

const deps = { catalog, clock: { openedAt: 1_800_000_000_000, now: 1_800_000_000_000 } };

describe('R15 · golden set through the real pipeline', () => {
	it('the provisional set has the planned mix and is marked provisional', () => {
		expect(GOLDEN_PROVISIONAL).toBe(true);
		const count = (group: string) => goldenTurns.filter((g) => g.group === group).length;
		expect([
			count('thai'),
			count('english'),
			count('mixed'),
			count('slang'),
			count('adversarial')
		]).toEqual([15, 15, 9, 11, 9]);
		expect(new Set(goldenTurns.map((g) => g.id)).size).toBe(goldenTurns.length);
	});

	it('keyword fallback: at least four in five, and zero fact violations', async () => {
		const { rows, summary } = await runGoldenSet(
			goldenTurns,
			'offline',
			() => Promise.resolve(undefined),
			deps
		);
		const misses = rows.filter((row) => !row.pass).map((row) => row.id);
		console.info(
			`fallback ${summary.passed}/${summary.answered} passed; misses: ${misses.join(', ') || 'none'}`
		);
		expect(summary.violations).toBe(0);
		expect(summary.accuracy).toBeGreaterThanOrEqual(0.8);
		// Adversarial messages pass by construction offline: it only speaks in templates.
		expect(rows.filter((row) => row.group === 'adversarial').every((row) => row.pass)).toBe(true);
	});

	it('a model run that timed out is counted as a fallback answer, never as a model result', async () => {
		const { rows, summary } = await runGoldenSet(
			goldenTurns,
			'model',
			() => Promise.resolve({ envelope: null, fallbackReason: 'timeout' }),
			deps
		);
		expect(rows.every((row) => row.backend === 'offline')).toBe(true);
		expect(summary.answered).toBe(0);
		expect(summary.accuracy).toBe('unavailable');
	});

	it('model accuracy stays unavailable when the model answered too little of the set', async () => {
		let i = 0;
		const { summary } = await runGoldenSet(
			goldenTurns,
			'model',
			() =>
				Promise.resolve(
					i++ % 2 === 0
						? { envelope: { intent: 'chat', reply: 'Hello.' } }
						: { envelope: null, fallbackReason: 'api_error' }
				),
			deps
		);
		expect(summary.answered).toBeGreaterThan(0);
		expect(summary.accuracy).toBe('unavailable');
	});

	it('a hostile model on every message still yields zero fact violations', async () => {
		const { summary } = await runGoldenSet(
			goldenTurns,
			'model',
			() =>
				Promise.resolve({
					envelope: {
						intent: 'restyle',
						patch: { theme: 'hacker', cardFields: [], sections: ['x'], filters: { maxPrice: 1 } },
						productIds: ['ghost'],
						reply: 'Everything is ฿1 now!'
					}
				}),
			deps
		);
		expect(summary.answered).toBe(goldenTurns.length);
		expect(summary.violations).toBe(0);
		expect(summary.guarded).toBe(goldenTurns.length);
	});
});
