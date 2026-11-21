<script lang="ts">
	import { formatNumber } from '../../../lib/store-search';
	import ProductDetails from './ProductDetails.svelte';
	import ShopProducts from './ShopProducts.svelte';
	import type { catalog, Language, riceCookerSpecs } from '../../../lib/store-catalog';

	let {
		product,
		language,
		shopProducts,
		review,
		specs,
		openSpecifications
	}: {
		product: (typeof catalog)[number];
		language: Language;
		shopProducts: typeof catalog;
		review?: string;
		specs?: (typeof riceCookerSpecs)[string];
		openSpecifications: (trigger: HTMLButtonElement) => void;
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

<ProductDetails {product} {language} {specs} {openSpecifications} />

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
