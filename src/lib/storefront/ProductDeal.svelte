<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { onMount, tick, type Snippet } from 'svelte';
	import type { Locale } from '../catalog/index.ts';
	import type { AddOn, DealReceipt } from '../pricing';
	import type { CartItem } from './cart';
	import { quoteBasket } from './quoteBasket';
	import { getStoreSession } from './store.svelte';
	import { assistantCopy } from './copy';
	import DealSlip from './DealSlip.svelte';

	let { productId, locale, children }: { productId: string; locale: Locale; children?: Snippet } =
		$props();

	const session = getStoreSession();
	let ready = $state(false);
	let request = 0;
	beforeNavigate(() => {
		request += 1;
	});
	let quote = $state<{ receipt: DealReceipt; addOns: readonly AddOn[] } | null>();
	let closeButton = $state<HTMLButtonElement>();
	let trigger: HTMLElement | undefined;
	const th = $derived(locale === 'th');

	onMount(() => {
		ready = true;
		return () => {
			ready = false;
		};
	});

	function showBasket(basket: readonly CartItem[]) {
		if (!ready) return;
		trigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
		quote = quoteBasket(basket, locale) ?? null;
		if (quote) void tick().then(() => closeButton?.focus());
	}

	async function priceCurrentBasket(wholeCart: boolean) {
		const generation = ++request;
		await session.cartSettled();
		if (!ready || request !== generation) return;
		if (wholeCart) {
			if (session.cart.length) showBasket(session.cart);
			return;
		}
		const quantity = session.cart.find((item) => item.productId === productId)?.quantity ?? 1;
		showBasket([{ productId, quantity }]);
	}

	export function showCart() {
		return priceCurrentBasket(true);
	}

	function closeDeal() {
		request += 1;
		quote = undefined;
		trigger?.focus();
	}
</script>

<div class="actions">
	{@render children?.()}
	<button type="button" disabled={!ready} onclick={() => priceCurrentBasket(false)}>
		{assistantCopy[locale].deal}
	</button>
</div>
{#if quote}
	<section class="quote">
		<button
			type="button"
			bind:this={closeButton}
			onclick={closeDeal}
			onkeydown={(event) => {
				if (event.key === 'Escape') closeDeal();
			}}
		>
			{assistantCopy[locale].closeDeal}
		</button>
		<DealSlip receipt={quote.receipt} {locale} addOns={quote.addOns} />
	</section>
{:else if quote === null}
	<p role="status">{th ? 'ยังยืนยันราคาไม่ได้' : 'Could not confirm the best price.'}</p>
{/if}

<style>
	.actions {
		display: flex;
		align-items: flex-start;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	button {
		min-height: var(--tap, 44px);
		padding: 0.35rem 0.7rem;
		color: inherit;
		font: inherit;
		background: var(--surface, #fff);
		border: 1px solid var(--seam, #e9e6dc);
		border-radius: var(--radius, 4px);
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
	.quote {
		margin-block: 0.75rem;
	}
</style>
