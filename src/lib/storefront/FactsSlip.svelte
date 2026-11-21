<script lang="ts">
	import { observeMountedFacts } from './observeMountedFacts';
	import {
		verifyFacts,
		type FactCheck,
		type FactLocale,
		type ResolvePrintedFact
	} from './verifyFacts';

	let {
		scope,
		resolve,
		locale
	}: {
		scope: HTMLElement | undefined;
		resolve: ResolvePrintedFact;
		locale: FactLocale;
	} = $props();

	const copy = {
		en: {
			title: 'Catalog check',
			checking: 'Checking facts…',
			empty: 'No facts to check yet',
			passed: 'Facts re-checked against the catalog',
			identity: 'Unknown fact',
			source: 'Incorrect source',
			raw: 'Incorrect stored value',
			text: 'Incorrect printed value'
		},
		th: {
			title: 'ตรวจข้อมูลกับแค็ตตาล็อก',
			checking: 'กำลังตรวจข้อมูล…',
			empty: 'ยังไม่มีข้อมูลให้ตรวจ',
			passed: 'รายการที่ตรวจตรงกับแค็ตตาล็อก',
			identity: 'ไม่รู้จักข้อมูลนี้',
			source: 'แหล่งข้อมูลไม่ถูกต้อง',
			raw: 'ค่าที่บันทึกไม่ถูกต้อง',
			text: 'ค่าที่แสดงไม่ถูกต้อง'
		}
	};
	const t = $derived(copy[locale]);
	let result = $state<FactCheck>();

	$effect.pre(() => {
		const root = scope;
		const lookup = resolve;
		const currentLocale = locale;
		return observeMountedFacts(
			[root],
			() => (root ? verifyFacts(root, lookup, currentLocale) : { checked: 0, mismatches: [] }),
			(value) => {
				result = value;
			}
		);
	});
</script>

<section
	class="slip max-w-[28rem] border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4"
	aria-label={t.title}
	aria-live="polite"
>
	<h2 class="mx-0 mt-0 mb-2 text-[length:inherit]">{t.title}</h2>
	{#if !result}
		<p>{t.checking}</p>
	{:else if result.mismatches.length}
		<ul class="mismatches text-[var(--void,#b01e31)]">
			{#each result.mismatches as mismatch, index (index)}
				<li>{t[mismatch.reason]} {mismatch.productId} {mismatch.field}</li>
			{/each}
		</ul>
	{:else if result.checked > 0}
		<p
			class="stamp inline-block border border-current px-[0.5em] py-[0.25em] text-[var(--verified,#0f7b4a)]"
			data-proof="passed"
			data-raw={result.checked}
		>
			{result.checked}
			{t.passed}
		</p>
	{:else}
		<p>{t.empty}</p>
	{/if}
</section>
