<script lang="ts">
	import { onMount } from 'svelte';
	import type { Locale } from '../catalog';
	import { cartPanelId } from './cart';

	let {
		locale,
		status,
		restoreFocus = false
	}: {
		locale: Locale;
		status?: 'adding' | 'added' | 'full' | 'invalid';
		restoreFocus?: boolean;
	} = $props();
	const copy = {
		en: {
			adding: 'Adding to cart…',
			added: 'Added to cart',
			full: 'Your cart is full',
			invalid: 'Could not add this item',
			view: 'View cart'
		},
		th: {
			adding: 'กำลังเพิ่มลงตะกร้า…',
			added: 'เพิ่มลงตะกร้าแล้ว',
			full: 'ตะกร้าเต็ม',
			invalid: 'เพิ่มสินค้าไม่ได้',
			view: 'ดูตะกร้า'
		}
	};
	let view = $state<HTMLButtonElement>();
	onMount(() => {
		if (restoreFocus && document.activeElement === document.body)
			view?.focus({ preventScroll: true });
	});
</script>

<div class="flex flex-wrap items-center gap-x-3">
	<span role="status" class="wrap-anywhere text-[var(--muted,#5d5d63)]">
		{status ? copy[locale][status] : ''}
	</span>
	{#if status === 'added' || status === 'full'}
		<button
			bind:this={view}
			class="min-h-[var(--tap,44px)] cursor-pointer text-start font-semibold text-[var(--ink,#16161a)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
			type="button"
			popovertarget={cartPanelId}
		>
			{copy[locale].view}
		</button>
	{/if}
</div>
