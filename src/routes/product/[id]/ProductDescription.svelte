<script lang="ts">
	import type { PageData } from './$types';
	import ProductReviews from './ProductReviews.svelte';
	import SellerShelf from './SellerShelf.svelte';
	import ListingInformation from './ListingInformation.svelte';

	let {
		data,
		openSpecifications
	}: {
		data: PageData;
		openSpecifications?: (trigger: HTMLButtonElement) => void;
	} = $props();
</script>

{#key data.id + data.language}
	<ProductReviews {data} />
{/key}
{#if data.shop}
	<SellerShelf {data} />
{/if}
<ListingInformation {data} {openSpecifications} />
