<script lang="ts">
	import { afterNavigate } from '$app/navigation';
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

<main class="group/listing m-auto max-w-6xl bg-white pb-8 font-['IBM_Plex_Sans_Thai',system-ui,sans-serif] text-[#16161a] [--product-figure-font:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',ui-monospace,monospace] data-[theme=large]:text-[1.25rem] data-[theme=large]:[--action-font-floor:1.25rem] data-[theme=large]:[--tap:48px] data-[theme=minimal]:[--seam:#ecebe6] data-[theme=vibrant]:[--accent:#2f3ccf] data-[theme=vibrant]:[--seam:#e3e3ef] [@media(max-width:699px)]:pb-[calc(var(--listing-actions-height,60px)+1rem)] [@media(max-width:699px)]:[--gallery-caption-top:68px] [@media(max-width:699px)]:data-[theme=large]:[--gallery-caption-ink:#16161a] [@media(max-width:699px)]:data-[theme=large]:[--gallery-caption-padding:0.125em_0.25em] [@media(max-width:699px)]:data-[theme=large]:[--gallery-caption-surface:#fff]" lang={data.language} data-product={data.id} data-theme={data.theme}>
	<ListingHeader
		{data}
		backQuery={data.receiptQuery ? session.visit?.search.slice(1) || data.receiptQuery : ''}
		{hero}
	>
		<CartControls locale={data.language} onBestPrice={() => void productDeal?.showCart()} />
	</ListingHeader>
	<div bind:this={proofRoot}>
		<div class="listing grid gap-0 min-[700px]:grid-cols-2">
			<div
				class="art aspect-square w-full [&:not(.demo-photo)]:bg-[#d0dce6]"
				class:demo-photo={data.id !== 'cooker-one-button' && data.id !== 'cooker-digital'}
				bind:this={hero}
				data-category={data.photoCategory}
				data-model={data.photoModel}
				data-cooker-photo={data.id}
				aria-hidden={data.id === 'cooker-one-button' || data.id === 'cooker-digital'
					? undefined
					: true}
			>
				{#if data.id === 'cooker-one-button' || data.id === 'cooker-digital'}
					{#key data.id}<ProductGallery {th} productId={data.id} />{/key}
				{/if}
			</div>
			<ProductSummary {data}>
				{#key data.id}
					<ProductDeal bind:this={productDeal} productId={data.id} locale={data.language}>
						<AddToCart productId={data.id} locale={data.language} onAdd={session.addProduct} />
					</ProductDeal>
				{/key}
			</ProductSummary>
		</div>
		<ProductDescription {data} openSpecifications={sheet ? openSpecifications : undefined} />
		<SpecificationsSheet {data} {th} bind:sheet />
	</div>
	<FactsReceipt root={proofRoot} locale={data.language} />
	{#if data.receiptQuery}<ProductChat
			productId={data.id}
			locale={data.language}
			theme={data.theme}
		/>{/if}
</main>
