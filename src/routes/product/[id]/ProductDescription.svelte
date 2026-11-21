<script lang="ts">
	import type { ShopperPlan } from '#lib/personalization/plan.ts';
	import type { PageData } from './$types';
	import ProductReviews from './ProductReviews.svelte';
	import SellerShelf from './SellerShelf.svelte';
	import ListingInformation from './ListingInformation.svelte';

	let {
		data,
		details,
		openSpecifications
	}: {
		data: PageData;
		details?: ShopperPlan['details'];
		openSpecifications?: (trigger: HTMLButtonElement) => void;
	} = $props();

	const th = $derived(data.language === 'th');
	const sectionOrder = $derived(new Set([...(details ?? []), 'summary', 'specs', 'reviews']));
</script>

{#if details}
	<div id="details" tabindex="-1">
		{#each sectionOrder as section (section)}
			{#if section === 'summary'}
				<section
					class="slip"
					data-listing-section="summary"
					aria-labelledby="listing-summary-title"
				>
					<h2 id="listing-summary-title">{th ? 'สรุปสินค้า' : 'Product summary'}</h2>
					<p {...data.summary.attributes}>{data.summary.text}</p>
				</section>
			{:else if section === 'specs' && data.specs.length}
				<section class="slip" data-listing-section="specs" aria-labelledby="listing-specs-title">
					<h2 id="listing-specs-title">{th ? 'ข้อมูลสินค้า' : 'Product information'}</h2>
					<dl>
						{#each data.specs as spec (spec.attributes['data-fact'])}
							<div>
								<dt>{spec.label}</dt>
								<dd {...spec.attributes}>{spec.text}</dd>
							</div>
						{/each}
					</dl>
				</section>
			{:else if section === 'reviews' && data.reviews.length}
				<div data-listing-section="reviews">
					{#key data.id + data.language}
						<ProductReviews {data} receipt />
					{/key}
				</div>
			{/if}
		{/each}
	</div>
	{#if data.shop}<SellerShelf {data} />{/if}
	{#if data.specs.length || data.id === 'cooker-one-button'}
		<ListingInformation {data} {openSpecifications} receipt />
	{/if}
{:else}
	{#key data.id + data.language}
		<ProductReviews {data} />
	{/key}
	{#if data.shop}<SellerShelf {data} />{/if}
	<ListingInformation {data} {openSpecifications} />
{/if}

<style>
	#details {
		scroll-margin-top: 4rem;
	}
	.slip {
		border-top: 1px solid var(--seam, #e9e6dc);
		padding: 1rem 0.8rem;
	}
	.slip h2 {
		margin: 0 auto 0.75rem;
		padding-bottom: 0.35em;
		border-bottom: 2px solid currentColor;
		font-size: 1.125em;
		font-weight: 600;
	}
	.slip :is(h2, p, dl) {
		max-width: 56rem;
		margin-inline: auto;
	}
	dl div {
		display: grid;
		grid-template-columns: fit-content(40%) minmax(0, 1fr) fit-content(50%);
		align-items: baseline;
		gap: 0.4em;
		padding-block: 0.3em;
	}
	dl div::before {
		content: '';
		grid-column: 2;
		grid-row: 1;
		border-bottom: 2px dotted var(--seam, #e9e6dc);
	}
	dt,
	dd {
		overflow-wrap: anywhere;
	}
	dd {
		grid-column: 3;
		margin: 0;
		text-align: end;
		font-family: var(--product-figure-font);
	}
</style>
