<script lang="ts">
	import { getStoreSession, returnToStore } from '#lib/storefront/store.svelte.ts';
	import { resolve } from '$app/paths';
	import '../../../lib/assets/fonts/plex.css';
	import FactsReceipt from '../../../lib/storefront/FactsReceipt.svelte';
	import ProductDeal from './ProductDeal.svelte';
	import ProductDescription from './ProductDescription.svelte';
	import SpecificationsSheet from './SpecificationsSheet.svelte';
	import type { PageProps } from './$types';

	const session = getStoreSession();
	let { data }: PageProps = $props();
	let proofRoot = $state<HTMLElement>();
	const th = $derived(data.language === 'th');
</script>

<svelte:head><title>{data.name.text} · DynamicShopper</title></svelte:head>

<main lang={data.language} data-product={data.id} data-theme={data.theme}>
	<header>
		<a
			class="back"
			href={resolve(returnToStore(session))}
			aria-label={th ? 'กลับหน้าร้าน' : 'Back to store'}
		>
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
		<a class="header-search" href={resolve(returnToStore(session))}>
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
		<a
			href={resolve(
				`/product/[id]?lang=${th ? 'en' : 'th'}${data.theme === 'standard' ? '' : `&theme=${data.theme}`}`,
				{
					id: data.pathId
				}
			)}
		>
			{th ? 'English' : 'ไทย'}
		</a>
	</header>
	<div bind:this={proofRoot}>
		<div class="listing">
			<div class="art" data-category={data.category} data-model={data.id} aria-hidden="true"></div>
			<section aria-labelledby="product-title">
				<dl class="prices">
					<div>
						<dt>{th ? 'ราคา' : 'Price'}</dt>
						<dd {...data.price.attributes}>{data.price.text}</dd>
					</div>
					{#if data.originalPrice}
						<div>
							<dt>{th ? 'ราคาเดิม' : 'Original price'}</dt>
							<dd {...data.originalPrice.attributes}><s>{data.originalPrice.text}</s></dd>
						</div>
					{/if}
					<div class="sold">
						<dt>{th ? 'ขายแล้ว' : 'Sold'}</dt>
						<dd {...data.sold.attributes}>{data.sold.text}</dd>
					</div>
				</dl>
				<h1 id="product-title" {...data.name.attributes}>{data.name.text}</h1>
				{#if data.shop}<p {...data.shop.attributes}>{data.shop.text}</p>{/if}
				<dl class="facts">
					<div>
						<dt>{th ? 'ค่าจัดส่ง' : 'Shipping'}</dt>
						<dd {...data.shipping.attributes}>{data.shipping.text}</dd>
					</div>
					<div>
						<dt>{th ? 'คะแนน' : 'Rating'}</dt>
						<dd {...data.rating.attributes}>{data.rating.text}</dd>
					</div>
				</dl>
				{#key data.id}
					<ProductDeal productId={data.id} locale={data.language} />
				{/key}
			</section>
		</div>
		<ProductDescription {data} />
		<SpecificationsSheet specs={data.specs} {th} />
	</div>
	<FactsReceipt root={proofRoot} locale={data.language} />
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
	main[data-theme='large'] {
		font-size: 1.25rem;
		--tap: 48px;
	}
	main[data-theme='large'] header a {
		min-block-size: 48px;
	}
	main[data-theme='large'] .prices .sold {
		font-size: 1.25rem;
	}
	main[data-theme='minimal'] {
		--seam: #ecebe6;
	}
	main[data-theme='vibrant'] {
		--seam: #e3e3ef;
		--accent: #2f3ccf;
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
	.art[data-category='power-bank'] {
		background-position: 100% 0;
	}
	.art[data-category='rice-cooker'] {
		background-position: 0 100%;
	}
	.art[data-model='cooker-one-button'] {
		background: #d0dce6 url('../../../lib/assets/products/cooker-one-button.jpg') center / cover
			no-repeat;
	}
	.art[data-category='skincare'] {
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
	.prices div:first-child dd {
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
