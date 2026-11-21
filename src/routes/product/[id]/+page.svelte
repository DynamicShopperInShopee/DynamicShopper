<script lang="ts">
	import ListingHeader from './ListingHeader.svelte';
	import '../../../lib/assets/fonts/plex.css';
	import FactsReceipt from '../../../lib/storefront/FactsReceipt.svelte';
	import ProductSummary from './ProductSummary.svelte';
	import ProductGallery from './ProductGallery.svelte';
	import '../../../lib/assets/products/cooker-photos.css';
	import '../../../lib/assets/products/shelf-photos.css';
	import ProductDescription from './ProductDescription.svelte';
	import SpecificationsSheet from './SpecificationsSheet.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let hero = $state<HTMLDivElement>();
	let sheet = $state<HTMLDialogElement>();
	let proofRoot = $state<HTMLElement>();
	const th = $derived(data.language === 'th');

	function openSpecifications(trigger: HTMLButtonElement) {
		if (!sheet || sheet.open) return;
		trigger.focus({ preventScroll: true });
		sheet.showModal();
	}
</script>

<svelte:head><title>{data.name.text} · DynamicShopper</title></svelte:head>

<main lang={data.language} data-product={data.id} data-theme={data.theme}>
	<ListingHeader {data} {hero} />
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
			<ProductSummary {data} />
		</div>
		<ProductDescription {data} {openSpecifications} />
		<SpecificationsSheet {data} {th} bind:sheet />
	</div>
	<FactsReceipt root={proofRoot} locale={data.language} />
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
