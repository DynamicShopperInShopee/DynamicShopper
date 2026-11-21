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

	async function bestPrice() {
		await session.cartSettled();
		if (session.cart.length) onBestPrice(session.cart);
	}
</script>

<Cart
	items={session.cart}
	{locale}
	resolve={resolveCatalogFact}
	onRemove={session.removeProduct}
	onBestPrice={bestPrice}
/>
