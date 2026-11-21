<script lang="ts">
	import { formatNumber } from '../../../lib/store-search';
	import type { catalog, Language } from '../../../lib/store-catalog';

	let {
		product,
		language,
		review
	}: {
		product: (typeof catalog)[number];
		language: Language;
		review?: string;
	} = $props();
	const th = $derived(language === 'th');
</script>

{#if review}
	<section id="reviews" aria-labelledby="reviews-title">
		<h2 id="reviews-title">{th ? 'รีวิวสินค้า' : 'Product reviews'}</h2>
		<p class="rating">
			<strong data-fact="rating" data-raw={product.rating}>{formatNumber(product.rating)}</strong>
			{th ? 'คะแนนสินค้า' : 'Product rating'}
		</p>
		<blockquote data-fact="review" data-raw={review}>{review}</blockquote>
	</section>
{/if}

<section aria-labelledby="seller-title">
	<h2 id="seller-title">{th ? 'ร้านค้า' : 'Shop'}</h2>
	<p data-fact="shop" data-raw={product.shop}>{product.shop}</p>
</section>

<section id="details" aria-labelledby="details-title">
	<h2 id="details-title">{th ? 'รายละเอียดสินค้า' : 'Product details'}</h2>
	<p data-fact="name" data-raw={product.name[language]}>{product.name[language]}</p>
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
	.rating {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}
	.rating strong {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
		font-size: 1.4rem;
	}
	blockquote {
		margin: 0.65rem 0 0;
		padding: 0.75rem;
		background: #fbfbf8;
		border: 1px solid #e9e6dc;
	}
</style>
