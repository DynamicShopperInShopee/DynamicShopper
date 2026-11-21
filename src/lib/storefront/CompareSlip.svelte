<script lang="ts">
	import { observeMountedFacts } from './observeMountedFacts';
	import {
		compareFacts,
		type CompareCheck,
		type FactLocale,
		type ResolvePrintedFact
	} from './verifyFacts';

	let {
		left,
		right,
		leftLocale,
		rightLocale,
		locale,
		resolve
	}: {
		left: HTMLElement | undefined;
		right: HTMLElement | undefined;
		leftLocale: FactLocale;
		rightLocale: FactLocale;
		locale: FactLocale;
		resolve: ResolvePrintedFact;
	} = $props();

	const copy = {
		en: {
			title: 'Compare facts',
			pending: 'Checking both views…',
			empty: 'No shared facts to check yet',
			passed: (checked: number) => `Facts identical (${checked} checked)`,
			left: 'Left view',
			right: 'Right view',
			identity: 'Unknown fact',
			source: 'Incorrect source',
			raw: 'Incorrect stored value',
			text: 'Incorrect printed value'
		},
		th: {
			title: 'เทียบข้อมูลทั้งสองมุมมอง',
			pending: 'กำลังตรวจทั้งสองมุมมอง…',
			empty: 'ยังไม่มีข้อมูลร่วมให้ตรวจ',
			passed: (checked: number) => `ข้อมูลตรงกัน (ตรวจแล้ว ${checked} รายการ)`,
			left: 'มุมมองซ้าย',
			right: 'มุมมองขวา',
			identity: 'ไม่รู้จักข้อมูลนี้',
			source: 'แหล่งข้อมูลไม่ถูกต้อง',
			raw: 'ค่าที่บันทึกไม่ถูกต้อง',
			text: 'ค่าที่แสดงไม่ถูกต้อง'
		}
	};

	const t = $derived(copy[locale]);
	let result = $state<CompareCheck>();

	$effect.pre(() => {
		const a = left;
		const b = right;
		const aLocale = leftLocale;
		const bLocale = rightLocale;
		const lookup = resolve;
		return observeMountedFacts(
			[a, b],
			() =>
				a && b
					? compareFacts({ root: a, locale: aLocale }, { root: b, locale: bLocale }, lookup)
					: { checked: 0, mismatches: [] },
			(value) => {
				result = value;
			}
		);
	});
</script>

<section
	class="max-w-[28rem] border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4"
	aria-label={t.title}
	aria-live="polite"
>
	<h2 class="mx-0 mt-0 mb-2 text-[length:inherit]">{t.title}</h2>
	{#if !result}
		<p>{t.pending}</p>
	{:else if result.mismatches.length}
		<ul class="text-[var(--void,#b01e31)]">
			{#each result.mismatches as mismatch, index (index)}
				<li>{t[mismatch.side]} · {t[mismatch.reason]} · {mismatch.productId} · {mismatch.field}</li>
			{/each}
		</ul>
	{:else if result.checked > 0}
		<p
			class="inline-block border border-current px-[0.5em] py-[0.25em] text-[var(--verified,#0f7b4a)]"
			data-proof="passed"
			data-raw={result.checked}
		>
			{t.passed(result.checked)}
		</p>
	{:else}
		<p>{t.empty}</p>
	{/if}
</section>
