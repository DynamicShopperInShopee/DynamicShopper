<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Category } from '#lib/store-catalog.js';
	import Fact from './Fact.svelte';
	import ProductShelf from './ProductShelf.svelte';
	import type { FactLocale, LocalizedText, ResolvePrintedFact } from './verifyFacts';

	type Section = 'picks' | 'compare' | 'matters' | 'reviews' | 'deal' | 'share' | 'products';
	type Layout = 'grid' | 'table' | 'large-print';

	let {
		sections,
		productIds,
		layout,
		locale,
		columns,
		resolve,
		listingHref,
		categoryFor,
		reasons,
		priorities = [],
		deal,
		share,
		activeFilters = [],
		onClear,
		comparePane = false
	}: {
		sections: readonly string[];
		productIds: readonly string[];
		layout: Layout;
		locale: FactLocale;
		columns: readonly { field: string; label: LocalizedText }[];
		resolve: ResolvePrintedFact;
		listingHref: (id: string) => string;
		categoryFor?: (id: string) => Category | undefined;
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
		for (const entry of new Set(sections)) {
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
	<section id="products" tabindex="-1" class="empty" aria-label={t.empty} lang={locale}>
		<h2>{t.empty}</h2>
		{#if activeFilters.length}
			<ul>
				{#each activeFilters as filter}<li>{filter}</li>{/each}
			</ul>
		{/if}
		{#if onClear}<button type="button" onclick={onClear}>{t.clear}</button>{/if}
	</section>
{:else}
	<div class="sections" lang={locale}>
		{#each ordered.sections as section (section)}
			{#if section === 'products' && ordered.remaining.length}
				<section
					id={firstShelf === section ? 'products' : undefined}
					tabindex="-1"
					aria-label={t.products}
				>
					{#if ordered.sections.length > 1}<h2>{t.products}</h2>{/if}
					<ProductShelf
						productIds={ordered.remaining}
						{layout}
						{locale}
						{columns}
						{resolve}
						{listingHref}
						{categoryFor}
					/>
				</section>
			{:else if section === 'picks' || section === 'compare'}
				<section
					id={firstShelf === section ? 'products' : undefined}
					tabindex="-1"
					aria-label={t[section]}
				>
					<h2>{t[section]}</h2>
					<ProductShelf
						productIds={top}
						layout={section === 'compare' ? 'table' : layout === 'large-print' ? layout : 'grid'}
						{locale}
						{columns}
						{resolve}
						{listingHref}
						{categoryFor}
						extras={section === 'picks' ? reasons : undefined}
					/>
				</section>
			{:else if section === 'matters'}
				<section aria-label={t.matters}>
					<h2>{t.matters}</h2>
					<ul>
						{#each priorities as priority}<li>{priority[locale]}</li>{/each}
					</ul>
				</section>
			{:else if section === 'reviews'}
				<section aria-label={t.reviews}>
					<h2>{t.reviews}</h2>
					{#each reviewGroups as group (group.id)}
						<h3><Fact fact={group.name} /></h3>
						{#each group.quotes as quote (quote.field)}
							<blockquote><Fact fact={quote} /></blockquote>
						{/each}
					{/each}
				</section>
			{:else if section === 'deal'}
				<section aria-label={t.deal}>
					<h2>{t.deal}</h2>
					{@render deal?.(top[0])}
				</section>
			{:else if section === 'share'}
				<section aria-label={t.share}>
					<h2>{t.share}</h2>
					{@render share?.()}
				</section>
			{/if}
		{/each}
	</div>
{/if}

<style>
	.sections {
		display: grid;
		gap: 1rem;
		min-width: 0;
		grid-template-columns: minmax(0, 1fr);
	}
	section {
		min-width: 0;
	}
	h2,
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1.125em;
	}
	h2 {
		border-bottom: 2px solid currentColor;
	}
	blockquote {
		margin: 0 0 0.5rem;
		padding-inline-start: 0.75rem;
		border-inline-start: 1px solid var(--seam, #e9e6dc);
	}
	.empty {
		padding: 1rem;
		border: 1px dashed var(--seam, #858172);
	}
	.empty h2 {
		border: 0;
	}
	button {
		min-height: var(--tap, 44px);
		font: inherit;
		color: inherit;
		background: var(--surface, #fff);
		border: 1px solid currentColor;
		padding-inline: 0.75rem;
	}
	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
</style>
