<script lang="ts">
	import { onMount } from 'svelte';
	import { snapshot } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { categories, products, specs, type Category } from '#lib/catalog/index.ts';
	import { rankProducts, type ShopperPlan } from '#lib/personalization/index.ts';
	import { matchesQuery } from '#lib/personalization/ranking.ts';
	import { optimizeDeal } from '#lib/pricing/index.ts';
	import { catalog } from '#lib/store-catalog.js';
	import CompareViews from '#lib/storefront/CompareViews.svelte';
	import { comparePresets, type ComparePreset } from '#lib/storefront/compare.ts';
	import { receiptListingParams } from '#lib/storefront/sharedLook.ts';
	import { getStoreSession, returnToStore } from '#lib/storefront/store.svelte.ts';

	let interactive = $state(false);
	onMount(() => {
		interactive = true;
	});
	const session = getStoreSession();
	const pricingContext = $derived(session.clock.context);
	const locale = $derived(page.url.searchParams.get('lang') === 'th' ? 'th' : 'en');
	const options = Object.keys(categories) as Category[];
	const glyphs = new Map(catalog.map((item) => [item.catalogId, item.category]));
	let query = $derived(page.url.searchParams.get('q')?.slice(0, 200) ?? '');
	let category = $derived(options.find((key) => key === page.url.searchParams.get('category')));
	let leftPreset = $state<ComparePreset>('tech');
	let rightPreset = $state<ComparePreset>('visual');
	snapshot({
		capture: () => ({ query, category, leftPreset, rightPreset }),
		restore: (saved) => {
			if (!saved || typeof saved !== 'object') return;
			if (typeof saved.query === 'string' && saved.query.length <= 200) query = saved.query;
			if (saved.category === undefined || options.includes(saved.category))
				category = saved.category;
			if (comparePresets.includes(saved.leftPreset)) leftPreset = saved.leftPreset;
			if (comparePresets.includes(saved.rightPreset)) rightPreset = saved.rightPreset;
		}
	});
	const specCategory = $derived.by(() => {
		if (category) return category;
		const matchedCategories = new Set(
			products.filter((product) => matchesQuery(product, query)).map((product) => product.category)
		);
		return matchedCategories.size === 1 ? [...matchedCategories][0] : undefined;
	});
	const columns = $derived(
		specCategory
			? specs[specCategory].slice(0, 3).map(({ key, label }) => ({
					field: 'spec.' + key,
					label
				}))
			: []
	);
	const th = $derived(locale === 'th');
	const title = $derived(th ? 'เทียบมุมมองหน้าร้าน' : 'Compare views');

	function listingHref(id: string, plan: ShopperPlan) {
		return resolve(`/product/[id]?${receiptListingParams(plan)}`, { id });
	}
	function productsFor(plan: ShopperPlan) {
		return rankProducts(products, { ...plan, query, category: category ?? null }).map(
			({ product }) => product.id
		);
	}

	function vouchersFor(id: string) {
		if (!pricingContext) return [];
		const quote = optimizeDeal([{ productId: id, quantity: 1 }], pricingContext);
		return quote
			? [
					...quote.appliedVouchers,
					...quote.unusedVouchers.filter(({ reason }) => reason === 'beaten')
				]
			: [];
	}
</script>

<svelte:head><title>{title} · DynamicShopper</title></svelte:head>
<main data-storefront-theme="standard" lang={locale}>
	<header>
		<span>DynamicShopper</span>
		<a href={resolve(returnToStore(session))}>
			{th ? 'กลับหน้าร้าน' : 'Back to the store'}
		</a>
	</header>
	<h1>{title}</h1>
	<p>
		{th
			? 'เลือกผู้ซื้อแต่ละฝั่ง แล้วเทียบข้อมูลสินค้าจากผลการค้นหาเดียวกัน'
			: 'Choose a shopper for each view to compare facts from the same search.'}
	</p>
	<label>
		{th ? 'ค้นหาสินค้า' : 'Search products'}<input
			disabled={!interactive}
			type="search"
			maxlength="200"
			bind:value={query}
		/>
	</label>
	<div class="categories" role="group" aria-label={th ? 'หมวดหมู่' : 'Category'}>
		<button disabled={!interactive} aria-pressed={!category} onclick={() => (category = undefined)}>
			{th ? 'ทั้งหมด' : 'All'}
		</button>
		{#each options as key (key)}
			<button
				disabled={!interactive}
				aria-pressed={category === key}
				onclick={() => (category = key)}
			>
				{categories[key][locale]}
			</button>
		{/each}
	</div>
	<CompareViews
		bind:leftPreset
		bind:rightPreset
		{locale}
		{productsFor}
		{columns}
		{vouchersFor}
		categoryFor={(id: string) => glyphs.get(id)}
		{listingHref}
	/>
</main>

<style>
	main {
		max-width: 78rem;
		min-height: 100vh;
		margin-inline: auto;
		padding: 1rem clamp(1rem, 3vw, 3rem) 3rem;
	}
	header,
	.categories {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}
	header {
		justify-content: space-between;
		border-bottom: 1px solid var(--seam);
	}
	header span,
	h1 {
		font-weight: 600;
	}
	h1 {
		font-size: 2rem;
		margin-top: 1rem;
	}
	p {
		margin-bottom: 1rem;
	}
	a {
		display: inline-flex;
		align-items: center;
		text-decoration: underline;
		min-height: var(--tap);
	}
	label {
		display: grid;
		gap: 0.25rem;
		max-width: 40rem;
	}
	button,
	input {
		padding-inline: 0.75rem;
		min-height: var(--tap);
		border: 1px solid var(--seam);
		background: var(--surface);
	}
	input {
		min-width: 0;
		border-color: var(--muted);
	}
	.categories {
		margin-block: 0.75rem 1.5rem;
	}
	button[aria-pressed='true'] {
		border-color: var(--ink);
		font-weight: 600;
	}
	:is(a, input, button):focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 2px;
	}
</style>
