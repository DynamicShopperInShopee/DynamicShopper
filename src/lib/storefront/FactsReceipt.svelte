<script lang="ts">
	import type { Locale } from '../catalog/index.ts';
	import { resolveCatalogFact } from './catalogFact';
	import { observeMountedFacts } from './observeMountedFacts';
	import { compareFacts, verifyFacts, type FactCheck } from './verifyFacts';

	let {
		root,
		additionalRoots = [],
		locale,
		compare
	}: {
		root?: HTMLElement;
		additionalRoots?: readonly (HTMLElement | undefined)[];
		locale: Locale;
		compare?: true;
	} = $props();
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
		const scopes = new Set([target, ...additionalRoots]);
		return observeMountedFacts<FactCheck>(
			[...scopes],
			() => {
				if (!comparePanes) {
					const combined: FactCheck = { checked: 0, mismatches: [] };
					for (const scope of scopes) {
						if (!scope) continue;
						const result = verifyFacts(scope, resolveCatalogFact, activeLocale);
						combined.checked += result.checked;
						combined.mismatches.push(...result.mismatches);
					}
					return combined;
				}
				if (!target) return { checked: 0, mismatches: [] };
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

<div class="slip" data-proof={status} aria-live="polite">
	{#if status === 'verified'}
		<strong>
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
		<strong>
			{locale === 'th' ? 'พบข้อมูลที่ไม่ตรงกับแค็ตตาล็อก' : 'Displayed facts differ from the catalog'}
		</strong>
		<ul>
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

<style>
	.slip {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.45rem 1rem;
		padding: 0.65rem 0.8rem;
		margin-block: 0.8rem;
		background: var(--surface, white);
		border: 1px dashed var(--seam, #706f68);
	}
	[data-proof='verified'] strong {
		color: #0f7b4a;
	}
	[data-proof='failed'] strong {
		color: #a11725;
	}
	ul {
		flex-basis: 100%;
		margin: 0;
		padding-inline-start: 1.25em;
		list-style: disc;
	}
</style>
