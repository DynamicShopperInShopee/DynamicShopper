<script lang="ts">
	import type { PageData } from './$types';

	let {
		data
	}: {
		data: Pick<PageData, 'language' | 'rating' | 'reviewCount' | 'reviews' | 'shop' | 'summary'>;
	} = $props();
	const th = $derived(data.language === 'th');
</script>

<section id="reviews" aria-labelledby="reviews-title">
	<h2 id="reviews-title">{th ? 'รีวิวสินค้า' : 'Product reviews'}</h2>
	<p class="rating">
		<strong {...data.rating.attributes}>{data.rating.text}</strong>
		{th ? 'คะแนนสินค้า' : 'Product rating'}
	</p>
	<p class="review-count">
		<span {...data.reviewCount.attributes}>{data.reviewCount.text}</span>
		{th ? 'รีวิว' : 'reviews'}
	</p>
	{#each data.reviews as review (review.attributes['data-fact'])}
		<blockquote {...review.attributes}>{review.text}</blockquote>
	{/each}
</section>

{#if data.shop}
	<section aria-labelledby="seller-title">
		<h2 id="seller-title">{th ? 'ร้านค้า' : 'Shop'}</h2>
		<p {...data.shop.attributes}>{data.shop.text}</p>
	</section>
{/if}

<section id="details" aria-labelledby="details-title">
	<h2 id="details-title">{th ? 'รายละเอียดสินค้า' : 'Product details'}</h2>
	<p {...data.summary.attributes}>{data.summary.text}</p>
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
	.rating strong,
	.review-count span {
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
	}
	.rating strong {
		font-size: 1.4rem;
	}
	blockquote {
		margin: 0.65rem 0 0;
		padding: 0.75rem;
		background: #fbfbf8;
		border: 1px solid #e9e6dc;
	}
</style>
