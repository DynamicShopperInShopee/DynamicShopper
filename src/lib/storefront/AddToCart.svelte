<script lang="ts">
	import { onMount } from 'svelte';
	import type { Locale } from '../catalog/index.ts';
	import { resolveCatalogFact } from './catalogFact';

	type Status = 'added' | 'full' | 'invalid';
	let {
		productId,
		locale,
		onAdd
	}: {
		productId: string;
		locale: Locale;
		onAdd: (productId: string) => Status | Promise<Status>;
	} = $props();

	const copy = {
		en: {
			add: 'Add to cart',
			adding: 'Adding to cart…',
			added: 'Added to cart',
			full: 'Your cart is full',
			invalid: 'Could not add this item'
		},
		th: {
			add: 'เพิ่มลงตะกร้า',
			adding: 'กำลังเพิ่มลงตะกร้า…',
			added: 'เพิ่มลงตะกร้าแล้ว',
			full: 'ตะกร้าเต็ม',
			invalid: 'เพิ่มสินค้าไม่ได้'
		}
	} as const;

	let feedback = $state<{ productId: string; status: Status }>();
	let pending = $state(false);
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	const t = $derived(copy[locale]);
	const name = $derived(resolveCatalogFact(productId, 'name', locale)?.text);

	async function add() {
		if (pending) return;
		const id = productId;
		pending = true;
		try {
			feedback = { productId: id, status: await onAdd(id) };
		} catch {
			feedback = { productId: id, status: 'invalid' };
		} finally {
			pending = false;
		}
	}
</script>

<div class="add-control flex min-w-0 flex-col items-start">
	<button
		class="inline-flex min-h-[var(--tap,44px)] cursor-pointer items-center justify-center rounded-[var(--radius,4px)] border border-[var(--accent,#16161a)] bg-[var(--accent,#16161a)] px-[0.7rem] py-[0.35rem] text-start font-semibold text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)]"
		type="button"
		aria-label={name ? `${t.add} ${name}` : t.add}
		disabled={!ready || pending}
		onclick={add}
	>
		{t.add}
	</button>
	<span class="wrap-anywhere text-[var(--muted,#5d5d63)]" role="status">
		{#if pending}
			<span class="mt-1 block">{t.adding}</span>
		{:else if feedback?.productId === productId}
			{#key feedback}
				<span class="mt-1 block">{t[feedback.status]}</span>
			{/key}
		{/if}
	</span>
</div>
