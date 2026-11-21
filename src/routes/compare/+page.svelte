<script lang="ts">
	import { onMount } from 'svelte';
	import { snapshot } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { categories, specs, type Category, type Locale } from '#lib/catalog/index.ts';
	import { rankProducts, type ShopperPlan } from '#lib/personalization/index.ts';
	import { matchesQuery } from '#lib/personalization/ranking.ts';
	import { optimizeDeal } from '#lib/pricing/index.ts';
	import { catalog } from '#lib/store-catalog.js';
	import CompareViews from '#lib/storefront/CompareViews.svelte';
	import {
		comparePresets,
		eligibleShelfProducts,
		type ComparePreset
	} from '#lib/storefront/compare.ts';
	import { getStoreSession, returnToStore } from '#lib/storefront/store.svelte.ts';

	let interactive = $state(false);
	onMount(() => {
		interactive = true;
	});
	const session = getStoreSession();
	const pricingContext = $derived(session.clock.context);
	const shelf = $derived(session.visit);
	const eligibleProducts = $derived(eligibleShelfProducts(shelf?.freeShipping, shelf?.capacity));
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
			eligibleProducts
				.filter((product) => matchesQuery(product, query))
				.map((product) => product.category)
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

	function listingHref(id: string, lang: Locale, theme: ShopperPlan['theme']) {
		const params = new URLSearchParams({
			view: 'receipt',
			lang,
			theme: theme === 'large-print' ? 'large' : theme
		});
		return resolve(`/product/[id]?${params.toString()}`, { id });
	}
	function productsFor(plan: ShopperPlan) {
		return rankProducts(eligibleProducts, {
			...plan,
			query,
			category: category ?? null,
			maxPrice: shelf?.plan.maxPrice ?? plan.maxPrice,
			shops: shelf?.plan.shops ?? plan.shops,
			mallOnly: shelf?.plan.mallOnly ?? plan.mallOnly
		}).map(({ product }) => product.id);
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
<main
	class="mx-auto min-h-screen max-w-[78rem] px-[clamp(1rem,3vw,3rem)] pt-4 pb-12"
	data-storefront-theme="standard"
	lang={locale}
>
	<header
		class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--seam)]"
	>
		<span class="font-semibold">DynamicShopper</span>
		<a
			class="inline-flex min-h-[var(--tap)] items-center underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
			href={resolve(returnToStore(session))}
		>
			{th ? 'กลับหน้าร้าน' : 'Back to the store'}
		</a>
	</header>
	<h1 class="mt-4 text-[2rem] font-semibold">{title}</h1>
	<p class="mb-4">
		{th
			? 'เลือกผู้ซื้อแต่ละฝั่ง แล้วเทียบข้อมูลสินค้าจากผลการค้นหาเดียวกัน'
			: 'Choose a shopper for each view to compare facts from the same search.'}
	</p>
	<label class="grid max-w-[40rem] gap-1">
		{th ? 'ค้นหาสินค้า' : 'Search products'}<input
			class="min-h-[var(--tap)] min-w-0 border border-[var(--muted)] bg-[var(--surface)] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
			disabled={!interactive}
			type="search"
			maxlength="200"
			bind:value={query}
		/>
	</label>
	<div
		class="categories mt-3 mb-6 flex flex-wrap items-center gap-x-4 gap-y-2"
		role="group"
		aria-label={th ? 'หมวดหมู่' : 'Category'}
	>
		<button
			class="min-h-[var(--tap)] border border-[var(--seam)] bg-[var(--surface)] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] aria-pressed:border-[var(--ink)] aria-pressed:font-semibold"
			disabled={!interactive}
			aria-pressed={!category}
			onclick={() => (category = undefined)}
		>
			{th ? 'ทั้งหมด' : 'All'}
		</button>
		{#each options as key (key)}
			<button
				class="min-h-[var(--tap)] border border-[var(--seam)] bg-[var(--surface)] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] aria-pressed:border-[var(--ink)] aria-pressed:font-semibold"
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
