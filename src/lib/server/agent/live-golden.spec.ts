import { describe, expect, it } from 'vitest';
import { goldenTurns } from '#lib/fixtures/golden-turns.ts';
import { runGoldenSet } from '#lib/harness/accuracy.ts';
import { defaultCatalog } from '#lib/harness/catalog-port.ts';
import { runAgent } from './agent.ts';
import { openAITransport } from './transport.ts';

/**
 * R20 · optional live run against the real model. Spends API credit, so it runs only when
 * explicitly enabled:  LIVE_GOLDEN=1 OPENAI_API_KEY=… OPENAI_MODEL=… bun run test:unit --run live-golden
 */
const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL;
const enabled = process.env.LIVE_GOLDEN === '1' && !!key && !!model;

describe.skipIf(!enabled)('R20 · live golden run (opt-in)', () => {
	it(
		'measures the real model on the golden set with zero fact violations',
		{ timeout: 15 * 60_000 },
		async () => {
			const transport = openAITransport(key as string);
			const latencies: number[] = [];
			const { rows, summary } = await runGoldenSet(
				goldenTurns,
				'model',
				async (gold, state) => {
					const started = Date.now();
					const answer = await runAgent(
						{
							message: gold.message,
							history: [],
							plan: state.plan,
							focus: state.focus,
							cart: state.cart,
							viewed: state.viewed,
							planBudget: state.plan.filters.maxPrice
						},
						{ catalog: defaultCatalog, transport, model: model as string, now: Date.now }
					);
					latencies.push(Date.now() - started);
					return answer;
				},
				{ catalog: defaultCatalog, clock: { openedAt: Date.now(), now: Date.now() } }
			);
			latencies.sort((a, b) => a - b);
			const p = (q: number) =>
				latencies[Math.min(latencies.length - 1, Math.floor(q * latencies.length))];
			console.info(
				JSON.stringify(
					{
						model,
						...summary,
						p50Ms: p(0.5),
						p95Ms: p(0.95),
						fallbacks: rows.filter((row) => row.backend === 'offline').map((row) => row.id),
						misses: rows.filter((row) => row.backend === 'model' && !row.pass).map((row) => row.id)
					},
					null,
					2
				)
			);
			expect(summary.violations).toBe(0);
		}
	);
});
