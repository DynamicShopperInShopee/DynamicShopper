<script lang="ts">
	import { resolve } from '$app/paths';
	import '../../../lib/assets/fonts/plex.css';
	import { riceCookerReviews, riceCookerSpecs } from '../../../lib/store-catalog';
	import { formatBaht, formatNumber } from '../../../lib/store-search';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const product = $derived(data.product);
	const th = $derived(data.language === 'th');
	const specs = $derived(riceCookerSpecs[product.id]);
	import SpecificationsSheet from './SpecificationsSheet.svelte';
	import ProductDescription from './ProductDescription.svelte';
	const review = $derived(riceCookerReviews[product.id]?.[data.language]);
</script>

<svelte:head><title>{product.name[data.language]} · DynamicShopper</title></svelte:head>

<main lang={data.language} data-product={product.id}>
	<header>
		<a class="back" href={resolve('/')} aria-label={th ? 'กลับหน้าร้าน' : 'Back to store'}>
			<svg
				viewBox="0 0 24 24"
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				aria-hidden="true"
			>
				<path d="M21 12H4m7-7-7 7 7 7" />
			</svg>
		</a>
		<a class="header-search" href={resolve('/')}>
			<svg
				viewBox="0 0 20 20"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<circle cx="8" cy="8" r="5" /><path d="m12 12 5 5" />
			</svg>
			{th ? 'ค้นหาสินค้า' : 'Search products'}
		</a>
		<a href={`${resolve('/product/[id]', { id: product.id })}?lang=${th ? 'en' : 'th'}`}>
			{th ? 'English' : 'ไทย'}
		</a>
	</header>
	<div class="listing">
		<div
			class="art"
			data-category={product.category}
			data-model={product.id}
			aria-hidden="true"
		></div>
		<section aria-labelledby="product-title">
			<dl class="prices">
				<div>
					<dt>{th ? 'ราคา' : 'Price'}</dt>
					<dd data-fact="price" data-raw={product.price}>{formatBaht(product.price)}</dd>
				</div>
				{#if product.originalPrice !== null}
					<div>
						<dt>{th ? 'ราคาเดิม' : 'Original price'}</dt>
						<dd data-fact="originalPrice" data-raw={product.originalPrice}>
							<s>{formatBaht(product.originalPrice)}</s>
						</dd>
					</div>
				{/if}
				<div class="sold">
					<dt>{th ? 'ขายแล้ว' : 'Sold'}</dt>
					<dd data-fact="sold" data-raw={product.sold}>{formatNumber(product.sold)}</dd>
				</div>
			</dl>
			<h1 id="product-title" data-fact="name" data-raw={product.name[data.language]}>
				{product.name[data.language]}
			</h1>
			<p data-fact="shop" data-raw={product.shop}>{product.shop}</p>
			<dl class="facts">
				<div>
					<dt>{th ? 'ค่าจัดส่ง' : 'Shipping'}</dt>
					<dd data-fact="shipping" data-raw={product.shipping}>
						{product.shipping === 0 ? (th ? 'ฟรี' : 'Free') : formatBaht(product.shipping)}
					</dd>
				</div>
				<div>
					<dt>{th ? 'คะแนน' : 'Rating'}</dt>
					<dd data-fact="rating" data-raw={product.rating}>{formatNumber(product.rating)}</dd>
				</div>
			</dl>
		</section>
	</div>
	<ProductDescription {product} language={data.language} {review} />
	{#if specs}
		<SpecificationsSheet {specs} {th} hasReview={Boolean(review)} />
	{/if}
</main>

<style>
	main {
		max-width: 72rem;
		margin: auto;
		padding: 0 0 2rem;
		font-family: 'IBM Plex Sans Thai', system-ui, sans-serif;
		color: #16161a;
		background: #fff;
	}
	header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		border-bottom: 1px solid #e9e6dc;
		position: sticky;
		top: 0;
		z-index: 1;
		background: #fff;
		padding: 0.375rem 0.75rem;
	}
	header a {
		min-height: 44px;
		display: flex;
		align-items: center;
		color: inherit;
	}
	.back {
		flex: 0 0 44px;
		justify-content: center;
	}
	.header-search {
		flex: 1;
		min-width: 0;
		gap: 0.5rem;
		padding-inline: 0.65rem;
		background: #f4f4f4;
	}
	.listing {
		display: grid;
		gap: 0;
	}
	.art {
		width: 100%;
		aspect-ratio: 1;
		background: white url('../../../lib/assets/products/demo-categories.jpg') no-repeat 0 0 / 300%
			200%;
	}
	.art[data-category='earbuds'] {
		background-position: 50% 0;
	}
	.art[data-category='power'] {
		background-position: 100% 0;
	}
	.art[data-category='cooker'] {
		background-position: 0 100%;
	}
	.art[data-model='cooker-1'] {
		background: #d0dce6 url('../../../lib/assets/products/cooker-one-button.jpg') center / cover
			no-repeat;
	}
	.art[data-category='skin'] {
		background-position: 50% 100%;
	}

	dl {
		margin: 1rem 0;
		border-block: 1px dashed #777;
		padding-block: 0.5rem;
	}
	dl div {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 0.25rem 0;
	}
	dd {
		margin: 0;
		font-family: 'IBM Plex Mono', ui-monospace, monospace;
	}
	section {
		min-width: 0;
		padding: 0 1rem;
	}
	h1 {
		overflow-wrap: anywhere;
		font-size: 1.25rem;
		line-height: 1.4;
		margin: 0.75rem 0 0.25rem;
	}
	p {
		margin: 0 0 0.75rem;
	}
	.prices {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		align-items: baseline;
		border-top: 0;
		border-bottom: 1px solid #e9e6dc;
	}
	.prices div {
		display: block;
	}
	.prices dt {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.prices .sold {
		display: flex;
		gap: 0.25rem;
		margin-inline-start: auto;
		font-size: 0.875rem;
	}
	.prices .sold dt {
		position: static;
		width: auto;
		height: auto;
		overflow: visible;
		clip-path: none;
	}
	.prices dd[data-fact='price'] {
		font-size: 1.7rem;
		font-weight: 700;
	}
	.facts {
		border: 0;
		margin: 0;
	}
	.facts div {
		min-height: 44px;
		align-items: center;
		border-top: 1px solid #e9e6dc;
	}
	@media (min-width: 700px) {
		.listing {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
</style>
