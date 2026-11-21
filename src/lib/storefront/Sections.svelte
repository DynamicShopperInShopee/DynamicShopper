<script lang="ts">
	import { resolveCatalogFact } from './catalogFact';
	import type { Snippet } from 'svelte';
	import type { Category } from '#lib/store-catalog.js';
	import type { ShopperPlan } from '#lib/personalization/index.ts';
	import Fact from './Fact.svelte';
	import ProductShelf, { type ShelfVoucher } from './ProductShelf.svelte';
	import type { FactLocale, LocalizedText, ResolvePrintedFact } from './verifyFacts';

	type Section = 'picks' | 'compare' | 'matters' | 'reviews' | 'deal' | 'share' | 'products';
	type Layout = 'grid' | 'list' | 'table' | 'large-print';
	const planSections = {
		'top-picks': 'picks',
		'what-matters': 'matters',
		'best-deal': 'deal'
	} as const;

	let {
		renderShelf,
		productTarget = true,
		sections,
		productIds,
		layout,
		locale,
		columns,
		resolve = resolveCatalogFact,
		listingHref,
		categoryFor,
		details,
		vouchersFor,
		reasons,
		priorities = [],
		deal,
		share,
		activeFilters = [],
		onClear,
		comparePane = false
	}: {
		renderShelf?: Snippet<[readonly string[], Layout]>;
		productTarget?: boolean;
		sections: readonly string[];
		productIds: readonly string[];
		layout: Layout;
		locale: FactLocale;
		columns: readonly { field: string; label: LocalizedText }[];
		resolve?: ResolvePrintedFact;
		listingHref: (id: string) => string;
		categoryFor?: (id: string) => Category | undefined;
		details?: readonly ShopperPlan['details'][number][];
		vouchersFor?: (id: string) => readonly ShelfVoucher[];
		reasons?: Snippet<[string]>;
		priorities?: readonly LocalizedText[];
		deal?: Snippet<[string]>;
		share?: Snippet;
		activeFilters?: readonly string[];
		onClear?: () => void;
		comparePane?: boolean;
	} = $props();

	const copy = {
		en: {
			picks: 'Top picks',
			compare: 'Compare top picks',
			matters: 'What matters',
			reviews: 'What buyers say',
			deal: 'Best deal',
			share: 'Share with family',
			products: 'Products',
			empty: 'No products match',
			clear: 'Clear filters'
		},
		th: {
			picks: 'สินค้าที่แนะนำ',
			compare: 'เทียบสินค้าที่แนะนำ',
			matters: 'สิ่งที่ควรดู',
			reviews: 'เสียงจากผู้ซื้อ',
			deal: 'ดีลที่ดีที่สุด',
			share: 'แชร์กับครอบครัว',
			products: 'สินค้า',
			empty: 'ไม่พบสินค้าที่ตรงกัน',
			clear: 'ล้างตัวกรอง'
		}
	};
	const t = $derived(copy[locale]);
	const eligible = $derived(
		[...new Set(productIds)].filter(
			(id) => resolve(id, 'name', locale) && resolve(id, 'price', locale)
		)
	);
	const top = $derived(eligible.slice(0, 3));
	const reviewGroups = $derived(
		top.flatMap((id) => {
			const name = resolve(id, 'name', locale);
			const quotes = ['review.0', 'review.1'].flatMap((field) => {
				const fact = resolve(id, field, locale);
				return fact ? [fact] : [];
			});
			return name && quotes.length ? [{ id, name, quotes }] : [];
		})
	);

	const ordered = $derived.by(() => {
		const result: Section[] = [];
		let claimedTop = false;
		const visibility: Record<Section, boolean> = {
			picks: top.length > 0,
			compare: top.length > 0 && layout !== 'table',
			matters: priorities.length > 0,
			reviews: reviewGroups.length > 0,
			deal: !comparePane && deal !== undefined && top.length > 0,
			share: !comparePane && share !== undefined,
			products: true
		};
		const requested = sections.map((section) =>
			Object.hasOwn(planSections, section)
				? planSections[section as keyof typeof planSections]
				: section
		);
		for (const entry of new Set(requested)) {
			if (!Object.hasOwn(visibility, entry)) continue;
			const section = entry as Section;
			if (section === 'products' || !visibility[section]) continue;
			if (section === 'picks' || section === 'compare') {
				if (claimedTop) continue;
				claimedTop = true;
			}
			result.push(section);
		}
		result.push('products');
		return { sections: result, remaining: claimedTop ? eligible.slice(top.length) : eligible };
	});
	const firstShelf = $derived(
		ordered.sections.find((section) => ['picks', 'compare', 'products'].includes(section))
	);
</script>

{#if !eligible.length}
	<section
		id={comparePane || !productTarget ? undefined : 'products'}
		tabindex="-1"
		class="empty min-w-0 border border-dashed border-[var(--seam,#858172)] p-4"
		aria-label={t.empty}
		lang={locale}
	>
		<h2 class="mx-0 mt-0 mb-2 border-0 border-none text-[1.125em]">
			{t.empty}
		</h2>
		{#if activeFilters.length}
			<ul>
				{#each activeFilters as filter, index (index)}<li>{filter}</li>{/each}
			</ul>
		{/if}
		{#if onClear}<button
				class="min-h-[var(--tap,44px)] border border-current bg-[var(--surface,#fff)] px-3 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
				type="button"
				onclick={onClear}
			>
				{t.clear}
			</button>{/if}
	</section>
{:else}
	<div class="sections grid min-w-0 grid-cols-1 gap-4" lang={locale}>
		{#each ordered.sections as section (section)}
			{#if section === 'products' && ordered.remaining.length}
				<section
					class="min-w-0"
					id={!comparePane && productTarget && firstShelf === section ? 'products' : undefined}
					tabindex="-1"
					aria-label={t.products}
				>
					{#if ordered.sections.length > 1}<h2
							class="mx-0 mt-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]"
						>
							{t.products}
						</h2>{/if}
					{#if renderShelf}{@render renderShelf(ordered.remaining, layout)}{:else}
						<ProductShelf
							productIds={ordered.remaining}
							{layout}
							{locale}
							{columns}
							{resolve}
							{listingHref}
							{categoryFor}
							{details}
							{vouchersFor}
						/>{/if}
				</section>
			{:else if section === 'picks' || section === 'compare'}
				<section
					class="min-w-0"
					id={!comparePane && productTarget && firstShelf === section ? 'products' : undefined}
					tabindex="-1"
					aria-label={t[section]}
				>
					<h2 class="mx-0 mt-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
						{t[section]}
					</h2>
					{#if renderShelf}{@render renderShelf(
							top,
							section === 'compare' ? 'table' : layout
						)}{:else}
						<ProductShelf
							productIds={top}
							layout={section === 'compare' ? 'table' : layout === 'large-print' ? layout : 'grid'}
							{locale}
							{columns}
							{resolve}
							{listingHref}
							{categoryFor}
							{details}
							{vouchersFor}
							extras={section === 'picks' ? reasons : undefined}
						/>{/if}
				</section>
			{:else if section === 'matters'}
				<section class="min-w-0" aria-label={t.matters}>
					<h2 class="mx-0 mt-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
						{t.matters}
					</h2>
					<ul>
						{#each priorities as priority, index (index)}<li>{priority[locale]}</li>{/each}
					</ul>
				</section>
			{:else if section === 'reviews'}
				<section class="min-w-0" aria-label={t.reviews}>
					<h2 class="mx-0 mt-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
						{t.reviews}
					</h2>
					{#each reviewGroups as group (group.id)}
						<h3 class="mx-0 mt-0 mb-2 text-[1.125em]"><Fact fact={group.name} /></h3>
						{#each group.quotes as quote (quote.field)}
							<blockquote
								class="mx-0 mt-0 mb-2 ps-3 [border-inline-start:1px_solid_var(--seam,#e9e6dc)]"
							>
								<Fact fact={quote} />
							</blockquote>
						{/each}
					{/each}
				</section>
			{:else if section === 'deal'}
				<section class="min-w-0" aria-label={t.deal}>
					<h2 class="mx-0 mt-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
						{t.deal}
					</h2>
					{@render deal?.(top[0])}
				</section>
			{:else if section === 'share'}
				<section class="min-w-0" aria-label={t.share}>
					<h2 class="mx-0 mt-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
						{t.share}
					</h2>
					{@render share?.()}
				</section>
			{/if}
		{/each}
	</div>
{/if}
