<script lang="ts">
	import type { Locale } from '../catalog/index.ts';
	import { resolveCatalogFact } from './catalogFact';
	import { observeMountedFacts } from './observeMountedFacts';
	import { compareFacts, verifyFacts, type FactCheck } from './verifyFacts';

	let { root, locale, compare }: { root?: HTMLElement; locale: Locale; compare?: true } = $props();
	let result = $state<FactCheck>();
	const reasons = {
		en: {
			identity: 'Unrecognized fact',
			source: 'Incorrect source',
			raw: 'Incorrect stored value',
			text: 'Incorrect printed value'
		},
		th: {
			identity: 'ไม่รู้จักข้อมูลนี้',
			source: 'แหล่งข้อมูลไม่ถูกต้อง',
			raw: 'ค่าที่บันทึกไม่ถูกต้อง',
			text: 'ค่าที่แสดงไม่ถูกต้อง'
		}
	};

	$effect.pre(() => {
		const target = root;
		const activeLocale = locale;
		const comparePanes = compare;
		return observeMountedFacts<FactCheck>(
			[target],
			() => {
				if (!target) return { checked: 0, mismatches: [] };
				if (!comparePanes) return verifyFacts(target, resolveCatalogFact, activeLocale);
				const [left, right] = target.querySelectorAll<HTMLElement>('[data-compare-pane]');
				if (!left || !right) return { checked: 0, mismatches: [] };
				return compareFacts(
					{ root: left, locale: left.lang === 'th' ? 'th' : 'en' },
					{ root: right, locale: right.lang === 'th' ? 'th' : 'en' },
					resolveCatalogFact
				);
			},
			(value) => {
				result = value;
			}
		);
	});

	const count = $derived(result?.checked ?? 0);
	const status = $derived(
		!result ? 'checking' : result.mismatches.length ? 'failed' : count ? 'verified' : 'empty'
	);
</script>

<div
	class="slip group/facts-receipt my-[0.8rem] flex flex-wrap items-baseline gap-x-4 gap-y-[0.45rem] border border-dashed border-[var(--seam,#706f68)] bg-[var(--surface,white)] px-[0.8rem] py-[0.65rem]"
	data-proof={status}
	aria-live="polite"
>
	{#if status === 'verified'}
		<strong
			class="group-data-[proof=failed]/facts-receipt:text-[#a11725] group-data-[proof=verified]/facts-receipt:text-[#0f7b4a]"
		>
			{compare
				? locale === 'th'
					? 'ข้อมูลร่วมตรงกัน'
					: 'Shared facts match'
				: locale === 'th'
					? 'ตรวจสอบข้อมูลแล้ว'
					: 'Facts verified'}
		</strong>
		<span>
			{locale === 'th' ? 'รายการที่ตรวจ' : 'Facts checked'}
			<span data-fact="checkedCount" data-raw={count}>{count}</span>
		</span>
	{:else if status === 'failed'}
		<strong
			class="group-data-[proof=failed]/facts-receipt:text-[#a11725] group-data-[proof=verified]/facts-receipt:text-[#0f7b4a]"
		>
			{locale === 'th' ? 'พบข้อมูลที่ไม่ตรงกับแค็ตตาล็อก' : 'Displayed facts differ from the catalog'}
		</strong>
		<ul class="m-0 basis-full list-disc ps-[1.25em]">
			{#each result?.mismatches ?? [] as { reason }, index (index)}
				<li>{reasons[locale][reason]}</li>
			{/each}
		</ul>
	{:else if status === 'checking'}
		<span>{locale === 'th' ? 'กำลังตรวจสอบข้อมูล' : 'Checking facts'}</span>
	{:else}
		<span>
			{compare
				? locale === 'th'
					? 'ยังไม่มีข้อมูลร่วมให้เปรียบเทียบ'
					: 'No shared facts to compare'
				: locale === 'th'
					? 'ยังไม่มีข้อมูลให้ตรวจ'
					: 'No facts to check'}
		</span>
	{/if}
</div>
