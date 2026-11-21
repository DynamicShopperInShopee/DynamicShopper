<script lang="ts">
	import type { Locale } from '../catalog/index.ts';
	import type { CartItem } from './cart';
	import Cart from './Cart.svelte';
	import { resolveCatalogFact } from './catalogFact';
	import { getStoreSession } from './store.svelte';

	let {
		locale,
		onBestPrice
	}: {
		locale: Locale;
		onBestPrice: (basket: readonly CartItem[]) => void;
	} = $props();

	const session = getStoreSession();
</script>

<Cart
	items={session.cart}
	{locale}
	resolve={resolveCatalogFact}
	onRemove={(productId) => session.removeProduct(productId)}
	{onBestPrice}
/>
