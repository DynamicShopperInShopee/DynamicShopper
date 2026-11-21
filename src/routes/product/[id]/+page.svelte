<script lang="ts">
	import { getStoreSession } from '#lib/storefront/store.svelte.ts';
	import ListingHeader from './ListingHeader.svelte';
	import '../../../lib/assets/fonts/plex.css';
	import FactsReceipt from '../../../lib/storefront/FactsReceipt.svelte';
	import CartControls from '../../../lib/storefront/CartControls.svelte';
	import AddToCart from '../../../lib/storefront/AddToCart.svelte';
	import ProductDeal from '../../../lib/storefront/ProductDeal.svelte';
	import ProductGallery from './ProductGallery.svelte';
	import '../../../lib/assets/products/cooker-photos.css';
	import ProductDescription from './ProductDescription.svelte';
	import SpecificationsSheet from './SpecificationsSheet.svelte';
	import type { PageProps } from './$types';

	const session = getStoreSession();
	let { data }: PageProps = $props();
	let hero = $state<HTMLDivElement>();
	let proofRoot = $state<HTMLElement>();
	let productDeal = $state<ReturnType<typeof ProductDeal>>();
	const th = $derived(data.language === 'th');
</script>

<svelte:head><title>{data.name.text} · DynamicShopper</title></svelte:head>

<main lang={data.language} data-product={data.id} data-theme={data.theme}>
	<ListingHeader
		data={{ ...data, receiptQuery: session.visit?.search.slice(1) ?? data.receiptQuery }}
		{hero}
	/>
	<div class="listing-cart">
		<CartControls
			locale={data.language}
			onBestPrice={(basket) => productDeal?.showBasket(basket)}
		/>
	</div>
	<div bind:this={proofRoot}>
		<div class="listing">
			<div
				class="art"
				bind:this={hero}
				data-category={data.category}
				data-model={data.id}
				data-cooker-photo={data.id}
				aria-hidden={data.id === 'cooker-one-button' ? undefined : true}
			>
				{#if data.id === 'cooker-one-button'}<ProductGallery {th} />{/if}
			</div>
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
					<ProductDeal
						bind:this={productDeal}
						productId={data.id}
						locale={data.language}
						quantity={session.cart.find(({ productId }) => productId === data.id)?.quantity}
					>
						<AddToCart
							productId={data.id}
							locale={data.language}
							onAdd={(id) => session.addProduct(id)}
						/>
					</ProductDeal>
				{/key}
			</section>
		</div>
		<ProductDescription {data} />
		<SpecificationsSheet specs={data.specs} {th} />
	</div>
	<FactsReceipt root={proofRoot} locale={data.language} />
</main>

<style>
	.listing-cart {
		display: flex;
		justify-content: flex-end;
		padding-inline: 1rem;
	}
	main {
		--product-figure-font: 'IBM Plex Mono', 'IBM Plex Sans Thai', ui-monospace, monospace;
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
		--action-font-floor: 1.25rem;
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
		background-image: var(--cooker-image, url('../../../lib/assets/products/demo-categories.jpg'));
		background-position: var(--cooker-position, 0 100%);
		background-size: var(--cooker-size, 300% 200%);
	}
	.art[data-model='cooker-one-button'] {
		background: #d0dce6;
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
		font-family: var(--product-figure-font);
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
	@media (max-width: 699px) {
		main {
			padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
		}
	}
	@media (min-width: 700px) {
		.listing {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
</style>
