<script lang="ts">
	import type { Snippet } from 'svelte';
	import Fact from './Fact.svelte';
	import FactsSlip from './FactsSlip.svelte';
	import type { FactLocale, LocalizedText, ResolvePrintedFact } from './verifyFacts';

	type Detail = 'summary' | 'specs' | 'reviews';
	const detailOrder: readonly Detail[] = ['summary', 'specs', 'reviews'];

	let {
		productId,
		locale,
		resolve,
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
		resolve: ResolvePrintedFact;
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

<div class="listing" lang={locale}>
	<a class="back" href={storeHref}>{t.back}</a>
	{#if name && price}
		<div bind:this={shelf}>
			<header>
				{@render media?.()}
				<h1><Fact fact={name} /></h1>
				<dl>
					{#each headlineFields as field (field)}
						{@const fact = resolve(productId, field, locale)}
						{#if fact}
							<div class="row" class:price={field === 'price'}>
								<dt>{t[field]}</dt>
								<dd><Fact {fact} /></dd>
							</div>
						{/if}
					{/each}
				</dl>
				<div class="actions">
					<button type="button" disabled={!canAdd} onclick={() => onAdd(productId)}>{t.add}</button>
					<button type="button" disabled={pending} onclick={() => onBestPrice(productId)}>
						{t.best}
					</button>
				</div>
				{#if !canAdd}<p role="status">{t.full}</p>{/if}
			</header>

			{#each details as detail (detail)}
				{#if detail === 'summary' && summary}
					<section data-listing-section={detail}>
						<h2>{t.summary}</h2>
						<p><Fact fact={summary} /></p>
					</section>
				{:else if detail === 'specs' && specsFound.length}
					<section data-listing-section={detail}>
						<h2>{t.specs}</h2>
						<dl>
							{#each specsFound as row (row.fact.field)}
								<div class="row">
									<dt>{row.label}</dt>
									<dd><Fact fact={row.fact} /></dd>
								</div>
							{/each}
						</dl>
					</section>
				{:else if detail === 'reviews' && reviews.length}
					<section data-listing-section={detail}>
						<h2>{t.reviews}</h2>
						{#each reviews as review (review.field)}
							<blockquote><Fact fact={review} /></blockquote>
						{/each}
					</section>
				{/if}
			{/each}
		</div>
		<FactsSlip scope={shelf} {resolve} {locale} />
		{@render deal?.()}
	{:else}
		<section class="missing"><h1>{t.missing}</h1></section>
	{/if}
</div>

<style>
	.listing {
		color: var(--ink, #16161a);
		min-width: 0;
	}
	.back,
	button {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap, 44px);
		color: inherit;
	}
	.back {
		text-underline-offset: 0.15em;
	}
	h1,
	h2,
	dl,
	dd,
	p,
	blockquote {
		margin: 0;
	}
	h2 {
		font-size: 1.125em;
		border-bottom: 2px solid currentColor;
		margin-bottom: 0.5rem;
	}
	header,
	section {
		padding: 1rem;
		margin-bottom: 0.75rem;
		border: 1px solid var(--seam, #e9e6dc);
		background: var(--surface, #fff);
	}
	header dl {
		margin-block: 0.5rem;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 0.75rem;
		padding-block: 0.25rem;
		border-bottom: 1px dotted var(--seam, #e9e6dc);
	}
	.row dd {
		text-align: end;
		font-family: var(--mono, 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace);
		font-variant-numeric: tabular-nums;
	}
	.price dd {
		font-size: 1.5em;
		font-weight: 700;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	button {
		padding-inline: 0.75rem;
		border: 1px solid currentColor;
		border-radius: var(--radius, 4px);
		background: var(--surface, #fff);
		font: inherit;
	}
	a:focus-visible,
	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	blockquote {
		padding-block: 0.25rem;
	}
	.missing {
		border-style: dashed;
	}
</style>
