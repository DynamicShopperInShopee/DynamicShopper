<script lang="ts">
	import type { FactLocale } from './verifyFacts';

	let {
		locale,
		forceOffline,
		onForceOffline,
		trace,
		modelName,
		accuracy,
		poisonArmed = false,
		onPoison
	}: {
		locale: FactLocale;
		forceOffline: boolean;
		onForceOffline: (enabled: boolean) => void;
		trace?: unknown;
		modelName?: string;
		accuracy?: unknown;
		poisonArmed?: boolean;
		onPoison?: () => void;
	} = $props();

	const copy = {
		en: {
			title: 'X-ray',
			force: 'Force offline',
			poison: 'Simulate poisoned model',
			armed: 'Poison armed',
			empty: 'No turn to inspect yet',
			offline: 'Offline',
			model: 'Model',
			'missing-key': 'No AI key',
			forced: 'Offline requested',
			timeout: 'Model timed out',
			'provider-error': 'Model error',
			'invalid-output': 'Invalid model output',
			'catalog-search': 'Searched catalog',
			'listing-read': 'Read listings',
			passed: 'Reply passed',
			replaced: 'Reply replaced',
			unchanged: 'Store unchanged',
			applied: 'Store updated',
			ranked: 'Ranked products',
			dropped: 'Dropped changes',
			theme: 'Theme',
			layout: 'Layout',
			density: 'Density',
			language: 'Language',
			sections: 'Sections',
			filters: 'Filters',
			'unknown-value': 'Unknown value',
			'invalid-type': 'Invalid value type',
			accuracy: 'Accuracy',
			offlineUnavailable: 'Offline accuracy unavailable',
			modelUnavailable: 'Model accuracy unavailable'
		},
		th: {
			title: 'เอ็กซ์เรย์',
			force: 'บังคับโหมดออฟไลน์',
			poison: 'จำลองโมเดลส่งข้อมูลผิด',
			armed: 'พร้อมจำลองโมเดล',
			empty: 'ยังไม่มีรอบให้ตรวจ',
			offline: 'ออฟไลน์',
			model: 'โมเดล',
			'missing-key': 'ไม่มีคีย์ AI',
			forced: 'ผู้ใช้เลือกออฟไลน์',
			timeout: 'โมเดลหมดเวลา',
			'provider-error': 'โมเดลขัดข้อง',
			'invalid-output': 'ผลลัพธ์โมเดลไม่ถูกต้อง',
			'catalog-search': 'ค้นแค็ตตาล็อก',
			'listing-read': 'อ่านรายการสินค้า',
			passed: 'คำตอบผ่านการตรวจ',
			replaced: 'เปลี่ยนคำตอบแล้ว',
			unchanged: 'ร้านไม่เปลี่ยน',
			applied: 'ปรับร้านแล้ว',
			ranked: 'สินค้าที่จัดอันดับ',
			dropped: 'การเปลี่ยนแปลงที่ตัดออก',
			theme: 'ธีม',
			layout: 'เค้าโครง',
			density: 'ความหนาแน่น',
			language: 'ภาษา',
			sections: 'ส่วนของหน้า',
			filters: 'ตัวกรอง',
			'unknown-value': 'ไม่รู้จักค่านี้',
			'invalid-type': 'ชนิดข้อมูลไม่ถูกต้อง',
			accuracy: 'ความแม่นยำ',
			offlineUnavailable: 'ยังไม่มีผลวัดออฟไลน์',
			modelUnavailable: 'ยังไม่มีผลวัดโมเดล'
		}
	} as const;

	const reasons = ['missing-key', 'forced', 'timeout', 'provider-error', 'invalid-output'] as const;
	const stepKinds = ['catalog-search', 'listing-read'] as const;
	const guardStates = ['passed', 'replaced'] as const;
	const mergeStates = ['unchanged', 'applied'] as const;
	const changeFields = ['theme', 'layout', 'density', 'language', 'sections', 'filters'] as const;
	const dropReasons = ['unknown-value', 'invalid-type'] as const;
	const t = $derived(copy[locale]);

	function record(input: unknown): Record<string, unknown> {
		return input !== null && typeof input === 'object' && !Array.isArray(input)
			? (input as Record<string, unknown>)
			: {};
	}

	function oneOf<T extends string>(input: unknown, choices: readonly T[]): T | undefined {
		return choices.find((choice) => choice === input);
	}

	function count(input: unknown): number | undefined {
		return typeof input === 'number' && Number.isInteger(input) && input >= 0 && input <= 10000
			? input
			: undefined;
	}

	function measurement(input: unknown) {
		const value = record(input);
		const tested = count(value.tested);
		const correct = count(value.correct);
		return tested && correct !== undefined && correct <= tested ? { tested, correct } : undefined;
	}

	const data = $derived(record(trace));
	const backend = $derived(record(data.backend));
	const kind = $derived(oneOf(backend.kind, ['offline', 'model'] as const));
	const reason = $derived(kind === 'offline' ? oneOf(backend.reason, reasons) : undefined);
	const displayedModel = $derived(
		kind === 'model' && backend.model === modelName ? modelName : undefined
	);
	const guard = $derived(oneOf(data.guard, guardStates));
	const merge = $derived(oneOf(data.merge, mergeStates));
	const ranked = $derived(count(data.ranked));
	const steps = $derived(
		(Array.isArray(data.steps) ? data.steps.slice(0, 12) : []).flatMap((input: unknown) => {
			const row = record(input);
			const kind = oneOf(row.kind, stepKinds);
			const read = count(row.count);
			return kind && read !== undefined ? [{ kind, read }] : [];
		})
	);
	const dropped = $derived(
		(Array.isArray(data.dropped) ? data.dropped.slice(0, 20) : []).flatMap((input: unknown) => {
			const row = record(input);
			const field = oneOf(row.field, changeFields);
			const reason = oneOf(row.reason, dropReasons);
			return field && reason ? [{ field, reason }] : [];
		})
	);
	const measured = $derived(record(accuracy));
	const offlineAccuracy = $derived(measurement(measured.offline));
	const modelAccuracy = $derived(measurement(measured.model));
</script>

{#snippet measurementText(label: string, correct: number, tested: number)}
	<p>
		{label} <span data-source="measurement" data-field="correct" data-raw={correct}>{correct}</span>
		/
		<span data-source="measurement" data-field="tested" data-raw={tested}>{tested}</span>
	</p>
{/snippet}

<section lang={locale} aria-label={t.title}>
	<h2>{t.title}</h2>
	<label>
		<input
			type="checkbox"
			checked={forceOffline}
			onchange={(event) => onForceOffline(event.currentTarget.checked)}
		/>
		{t.force}
	</label>
	{#if import.meta.env.DEV && onPoison}
		<button type="button" disabled={poisonArmed} onclick={onPoison}>
			{poisonArmed ? t.armed : t.poison}
		</button>
	{/if}
	{#if kind}
		<p>
			{t[kind]}{#if reason}
				· {t[reason]}{/if}{#if displayedModel}
				· <span>{displayedModel}</span>{/if}
		</p>
	{:else}
		<p>{t.empty}</p>
	{/if}
	{#if steps.length}
		<ul>
			{#each steps as step}
				<li>
					<span>{t[step.kind]}</span>
					<span data-source="trace" data-field="tool.count" data-raw={step.read}>{step.read}</span>
				</li>
			{/each}
		</ul>
	{/if}
	{#if guard}<p>{t[guard]}</p>{/if}
	{#if merge}<p>{t[merge]}</p>{/if}
	{#if ranked !== undefined}<p>
			{t.ranked} <span data-source="trace" data-field="ranked" data-raw={ranked}>{ranked}</span>
		</p>{/if}
	{#if dropped.length}
		<h3>{t.dropped}</h3>
		<ul>
			{#each dropped as drop}<li>{t[drop.field]} · {t[drop.reason]}</li>{/each}
		</ul>
	{/if}
	<h3>{t.accuracy}</h3>
	{#if offlineAccuracy}
		{@render measurementText(t.offline, offlineAccuracy.correct, offlineAccuracy.tested)}
	{:else}
		<p>{t.offlineUnavailable}</p>
	{/if}
	{#if modelAccuracy}
		{@render measurementText(t.model, modelAccuracy.correct, modelAccuracy.tested)}
	{:else}
		<p>{t.modelUnavailable}</p>
	{/if}
</section>

<style>
	section {
		max-width: 28rem;
		padding: 1rem;
		border: 1px solid var(--seam, #e9e6dc);
		background: var(--surface, #fff);
	}
	h2,
	h3 {
		font-size: inherit;
	}
	h2 {
		margin: 0;
	}
	p,
	ul {
		margin: 0.5rem 0;
	}
	ul {
		padding-inline-start: 1.25rem;
	}
	label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--tap, 3rem);
	}
	button {
		min-height: var(--tap, 3rem);
		font: inherit;
	}
	[data-raw] {
		font-family: var(--mono, 'IBM Plex Mono', monospace);
		font-variant-numeric: tabular-nums;
	}
</style>
