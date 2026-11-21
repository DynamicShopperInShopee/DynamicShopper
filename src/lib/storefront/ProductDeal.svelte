<script lang="ts">
	import { onMount, tick, type Snippet } from 'svelte';
	import type { Locale } from '../catalog/index.ts';
	import { findAddOns, optimizeDeal, type AddOn, type DealReceipt } from '../pricing';
	import type { CartItem } from './cart';
	import { getStoreOpenedAt } from './clock';
	import { assistantCopy } from './copy';
	import DealSlip from './DealSlip.svelte';

	let {
		productId,
		locale,
		quantity = 1,
		children
	}: { productId: string; locale: Locale; quantity?: number; children?: Snippet } = $props();

	let openedAt = $state<number>();
	let quote = $state<{ receipt: DealReceipt; addOns: readonly AddOn[] } | null>();
	let closeButton = $state<HTMLButtonElement>();
	let trigger: HTMLElement | undefined;
	const th = $derived(locale === 'th');

	onMount(() => {
		openedAt = getStoreOpenedAt();
	});

	export function showBasket(basket: readonly CartItem[], withAddOns = true) {
		if (openedAt === undefined) return;
		const context = { openedAt, now: Math.max(openedAt, Date.now()) };
		const receipt = optimizeDeal(basket, context);
		trigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
		quote = receipt ? { receipt, addOns: withAddOns ? findAddOns(basket, context) : [] } : null;
		if (receipt) void tick().then(() => closeButton?.focus());
	}

	function closeDeal() {
		quote = undefined;
		trigger?.focus();
	}
</script>

<div class="actions">
	{@render children?.()}
	<button
		type="button"
		disabled={openedAt === undefined}
		onclick={() => showBasket([{ productId, quantity }], false)}
	>
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
