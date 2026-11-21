<script lang="ts">
	import Fact from './Fact.svelte';
	import type { CartItem } from './cart';
	import type { FactLocale, ResolvePrintedFact } from './verifyFacts';

	let {
		items,
		locale,
		resolve,
		onRemove,
		onBestPrice,
		pending = false
	}: {
		items: readonly CartItem[];
		locale: FactLocale;
		resolve: ResolvePrintedFact;
		onRemove: (productId: string) => void | Promise<void>;
		onBestPrice: (basket: readonly CartItem[]) => void;
		pending?: boolean;
	} = $props();

	const id = $props.id();
	let panel = $state<HTMLDivElement>();
	let removing = $state(false);
	let removalFailed = $state(false);
	const copy = {
		en: {
			title: 'Cart',
			empty: 'Your cart is empty',
			remove: 'Remove',
			removing: 'Removing item…',
			removeFailed: 'Could not remove this item',
			quantity: 'Quantity',
			best: 'Best price for my cart',
			unitPrice: 'Unit price'
		},
		th: {
			title: 'ตะกร้า',
			empty: 'ยังไม่มีสินค้าในตะกร้า',
			remove: 'นำออก',
			removing: 'กำลังนำสินค้าออก…',
			removeFailed: 'นำสินค้าออกไม่ได้',
			quantity: 'จำนวน',
			best: 'ดูราคาที่ดีที่สุดสำหรับตะกร้า',
			unitPrice: 'ราคาต่อชิ้น'
		}
	} as const;
	const t = $derived(copy[locale]);
	const number = $derived(new Intl.NumberFormat(locale));
	const rows = $derived(
		items.flatMap((item) => {
			const name = resolve(item.productId, 'name', locale);
			const price = resolve(item.productId, 'price', locale);
			return name && price ? [{ item, name, price }] : [];
		})
	);

	function bestPrice() {
		if (pending || removing || !rows.length) return;
		panel?.hidePopover();
		onBestPrice(rows.map(({ item }) => item));
	}

	async function remove(productId: string) {
		if (removing) return;
		removing = true;
		removalFailed = false;
		try {
			await onRemove(productId);
		} catch {
			removalFailed = true;
		} finally {
			removing = false;
		}
	}
</script>

<button
	class="min-h-[var(--tap,44px)] min-w-[var(--tap,44px)] rounded-[var(--radius,4px)] border border-current bg-[var(--surface,#fff)] px-2.5 text-inherit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
	type="button"
	popovertarget={id}
	lang={locale}
>
	{t.title}
</button>
<div
	class="[inset:1rem_1rem_auto_auto] m-0 box-border max-h-[calc(100dvh-2rem)] w-[min(23rem,calc(100%-2rem))] overflow-auto rounded-none border border-[var(--ink,#16161a)] bg-[var(--surface,#fff)] p-4 text-[var(--ink,#16161a)] [font:inherit]"
	bind:this={panel}
	{id}
	popover="auto"
	role="region"
	aria-labelledby={`${id}-title`}
	lang={locale}
>
	<h2 class="m-0 text-[1.125em]" id={`${id}-title`}>{t.title}</h2>
	{#if rows.length}
		<ul class="m-0 list-none p-0">
			{#each rows as row (row.item.productId)}
				<li class="m-0 border-b border-[var(--seam,#e9e6dc)] py-3 wrap-anywhere">
					<p class="m-0"><Fact fact={row.name} /></p>
					<dl class="m-0">
						<div class="flex justify-between gap-2">
							<dt>{t.unitPrice}</dt>
							<dd
								class="m-0 [font-family:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)]"
							>
								<Fact fact={row.price} />
							</dd>
						</div>
						<div class="flex justify-between gap-2">
							<dt>{t.quantity}</dt>
							<dd
								class="m-0 [font-family:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)]"
								data-source="cart"
								data-product={row.item.productId}
								data-field="quantity"
								data-raw={row.item.quantity}
							>
								{number.format(row.item.quantity)}
							</dd>
						</div>
					</dl>
					<button
						class="mt-2 min-h-[var(--tap,44px)] rounded-[var(--radius,4px)] border border-current bg-[var(--surface,#fff)] px-2.5 text-inherit [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
						type="button"
						aria-label={`${t.remove} ${row.name.text}`}
						disabled={removing}
						onclick={() => remove(row.item.productId)}
					>
						{t.remove}
					</button>
				</li>
			{/each}
		</ul>
		<button
			class="mt-2 min-h-[var(--tap,44px)] rounded-[var(--radius,4px)] border border-current bg-[var(--surface,#fff)] px-2.5 text-inherit [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
			type="button"
			disabled={pending || removing}
			onclick={bestPrice}
		>
			{t.best}
		</button>
	{:else}
		<p class="m-0" role="status">{t.empty}</p>
	{/if}
	{#if removing}<p class="m-0" role="status">{t.removing}</p>{/if}
	{#if removalFailed}<p class="m-0" role="alert">{t.removeFailed}</p>{/if}
</div>
