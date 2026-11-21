<script lang="ts">
	import { formatNumber } from '../../../lib/store-search';
	import ShopProducts from './ShopProducts.svelte';
	import SpecificationRows from './SpecificationRows.svelte';
	import type { catalog, Language, riceCookerSpecs } from '../../../lib/store-catalog';

	let {
		product,
		language,
		shopProducts,
		review,
		specs
	}: {
		product: (typeof catalog)[number];
		language: Language;
		shopProducts: typeof catalog;
		review?: string;
		specs?: (typeof riceCookerSpecs)[string];
	} = $props();
	const th = $derived(language === 'th');
</script>

{#if review}
	<section id="reviews" aria-label={th ? 'รีวิวสินค้า' : 'Product reviews'}>
		<h2 class="rating">
			<strong data-fact="rating" data-raw={product.rating}>{formatNumber(product.rating)}</strong>
			{th ? 'คะแนนสินค้า' : 'Product rating'}
		</h2>
		<blockquote data-fact="review" data-raw={review}>{review}</blockquote>
	</section>
{/if}

<ShopProducts shop={product.shop} products={shopProducts} {language} />

<section id="details" aria-labelledby="details-title">
	<h2 id="details-title">{th ? 'รายละเอียดสินค้า' : 'Product details'}</h2>
	<p data-fact="name" data-raw={product.name[language]}>{product.name[language]}</p>
	{#if product.id === 'cooker-1'}
		<div class="detail-photo" aria-hidden="true"></div>
	{/if}
	{#if specs}
		<h3>{th ? 'ข้อมูลสินค้า' : 'Product information'}</h3>
		<SpecificationRows {specs} {th} />
	{/if}
</section>

<style>
	section {
		scroll-margin-top: 4rem;
		border-top: 0.5rem solid #f3f3f3;
		padding: 1rem;
	}
	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
	}
	p {
		margin: 0;
	}
	.detail-photo {
		margin-block: 0.85rem 1rem;
		aspect-ratio: 1;
		width: min(100%, 32rem);
		background: #d0dce6 url('../../../lib/assets/products/cooker-one-button.jpg') center / cover
			no-repeat;
	}
	h3 {
		font-size: 1rem;
		margin-block: 1rem 0.25rem;
	}
	.rating {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
		font-weight: 600;
	}
	.rating strong {
		font-family: var(--product-figure-font);
		font-size: 1.4rem;
	}
	blockquote {
		margin: 0.65rem 0 0;
		padding: 0.75rem;
		background: #fbfbf8;
		border: 1px solid #e9e6dc;
	}
</style>
