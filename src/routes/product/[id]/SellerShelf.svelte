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
	const productQuery = $derived(
		`lang=${data.language}&theme=${data.theme}${data.receiptQuery ? '&' + data.receiptQuery : ''}`
	);
</script>

<section
	class="min-w-0 border-t-8 border-[var(--seam,#f2f2f2)] px-[0.8rem] pb-4"
	aria-labelledby="seller-name"
>
	<header class="flex items-center gap-[0.75em] py-[1em]">
		<span
			class="shop-icon grid size-[3em] place-items-center rounded-[50%] border border-[var(--seam,#e9e6dc)]"
			aria-hidden="true"
		>
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
			<h2 class="m-0 text-[1.125em] font-semibold" id="seller-name" {...data.shop?.attributes}>
				{data.shop?.text}
			</h2>
			<p
				class={[
					'shop-rating m-0 text-[max(0.875rem,var(--action-font-floor,0rem))] text-[#555] [&_[data-fact=shopRating]]:font-[family-name:var(--product-figure-font)]'
				]}
			>
				{th ? 'คะแนนร้านค้า' : 'Shop rating'}
				<FactValue productId={data.id} field="shopRating" locale={data.language} />
			</p>
		</div>
		<button
			class="view-shop ms-auto min-h-[var(--tap,44px)] flex-none cursor-pointer rounded border border-[var(--accent,#16161a)] bg-white px-[0.75em] text-inherit [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
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
		<h3
			class="m-0 border-t border-[var(--seam,#e9e6dc)] pt-[0.85em] pb-[0.65em] text-[1em] font-semibold"
		>
			{th ? 'สินค้าขายดีประจำร้าน' : 'Best sellers from this shop'}
		</h3>
		<ul class="m-0 flex snap-x snap-proximity list-none gap-2 overflow-x-auto p-0 pb-[0.3rem]">
			{#each data.shopProducts as item (item.catalogId)}
				<li
					class="flex-[0_0_clamp(7rem,29vw,10rem)] snap-start overflow-hidden rounded border border-[var(--seam,#e9e6dc)]"
				>
					<a
						class="block h-full text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
						href={resolve(`/product/[id]?${productQuery}`, { id: item.id })}
					>
						<span
							class="demo-photo block aspect-square"
							data-category={item.category}
							data-model={item.id}
							data-cooker-photo={item.catalogId}
							aria-hidden="true"
						></span>
						<div
							class={[
								'card-copy grid gap-[0.35rem] p-[0.45rem] text-[max(0.8125rem,var(--action-font-floor,0rem))] [&_[data-fact=sold]]:font-[family-name:var(--product-figure-font)]'
							]}
						>
							<span class="title truncate">
								<FactValue productId={item.catalogId} field="name" locale={data.language} />
							</span>
							<strong class="price font-[family-name:var(--product-figure-font)] text-[1.125em]">
								<FactValue productId={item.catalogId} field="price" locale={data.language} />
							</strong>
							<span
								class="rating inline-flex items-center gap-[0.2em] [justify-self:start] border border-[var(--seam,#e9e6dc)] px-[0.25em] font-[family-name:var(--product-figure-font)]"
							>
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
		class="m-auto max-h-[82dvh] w-[min(100%,32rem)] max-w-full border border-[var(--seam,#e9e6dc)] bg-white p-0 text-inherit backdrop:bg-[rgb(0_0_0/40%)] [@media(max-width:699px)]:mb-0 [@media(max-width:699px)]:rounded-t-[12px] [@media(max-width:699px)]:pb-[env(safe-area-inset-bottom)]"
		bind:this={inventoryDialog}
		aria-labelledby="seller-inventory-title"
		onclose={() => (showInventory = false)}
	>
		<header
			class="sticky top-0 z-1 flex items-center gap-[0.75em] border-b border-[var(--seam,#e9e6dc)] bg-white px-[0.8em] py-[0.5em]"
		>
			<h2
				class="m-0 text-[1.125em] font-semibold"
				id="seller-inventory-title"
				{...data.shop?.attributes}
			>
				{data.shop?.text}
			</h2>
			<form class="ms-auto" method="dialog">
				<button
					class="close-shop ms-auto min-h-[var(--tap,44px)] flex-none cursor-pointer rounded border border-[var(--accent,#16161a)] bg-white px-[0.75em] text-inherit [font:inherit] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
				>
					{th ? 'ปิด' : 'Close'}
				</button>
			</form>
		</header>
		{#if showInventory}
			<ul
				class="inventory m-0 block snap-x snap-proximity list-none gap-2 overflow-visible p-0 pb-[0.3rem]"
			>
				{#each inventory as item (item.catalogId)}
					<li
						class="flex-[0_0_clamp(7rem,29vw,10rem)] snap-start overflow-hidden border-b border-[var(--seam,#e9e6dc)]"
					>
						<a
							class="grid h-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-[0.5em] px-[0.8em] py-[0.5em] text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--accent,#16161a)] focus-visible:outline-solid"
							href={resolve(`/product/[id]?${productQuery}`, { id: item.id })}
							aria-current={item.catalogId === data.id ? 'page' : undefined}
							onclick={() => inventoryDialog?.close()}
						>
							<span
								class="demo-photo block aspect-square"
								data-category={item.category}
								data-model={item.id}
								data-cooker-photo={item.catalogId}
								aria-hidden="true"
							></span>
							<span>
								<FactValue productId={item.catalogId} field="name" locale={data.language} />
							</span>
							<strong class="price font-[family-name:var(--product-figure-font)] text-[1.125em]">
								<FactValue productId={item.catalogId} field="price" locale={data.language} />
							</strong>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</dialog>
</section>
