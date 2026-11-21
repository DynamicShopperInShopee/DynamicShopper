<script lang="ts">
	import type { Locale } from '../catalog/index.ts';
	import Cart from './Cart.svelte';
	import { resolveCatalogFact } from './catalogFact';
	import { getStoreSession } from './store.svelte';

	let {
		locale,
		onBestPrice
	}: {
		locale: Locale;
		onBestPrice: () => void;
	} = $props();

	const session = getStoreSession();
</script>

<Cart
	items={session.cart}
	{locale}
	resolve={resolveCatalogFact}
	onRemove={session.removeProduct}
	{onBestPrice}
/>
