<script lang="ts">
	import { resolveCatalogFact } from './catalogFact';
	import type { Snippet } from 'svelte';
	import Fact from './Fact.svelte';
	import FactsSlip from './FactsSlip.svelte';
	import type { FactLocale, LocalizedText, ResolvePrintedFact } from './verifyFacts';

	type Detail = 'summary' | 'specs' | 'reviews';
	const detailOrder: readonly Detail[] = ['summary', 'specs', 'reviews'];

	let {
		productId,
		locale,
		resolve = resolveCatalogFact,
		storeHref,
		specs,
		order = detailOrder,
		onAdd,
		onBestPrice,
		media,
		deal,
		canAdd = true,
		pending = false
	}: {
		productId: string;
		locale: FactLocale;
		resolve?: ResolvePrintedFact;
		storeHref: string;
		specs: readonly { field: string; label: LocalizedText }[];
		order?: readonly Detail[];
		onAdd: (productId: string) => void;
		onBestPrice: (productId: string) => void;
		media?: Snippet;
		deal?: Snippet;
		canAdd?: boolean;
		pending?: boolean;
	} = $props();

	const copy = {
		en: {
			back: 'Back to the store',
			missing: 'Product not found',
			add: 'Add to cart',
			best: 'Best price',
			full: 'Your cart is full',
			price: 'Price',
			originalPrice: 'Original price',
			shipping: 'Shipping',
			rating: 'Rating',
			reviewCount: 'Reviews',
			sold: 'Sold',
			summary: 'Summary',
			specs: 'Key specs',
			reviews: 'Reviews'
		},
		th: {
			back: 'กลับหน้าร้าน',
			missing: 'ไม่พบสินค้า',
			add: 'เพิ่มในตะกร้า',
			best: 'ดูราคาที่ดีที่สุด',
			full: 'ตะกร้าเต็มแล้ว',
			price: 'ราคา',
			originalPrice: 'ราคาเดิม',
			shipping: 'ค่าจัดส่ง',
			rating: 'คะแนน',
			reviewCount: 'จำนวนรีวิว',
			sold: 'ขายแล้ว',
			summary: 'สรุปสินค้า',
			specs: 'สเปกสำคัญ',
			reviews: 'รีวิว'
		}
	} as const;
	const t = $derived(copy[locale]);
	const headlineFields = [
		'price',
		'originalPrice',
		'shipping',
		'rating',
		'reviewCount',
		'sold'
	] as const;
	let shelf = $state<HTMLElement>();

	const name = $derived(resolve(productId, 'name', locale));
	const price = $derived(resolve(productId, 'price', locale));
	const details = $derived([...new Set([...order, ...detailOrder])]);
	const summary = $derived(resolve(productId, 'summary', locale));
	const specsFound = $derived(
		specs.flatMap(({ field, label }) => {
			const fact = resolve(productId, field, locale);
			return fact ? [{ label: label[locale], fact }] : [];
		})
	);
	const reviews = $derived(
		['review.0', 'review.1'].flatMap((field) => {
			const fact = resolve(productId, field, locale);
			return fact ? [fact] : [];
		})
	);
</script>

<div class="listing min-w-0 text-[var(--ink,#16161a)]" lang={locale}>
	<!-- eslint-disable svelte/no-navigation-without-resolve -- The caller supplies the resolved storefront URL. -->
	<a
		class="back inline-flex min-h-[var(--tap,44px)] items-center text-inherit underline-offset-[0.15em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
		href={storeHref}
	>
		{t.back}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{#if name && price}
		<div bind:this={shelf}>
			<header class="mb-3 border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4">
				{@render media?.()}
				<h1 class="m-0"><Fact fact={name} /></h1>
				<dl class="m-0 my-2">
					{#each headlineFields as field (field)}
						{@const fact = resolve(productId, field, locale)}
						{#if fact}
							<div
								class="row group/product-listing grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-1 [border-bottom:1px_dotted_var(--seam,#e9e6dc)]"
								class:price={field === 'price'}
							>
								<dt>{t[field]}</dt>
								<dd
									class="m-0 text-end font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] tabular-nums group-[.price]/product-listing:text-[1.5em] group-[.price]/product-listing:font-bold"
								>
									<Fact {fact} />
								</dd>
							</div>
						{/if}
					{/each}
				</dl>
				<div class="actions flex flex-wrap gap-2">
					<button
						class="inline-flex min-h-[var(--tap,44px)] items-center rounded-[var(--radius,4px)] border border-current bg-[var(--surface,#fff)] px-3 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
						type="button"
						disabled={!canAdd}
						onclick={() => onAdd(productId)}
					>
						{t.add}
					</button>
					<button
						class="inline-flex min-h-[var(--tap,44px)] items-center rounded-[var(--radius,4px)] border border-current bg-[var(--surface,#fff)] px-3 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
						type="button"
						disabled={pending}
						onclick={() => onBestPrice(productId)}
					>
						{t.best}
					</button>
				</div>
				{#if !canAdd}<p class="m-0" role="status">{t.full}</p>{/if}
			</header>

			{#each details as detail (detail)}
				{#if detail === 'summary' && summary}
					<section
						class="mb-3 border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4"
						data-listing-section={detail}
					>
						<h2 class="m-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
							{t.summary}
						</h2>
						<p class="m-0"><Fact fact={summary} /></p>
					</section>
				{:else if detail === 'specs' && specsFound.length}
					<section
						class="mb-3 border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4"
						data-listing-section={detail}
					>
						<h2 class="m-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
							{t.specs}
						</h2>
						<dl class="m-0">
							{#each specsFound as row (row.fact.field)}
								<div
									class="row grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-1 [border-bottom:1px_dotted_var(--seam,#e9e6dc)]"
								>
									<dt>{row.label}</dt>
									<dd
										class="m-0 text-end font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] tabular-nums"
									>
										<Fact fact={row.fact} />
									</dd>
								</div>
							{/each}
						</dl>
					</section>
				{:else if detail === 'reviews' && reviews.length}
					<section
						class="mb-3 border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4"
						data-listing-section={detail}
					>
						<h2 class="m-0 mb-2 text-[1.125em] [border-bottom:2px_solid_currentColor]">
							{t.reviews}
						</h2>
						{#each reviews as review (review.field)}
							<blockquote class="m-0 py-1"><Fact fact={review} /></blockquote>
						{/each}
					</section>
				{/if}
			{/each}
		</div>
		<FactsSlip scope={shelf} {resolve} {locale} />
		{@render deal?.()}
	{:else}
		<section
			class="missing mb-3 border border-dashed border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4"
		>
			<h1 class="m-0">{t.missing}</h1>
		</section>
	{/if}
</div>
