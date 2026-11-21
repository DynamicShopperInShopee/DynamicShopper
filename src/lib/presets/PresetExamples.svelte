<script lang="ts">
	import { resolve } from '$app/paths';
	import { products, specs, type Locale } from '../catalog';
	import { shopPresets } from './plans';
	import Sections from '../storefront/Sections.svelte';
	import ItemizedDealSlip from '../storefront/ItemizedDealSlip.svelte';
	import { getStoreSession } from '../storefront/store.svelte';
	import { quoteBasket } from '../storefront/quoteBasket';
	import { formatBaht, getProduct } from '../catalog';
	import { defaultPlan } from '../personalization';
	import { describePlanChanges } from '../storefront/describePlanChanges';
	let { locale }: { locale: Locale } = $props();
	let selected = $state(shopPresets[0].id);
	const preset = $derived(shopPresets.find((p) => p.id === selected) ?? shopPresets[0]);
	const plan = $derived({ ...defaultPlan, ...preset.patch, locale });
	const session = getStoreSession();
	const ids = products
		.filter((p) => p.category === 'rice-cooker')
		.slice(0, 3)
		.map((p) => p.id);
	const columns = specs['rice-cooker'].map((s) => ({ field: `spec.${s.key}`, label: s.label }));
	const quote = $derived(
		plan.sections.includes('best-deal')
			? quoteBasket([{ productId: ids[0], quantity: 1 }], locale, session.clock.context)
			: undefined
	);
</script>

<section
	class="examples"
	aria-label={locale === 'th' ? 'ตัวอย่างมุมมองสำหรับตรวจแบบ' : 'Presentation inspection examples'}
>
	<h2>{locale === 'th' ? 'ตัวอย่างมุมมอง' : 'Presentation examples'}</h2>
	<p>
		{locale === 'th'
			? 'ตัวอย่างสำหรับตรวจการออกแบบ การเลือกที่นี่ไม่เปลี่ยนหน้าร้าน'
			: 'Inspect authored presentations here. Selecting an example does not change the store.'}
	</p>
	<label>
		{locale === 'th' ? 'ตัวอย่าง' : 'Example'}<select bind:value={selected}>
			{#each shopPresets as item (item.id)}<option value={item.id}>
					{item.title[locale]}
				</option>{/each}
		</select>
	</label>
	<p>{preset.description[locale]}</p>
	<div data-storefront-theme={plan.theme} data-density={plan.density} class="example-shelf">
		<Sections
			sections={plan.sections}
			productIds={ids}
			layout={plan.theme === 'large-print' ? 'large-print' : plan.layout}
			{locale}
			{columns}
			details={plan.details}
			listingHref={(id: string) => resolve('/product/[id]', { id })}
			priorities={[
				{ en: 'Rating', th: 'คะแนน' },
				{ en: 'Value', th: 'ความคุ้มค่า' }
			]}
		>
			{#snippet deal()}
				<ItemizedDealSlip
					receipt={quote?.receipt}
					{locale}
					formatMoney={formatBaht}
					productName={(id: string, lang: Locale) => getProduct(id)?.name[lang]}
				/>
			{/snippet}
		</Sections>
	</div>
	<details>
		<summary>{locale === 'th' ? 'องค์ประกอบของตัวอย่าง' : 'Example composition'}</summary>
		<ul>
			{#each describePlanChanges({ ...defaultPlan, locale }, plan, locale) as change (change)}<li>
					{change}
				</li>{/each}
		</ul>
	</details>
</section>

<style>
	.examples {
		border-top: 2px solid var(--ink);
		padding-top: 24px;
		margin-top: 36px;
	}
	h2 {
		margin: 0 0 12px;
	}
	label {
		display: grid;
		gap: 8px;
		margin-block: 16px;
	}
	select {
		min-height: var(--tap, 44px);
		font: inherit;
		color: inherit;
		background: var(--surface);
		border: 1px solid var(--muted);
		padding: 12px;
		max-width: 100%;
	}
	.example-shelf {
		padding: 20px;
		border: 1px solid var(--seam);
	}
	.example-shelf[data-density='compact'] {
		--shelf-cell-padding: 0.125rem;
		padding: 12px;
	}
	.example-shelf[data-density='spacious'] {
		--shelf-cell-padding: 0.5rem;
		padding: 24px;
	}
	summary {
		min-height: var(--tap, 44px);
		padding-top: 12px;
		cursor: pointer;
	}
	:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
</style>
