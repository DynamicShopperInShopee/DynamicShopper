<script lang="ts">
	import { getHarness } from './context.svelte';
	import { runGoldenSet, defaultCatalog, type GoldenSummary } from '#lib/harness/index.ts';
	import { goldenTurns } from '#lib/fixtures/golden-turns.ts';
	const ctx = getHarness();
	let summary = $state<GoldenSummary>();
	let running = $state(false);
	async function run() {
		running = true;
		try {
			summary = (
				await runGoldenSet(goldenTurns, 'offline', () => Promise.resolve(undefined), {
					catalog: defaultCatalog,
					clock: { openedAt: ctx.openedAt, now: ctx.now }
				})
			).summary;
		} finally {
			running = false;
		}
	}
</script>

<section class="slip">
	<h3>{ctx.t('Accuracy check', 'ตรวจความแม่นยำ')}</h3>
	<p>
		{ctx.t(
			'Provisional shopper-message set. Live model not measured.',
			'ชุดข้อความผู้ซื้อเบื้องต้น ยังไม่ได้วัดโมเดลจริง'
		)}
	</p>
	<button disabled={running} onclick={run}>
		{ctx.t('Run offline checks', 'ทดสอบออฟไลน์')}
	</button>{#if summary}<dl>
			<dt>{ctx.t('Passed', 'ผ่าน')}</dt>
			<dd data-evaluation="passed" data-raw={summary.passed}>{summary.passed}</dd>
			<dt>{ctx.t('Messages', 'ข้อความ')}</dt>
			<dd data-evaluation="total" data-raw={summary.total}>{summary.total}</dd>
			<dt>{ctx.t('Fact violations', 'ละเมิดข้อเท็จจริง')}</dt>
			<dd data-evaluation="violations" data-raw={summary.violations}>{summary.violations}</dd>
		</dl>{/if}
</section>
