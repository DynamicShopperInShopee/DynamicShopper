<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { onMount, tick, type Snippet } from 'svelte';
	import type { Locale } from '../catalog/index.ts';
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
	let activeBasket = $state.raw<readonly CartItem[]>();
	const quote = $derived(
		activeBasket ? quoteBasket(activeBasket, locale, session.clock.context) : undefined
	);
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
		activeBasket = basket;
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
		activeBasket = undefined;
		trigger?.focus();
	}
</script>

<div class="actions flex flex-wrap items-start gap-2">
	{@render children?.()}
	<button
		class="min-h-[var(--tap,44px)] cursor-pointer rounded-[var(--radius,4px)] border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] px-[0.7rem] py-[0.35rem] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current hover:enabled:border-current disabled:cursor-not-allowed disabled:opacity-45"
		type="button"
		disabled={!ready}
		onclick={() => priceCurrentBasket(false)}
	>
		{assistantCopy[locale].deal}
	</button>
</div>
{#if quote}
	<section class="quote my-3">
		<button
			class="min-h-[var(--tap,44px)] cursor-pointer rounded-[var(--radius,4px)] border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] px-[0.7rem] py-[0.35rem] text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current hover:enabled:border-current disabled:cursor-not-allowed disabled:opacity-45"
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
{:else if activeBasket && session.clock.context}
	<p role="status">{th ? 'ยังยืนยันราคาไม่ได้' : 'Could not confirm the best price.'}</p>
{/if}
