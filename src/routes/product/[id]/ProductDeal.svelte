<script lang="ts">
	import { onMount } from 'svelte';
	import type { Locale } from '../../../lib/catalog';
	import { optimizeDeal } from '../../../lib/pricing';
	import { getStoreOpenedAt } from '../../../lib/storefront/clock';
	import DealSlip from '../../../lib/storefront/DealSlip.svelte';
	import { watchPricingClock } from '../../../lib/storefront/live-quote';

	let { productId, locale }: { productId: string; locale: Locale } = $props();
	let openedAt = $state<number>();
	let now = $state<number>();
	const receipt = $derived(
		openedAt === undefined || now === undefined
			? undefined
			: optimizeDeal([{ productId, quantity: 1 }], { openedAt, now })
	);
	const th = $derived(locale === 'th');
	const showingDeal = $derived(now !== undefined);

	onMount(() => {
		openedAt = getStoreOpenedAt();
	});

	$effect(() => {
		if (openedAt === undefined || !showingDeal) return;
		return watchPricingClock(openedAt, (time) => (now = time));
	});

	function showDeal() {
		if (openedAt === undefined) return;
		now = Math.max(openedAt, Date.now());
	}
</script>

<button type="button" disabled={openedAt === undefined} onclick={showDeal}>
	{th ? 'ราคาดีที่สุด' : 'Best price'}
</button>
<div aria-live="polite">
	{#if receipt}
		<DealSlip {receipt} {locale} />
	{:else if receipt === null}
		<p>{th ? 'ยังยืนยันราคาไม่ได้' : 'Could not confirm the best price.'}</p>
	{/if}
</div>

<style>
	button {
		min-height: 48px;
		padding: 0.5rem 1rem;
		color: inherit;
		font: inherit;
		background: #fff;
		border: 1px solid #e9e6dc;
		border-radius: 4px;
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		border-color: currentColor;
	}
	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	div:not(:empty) {
		margin-block: 0.75rem;
	}
</style>
