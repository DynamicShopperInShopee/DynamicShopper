<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { defaultPlan } from '#lib/personalization/plan.ts';
	import ProductChat from '#lib/storefront/ProductChat.svelte';
	import { getStoreSession } from '#lib/storefront/store.svelte.ts';
	import ListingHeader from './ListingHeader.svelte';
	import '../../../lib/assets/fonts/plex.css';
	import FactsReceipt from '../../../lib/storefront/FactsReceipt.svelte';
	import CartControls from '../../../lib/storefront/CartControls.svelte';
	import AddToCart from '../../../lib/storefront/AddToCart.svelte';
	import ProductDeal from '../../../lib/storefront/ProductDeal.svelte';
	import ProductSummary from './ProductSummary.svelte';
	import ProductGallery from './ProductGallery.svelte';
	import '../../../lib/assets/products/cooker-photos.css';
	import '../../../lib/assets/products/shelf-photos.css';
	import ProductDescription from './ProductDescription.svelte';
	import SpecificationsSheet from './SpecificationsSheet.svelte';
	import type { PageProps } from './$types';

	const session = getStoreSession();
	let { data }: PageProps = $props();
	let hero = $state<HTMLDivElement>();
	let sheet = $state<HTMLDialogElement>();
	let proofRoot = $state<HTMLElement>();
	let productDeal = $state<{ showCart: () => Promise<void> }>();
	const th = $derived(data.language === 'th');
	afterNavigate(() => session.listing.record(data.id));

	function openSpecifications(trigger: HTMLButtonElement) {
		if (!sheet || sheet.open) return;
		trigger.focus({ preventScroll: true });
		sheet.showModal();
	}
</script>

<svelte:head><title>{data.name.text} · DynamicShopper</title></svelte:head>

<main lang={data.language} data-product={data.id} data-theme={data.theme}>
	<ListingHeader
		{data}
		backQuery={data.receiptQuery ? session.visit?.search.slice(1) || data.receiptQuery : ''}
		{hero}
	>
		<CartControls locale={data.language} onBestPrice={() => void productDeal?.showCart()} />
	</ListingHeader>
	<div bind:this={proofRoot}>
		<div class="listing">
			<div
				class="art"
				class:demo-photo={data.id !== 'cooker-one-button'}
				bind:this={hero}
				data-category={data.photoCategory}
				data-model={data.photoModel}
				data-cooker-photo={data.id}
				aria-hidden={data.id === 'cooker-one-button' ? undefined : true}
			>
				{#if data.id === 'cooker-one-button'}<ProductGallery {th} />{/if}
			</div>
			<ProductSummary {data}>
				{#key data.id}
					<ProductDeal bind:this={productDeal} productId={data.id} locale={data.language}>
						<AddToCart productId={data.id} locale={data.language} onAdd={session.addProduct} />
					</ProductDeal>
				{/key}
			</ProductSummary>
		</div>
		<ProductDescription
			{data}
			details={data.receiptQuery
				? (data.listingDetails ?? session.visit?.plan.details ?? defaultPlan.details)
				: undefined}
			openSpecifications={sheet ? openSpecifications : undefined}
		/>
		<SpecificationsSheet {data} {th} bind:sheet />
	</div>
	<FactsReceipt root={proofRoot} locale={data.language} />
	{#if data.receiptQuery}<ProductChat
			productId={data.id}
			locale={data.language}
			theme={data.theme}
		/>{/if}
</main>

<style>
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
	}
	.art:not(.demo-photo) {
		background: #d0dce6;
	}

	@media (max-width: 699px) {
		main[data-theme='large'] {
			--gallery-caption-top: 68px;
			--gallery-caption-surface: #fff;
			--gallery-caption-ink: #16161a;
			--gallery-caption-padding: 0.125em 0.25em;
		}
		main {
			padding-bottom: calc(var(--listing-actions-height, 60px) + 1rem);
		}
	}
	@media (min-width: 700px) {
		.listing {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
</style>
