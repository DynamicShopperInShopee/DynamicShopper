<script lang="ts">
	import { onMount } from 'svelte';
	import type { Locale } from '../catalog/index.ts';
	import { resolveCatalogFact } from './catalogFact';
	import CartFeedback from './CartFeedback.svelte';

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

	let feedback = $state<{ productId: string; status: Status }>();
	let pending = $state(false);
	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	const label = $derived(locale === 'th' ? 'เพิ่มลงตะกร้า' : 'Add to cart');
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
		aria-label={name ? `${label} ${name}` : label}
		disabled={!ready || pending}
		onclick={add}
	>
		{label}
	</button>
	<CartFeedback
		{locale}
		status={pending ? 'adding' : feedback?.productId === productId ? feedback.status : undefined}
	/>
</div>
