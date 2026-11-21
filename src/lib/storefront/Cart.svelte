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
		pending = false,
		factRoot = $bindable()
	}: {
		items: readonly CartItem[];
		locale: FactLocale;
		resolve: ResolvePrintedFact;
		onRemove: (productId: string) => void | Promise<void>;
		onBestPrice: (basket: readonly CartItem[]) => void;
		pending?: boolean;
		factRoot?: HTMLElement;
	} = $props();

	const id = $props.id();
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
		factRoot?.hidePopover();
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

<button type="button" popovertarget={id} lang={locale}>{t.title}</button>
<div
	bind:this={factRoot}
	{id}
	popover="auto"
	role="region"
	aria-labelledby={`${id}-title`}
	lang={locale}
>
	<h2 id={`${id}-title`}>{t.title}</h2>
	{#if rows.length}
		<ul>
			{#each rows as row (row.item.productId)}
				<li>
					<p><Fact fact={row.name} /></p>
					<dl>
						<div>
							<dt>{t.unitPrice}</dt>
							<dd><Fact fact={row.price} /></dd>
						</div>
						<div>
							<dt>{t.quantity}</dt>
							<dd
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
		<button type="button" disabled={pending || removing} onclick={bestPrice}>{t.best}</button>
	{:else}
		<p role="status">{t.empty}</p>
	{/if}
	{#if removing}<p role="status">{t.removing}</p>{/if}
	{#if removalFailed}<p role="alert">{t.removeFailed}</p>{/if}
</div>

<style>
	[popover] {
		box-sizing: border-box;
		inset: 1rem 1rem auto auto;
		margin: 0;
		padding: 1rem;
		width: min(23rem, calc(100% - 2rem));
		max-height: calc(100dvh - 2rem);
		overflow: auto;
		border: 1px solid var(--ink, #16161a);
		background: var(--surface, #fff);
		color: var(--ink, #16161a);
		font: inherit;
	}
	h2,
	ul,
	li,
	p,
	dl,
	dd {
		margin: 0;
	}
	h2 {
		font-size: 1.125em;
	}
	ul {
		list-style: none;
		padding: 0;
	}
	li {
		border-bottom: 1px solid var(--seam, #e9e6dc);
		padding-block: 0.75rem;
		overflow-wrap: anywhere;
	}
	dl > div {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}
	dd {
		font-family: var(--mono, 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace);
	}
	button {
		min-height: var(--tap, 44px);
		padding-inline: 0.625rem;
		border: 1px solid currentColor;
		border-radius: var(--radius, 4px);
		background: var(--surface, #fff);
		color: inherit;
		font: inherit;
	}
	[popover] button {
		margin-top: 0.5rem;
	}
	button:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
</style>
