<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';
	import FactValue from '../../../lib/storefront/FactValue.svelte';
	import '../../../lib/assets/products/shelf-photos.css';
	import { catalog } from '../../../lib/store-catalog';

	let { data }: { data: PageData } = $props();
	const th = $derived(data.language === 'th');
	let inventoryDialog = $state<HTMLDialogElement>();
	let showInventory = $state(false);
	const current = $derived(catalog.find((item) => item.catalogId === data.id));
	const inventory = $derived(current ? [current, ...data.shopProducts] : data.shopProducts);
	function productLink(id: string) {
		return (
			resolve('/product/[id]', { id }) +
			'?lang=' +
			data.language +
			'&theme=' +
			data.theme +
			(data.receiptQuery ? '&' + data.receiptQuery : '')
		);
	}
</script>

<section aria-labelledby="seller-name">
	<header>
		<span class="shop-icon" aria-hidden="true">
			<svg
				width="26"
				height="26"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path d="M3 10 5 4h14l2 6M4 10v10h16V10M3 10q2 4 5 0 2 4 4 0 2 4 4 0 3 4 5 0M9 20v-6h6v6" />
			</svg>
		</span>
		<div>
			<h2 id="seller-name" {...data.shop?.attributes}>{data.shop?.text}</h2>
			<p class="shop-rating">
				{th ? 'คะแนนร้านค้า' : 'Shop rating'}
				<FactValue productId={data.id} field="shopRating" locale={data.language} />
			</p>
		</div>
		<button
			class="view-shop"
			type="button"
			aria-haspopup="dialog"
			onclick={(event) => {
				event.currentTarget.focus({ preventScroll: true });
				showInventory = true;
				inventoryDialog?.showModal();
			}}
		>
			{th ? 'ดูร้านค้า' : 'View shop'}
		</button>
	</header>
	{#if data.shopProducts.length}
		<h3>{th ? 'สินค้าขายดีประจำร้าน' : 'Best sellers from this shop'}</h3>
		<ul>
			{#each data.shopProducts as item (item.catalogId)}
				<li>
					<a href={productLink(item.id)}>
						<span
							class="demo-photo"
							data-category={item.category}
							data-model={item.id}
							data-cooker-photo={item.catalogId}
							aria-hidden="true"
						></span>
						<div class="card-copy">
							<span class="title">
								<FactValue productId={item.catalogId} field="name" locale={data.language} />
							</span>
							<strong class="price">
								<FactValue productId={item.catalogId} field="price" locale={data.language} />
							</strong>
							<span class="rating">
								<svg
									aria-label={th ? 'คะแนน' : 'Rating'}
									role="img"
									viewBox="0 0 20 20"
									width="14"
									height="14"
									fill="currentColor"
								>
									<path d="m10 1.8 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" />
								</svg>
								<FactValue productId={item.catalogId} field="rating" locale={data.language} />
							</span>
							<span>
								{th ? 'ขายแล้ว' : 'Sold'}
								<FactValue productId={item.catalogId} field="sold" locale={data.language} />
							</span>
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
	<dialog
		bind:this={inventoryDialog}
		aria-labelledby="seller-inventory-title"
		onclose={() => (showInventory = false)}
	>
		<header>
			<h2 id="seller-inventory-title" {...data.shop?.attributes}>{data.shop?.text}</h2>
			<form method="dialog"><button class="close-shop">{th ? 'ปิด' : 'Close'}</button></form>
		</header>
		{#if showInventory}
			<ul class="inventory">
				{#each inventory as item (item.catalogId)}
					<li>
						<a
							href={productLink(item.id)}
							aria-current={item.catalogId === data.id ? 'page' : undefined}
							onclick={() => inventoryDialog?.close()}
						>
							<span
								class="demo-photo"
								data-category={item.category}
								data-model={item.id}
								data-cooker-photo={item.catalogId}
								aria-hidden="true"
							></span>
							<span>
								<FactValue productId={item.catalogId} field="name" locale={data.language} />
							</span>
							<strong class="price">
								<FactValue productId={item.catalogId} field="price" locale={data.language} />
							</strong>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</dialog>
</section>

<style>
	section {
		border-top: 8px solid var(--seam, #f2f2f2);
		min-width: 0;
		padding: 0 0.8rem 1rem;
	}
	header {
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 1em 0;
	}
	.shop-icon {
		display: grid;
		place-items: center;
		width: 3em;
		height: 3em;
		border: 1px solid var(--seam, #e9e6dc);
		border-radius: 50%;
	}
	p {
		color: #555;
		font-size: max(0.875rem, var(--action-font-floor, 0rem));
		margin: 0;
	}
	h2,
	h3 {
		font-weight: 600;
		margin: 0;
	}
	h2 {
		font-size: 1.125em;
	}
	h3 {
		font-size: 1em;
		border-top: 1px solid var(--seam, #e9e6dc);
		padding: 0.85em 0 0.65em;
	}
	ul {
		display: flex;
		list-style: none;
		gap: 0.5rem;
		overflow-x: auto;
		margin: 0;
		padding: 0 0 0.3rem;
		scroll-snap-type: x proximity;
	}
	li {
		flex: 0 0 clamp(7rem, 29vw, 10rem);
		border-radius: 4px;
		border: 1px solid var(--seam, #e9e6dc);
		overflow: hidden;
		scroll-snap-align: start;
	}
	a {
		display: block;
		height: 100%;
		color: inherit;
		text-decoration: none;
	}
	a:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: -3px;
	}
	.demo-photo {
		display: block;
		aspect-ratio: 1;
	}
	.card-copy {
		padding: 0.45rem;
		display: grid;
		gap: 0.35rem;
		font-size: max(0.8125rem, var(--action-font-floor, 0rem));
	}
	.title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.price {
		font-size: 1.125em;
	}
	.price,
	.rating,
	.card-copy :global([data-fact='sold']) {
		font-family: var(--product-figure-font);
	}
	.rating {
		display: inline-flex;
		justify-self: start;
		align-items: center;
		gap: 0.2em;
		padding: 0 0.25em;
		border: 1px solid var(--seam, #e9e6dc);
	}
	.shop-rating :global([data-fact='shopRating']) {
		font-family: var(--product-figure-font);
	}
	.view-shop,
	.close-shop {
		flex: none;
		margin-inline-start: auto;
		min-height: var(--tap, 44px);
		border: 1px solid var(--accent, #16161a);
		border-radius: 4px;
		padding: 0 0.75em;
		background: white;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}
	button:focus-visible {
		outline: 2px solid var(--accent, #16161a);
		outline-offset: 2px;
	}
	dialog {
		margin: auto;
		width: min(100%, 32rem);
		max-width: 100%;
		max-height: 82dvh;
		padding: 0;
		border: 1px solid var(--seam, #e9e6dc);
		background: #fff;
		color: inherit;
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	dialog header {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 0.5em 0.8em;
		border-bottom: 1px solid var(--seam, #e9e6dc);
		background: white;
	}
	dialog form {
		margin-inline-start: auto;
	}
	.inventory {
		display: block;
		overflow: visible;
	}
	.inventory li {
		border-width: 0 0 1px;
		border-radius: 0;
	}
	.inventory a {
		display: grid;
		grid-template-columns: 3rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.5em;
		padding: 0.5em 0.8em;
	}
	@media (max-width: 699px) {
		dialog {
			margin: auto auto 0;
			border-radius: 12px 12px 0 0;
			padding-bottom: env(safe-area-inset-bottom);
		}
	}
</style>
