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

<div class="add-control">
	<button
		type="button"
		aria-label={name ? `${t.add} ${name}` : t.add}
		disabled={!ready || pending}
		onclick={add}
	>
		{t.add}
	</button>
	<span role="status">
		{#if pending}
			<span>{t.adding}</span>
		{:else if feedback?.productId === productId}
			{#key feedback}
				<span>{t[feedback.status]}</span>
			{/key}
		{/if}
	</span>
</div>

<style>
	.add-control {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-inline-size: 0;
	}
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-block-size: var(--tap, 44px);
		padding: 0.35rem 0.7rem;
		background: var(--accent, #16161a);
		color: #fff;
		border: 1px solid var(--accent, #16161a);
		border-radius: var(--radius, 4px);
		font: inherit;
		font-weight: 600;
		text-align: start;
		cursor: pointer;
	}
	button:hover {
		text-decoration: underline;
	}
	button:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
	[role='status'] {
		color: var(--muted, #5d5d63);
		overflow-wrap: anywhere;
	}
	[role='status'] > span {
		display: block;
		margin-block-start: 0.25rem;
	}
</style>
