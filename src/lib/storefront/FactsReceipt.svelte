<script lang="ts">
	import type { Locale } from '../catalog/index.ts';
	import { inspectFacts } from './verify';

	let { root, locale, compare }: { root?: HTMLElement; locale: Locale; compare?: true } = $props();
	let checked = $state(0);
	let mismatches = $state(0);
	let shared = $state(0);
	let ready = $state(false);

	$effect(() => {
		if (!root) return;
		const target = root;
		const activeLocale = locale;
		const comparePanes = compare;
		function refresh() {
			ready = true;
			if (!comparePanes) {
				const result = inspectFacts(target, activeLocale);
				checked = result.checked;
				mismatches = result.mismatches;
				return;
			}
			const panes = [...target.querySelectorAll<HTMLElement>('[data-compare-pane]')];
			const [left, right] = panes.map((pane) =>
				inspectFacts(pane, pane.lang === 'th' ? 'th' : 'en')
			);
			shared =
				left && right
					? [...left.facts].filter(([key, raw]) => right.facts.get(key) === raw).length
					: 0;
			mismatches = (left?.mismatches ?? 0) + (right?.mismatches ?? 0);
		}
		refresh();
		const observer = new MutationObserver(refresh);
		observer.observe(target, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: [
				'data-fact-node',
				'data-product-id',
				'data-raw',
				'data-fact',
				'lang',
				'hidden',
				'open'
			]
		});
		return () => observer.disconnect();
	});

	const count = $derived(compare ? shared : checked);
	const status = $derived(
		!ready ? 'checking' : mismatches ? 'failed' : count ? 'verified' : 'empty'
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
</style>
