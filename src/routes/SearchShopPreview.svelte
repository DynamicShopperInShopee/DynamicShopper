<script lang="ts">
	import { resolve } from '$app/paths';
	import { catalog, type Language } from '../lib/store-catalog';
	import FactValue from '../lib/storefront/FactValue.svelte';

	let {
		products,
		language,
		theme
	}: { products: typeof catalog; language: Language; theme: string } = $props();
	const th = $derived(language === 'th');
	const shops = $derived([...new Set(products.map((item) => item.shop))]);
	let selectedShop = $state('');
	const shop = $derived(shops.includes(selectedShop) ? selectedShop : shops[0]);
	const matches = $derived(products.filter((item) => item.shop === shop));
	const inventory = $derived(catalog.filter((item) => item.shop === shop));
	let dialog = $state<HTMLDialogElement>();
</script>

{#if shop}
	<section aria-label={th ? 'ร้านค้าที่พบ' : 'Matching shops'}>
		<header>
			<span class="symbol" aria-hidden="true">
				<svg
					width="23"
					height="23"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						d="M3 10 5 4h14l2 6M4 10v10h16V10M3 10q2 4 5 0 2 4 4 0 2 4 4 0 3 4 5 0M9 20v-6h6v6"
					/>
				</svg>
			</span>
			<div class="identity" aria-live="polite">
				<h2><FactValue productId={matches[0].catalogId} field="shop" locale={language} /></h2>
				<p class="shop-rating">
					<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path d="m10 1.8 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" />
					</svg>
					<FactValue productId={matches[0].catalogId} field="shopRating" locale={language} />
					{th ? 'คะแนนร้านค้า' : 'Shop rating'}
				</p>
			</div>
			<button
				class="visit"
				type="button"
				aria-haspopup="dialog"
				onclick={(event) => {
					event.currentTarget.focus({ preventScroll: true });
					dialog?.showModal();
				}}
			>
				{th ? 'ไปยังร้านค้า' : 'View shop'}
			</button>
		</header>
		<ul class="strip">
			{#each matches as item (item.id)}
				<li data-product={item.id}>
					<a
						href={resolve('/product/[id]', { id: item.id }) +
							'?lang=' +
							language +
							'&theme=' +
							theme}
					>
						<span
							class="demo-photo"
							data-cooker-photo={item.catalogId}
							data-model={item.id}
							data-category={item.category}
							aria-hidden="true"
						></span>
						<span class="sr-only">
							<FactValue productId={item.catalogId} field="name" locale={language} />
						</span>
						<span class="price">
							<FactValue productId={item.catalogId} field="price" locale={language} />
						</span>
					</a>
				</li>
			{/each}
		</ul>
		{#if shops.length > 1}
			<button
				type="button"
				class="other"
				onclick={() => (selectedShop = shops[(shops.indexOf(shop) + 1) % shops.length])}
			>
				{th ? 'ร้านค้าอื่น ๆ' : 'Other shops'} <span aria-hidden="true">›</span>
			</button>
		{/if}
	</section>
	<dialog bind:this={dialog} aria-labelledby="matching-shop-title">
		<header>
			<h2 id="matching-shop-title">
				<FactValue productId={matches[0].catalogId} field="shop" locale={language} />
			</h2>
			<form method="dialog"><button>{th ? 'ปิด' : 'Close'}</button></form>
		</header>
		<ul class="inventory">
			{#each inventory as item (item.id)}
				<li data-product={item.id}>
					<a
						href={resolve('/product/[id]', { id: item.id }) +
							'?lang=' +
							language +
							'&theme=' +
							theme}
					>
						<span
							class="demo-photo"
							data-cooker-photo={item.catalogId}
							data-model={item.id}
							data-category={item.category}
							aria-hidden="true"
						></span>
						<FactValue productId={item.catalogId} field="name" locale={language} />
						<FactValue tag="strong" productId={item.catalogId} field="price" locale={language} />
					</a>
				</li>
			{/each}
		</ul>
	</dialog>
{/if}

<style>
	section {
		min-width: 0;
		margin: 0.5rem;
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}
	header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.55rem;
	}
	.symbol {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		flex: none;
		border-radius: 50%;
		background: var(--paper);
	}
	.identity {
		min-width: 0;
		flex: 1;
	}
	h2 {
		font-size: max(1rem, var(--small));
		line-height: 1.3;
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	button,
	a {
		color: inherit;
	}
	button {
		cursor: pointer;
		min-height: var(--tap);
		padding-inline: 0.6rem;
	}
	.visit {
		flex: none;
		background: var(--accent);
		color: white;
		font-size: var(--small);
		border-radius: var(--radius);
	}
	.strip {
		display: flex;
		gap: 0.375rem;
		padding: 0.15rem 0.55rem 0.5rem;
		overflow-x: auto;
	}
	.strip li {
		flex: 0 0 clamp(5.75rem, 26vw, 8rem);
	}
	.strip a {
		position: relative;
		display: block;
		border-radius: 4px;
		overflow: hidden;
	}
	.demo-photo {
		display: block;
		aspect-ratio: 1;
	}
	.price {
		position: absolute;
		bottom: 0.25rem;
		left: 50%;
		transform: translateX(-50%);
		border-radius: 1rem;
		background: #333;
		color: white;
		padding: 0 0.4rem;
		font-size: var(--small);
	}
	.price :global([data-fact='price']),
	.inventory :global([data-fact='price']) {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
	}
	.other {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: end;
		gap: 0.5rem;
		border-top: 1px solid var(--seam);
		font-size: var(--small);
	}
	.other span {
		font-size: 1.25rem;
	}
	a:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -2px;
	}
	dialog {
		width: min(100%, 32rem);
		max-height: 82dvh;
		margin: auto;
		border: 1px solid var(--seam);
		background: white;
		color: var(--ink);
	}
	dialog header {
		justify-content: space-between;
		position: sticky;
		top: 0;
		background: white;
		border-bottom: 1px solid var(--seam);
	}
	dialog::backdrop {
		background: rgb(0 0 0 / 40%);
	}
	.inventory a {
		display: grid;
		grid-template-columns: 3.5rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem;
		border-bottom: 1px solid var(--seam);
	}
	@media (max-width: 699px) {
		dialog {
			margin: auto auto 0;
			border-radius: 12px 12px 0 0;
			padding-bottom: env(safe-area-inset-bottom);
		}
	}
	.shop-rating {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--muted);
		font-size: var(--small);
		margin: 0;
	}
	.shop-rating :global([data-fact]) {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace;
	}
</style>
