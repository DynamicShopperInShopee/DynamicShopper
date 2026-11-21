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
	<section
		class="mx-2 my-1 min-w-0 rounded-[var(--radius)] bg-[var(--surface)] text-[var(--ink)]"
		aria-label={th ? 'ร้านค้าที่พบ' : 'Matching shops'}
	>
		<header class="flex items-center gap-2 px-[0.55rem] py-[0.35rem]">
			<span
				class="symbol grid size-10 flex-none place-items-center rounded-full bg-[var(--paper)]"
				aria-hidden="true"
			>
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
			<div class="identity min-w-0 flex-1" aria-live="polite">
				<h2 class="text-[length:max(1rem,var(--small))]/[1.3] font-semibold wrap-anywhere">
					<FactValue productId={matches[0].catalogId} field="shop" locale={language} />
				</h2>
				<p
					class={[
						"shop-rating m-0 flex items-center gap-[0.3rem] text-[length:var(--small)] text-[var(--muted)] [&_[data-fact]]:[font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
					]}
				>
					<svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path d="m10 1.8 2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-5 2.6 1-5.5-4-3.9 5.5-.8z" />
					</svg>
					<FactValue productId={matches[0].catalogId} field="shopRating" locale={language} />
					{th ? 'คะแนนร้านค้า' : 'Shop rating'}
				</p>
			</div>
			<button
				class="visit min-h-[var(--tap)] flex-none cursor-pointer rounded-[var(--radius)] bg-[var(--accent)] px-[0.6rem] text-[length:var(--small)] text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
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
		<ul class="strip flex gap-1.5 overflow-x-auto px-[0.55rem] pt-[0.15rem] pb-1">
			{#each matches as item (item.id)}
				<li class="flex-[0_0_clamp(5.75rem,25vw,8rem)]" data-product={item.id}>
					<a
						class="relative block overflow-hidden rounded-[4px] text-inherit focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
						href={resolve(`/product/[id]?lang=${language}&theme=${theme}`, { id: item.id })}
					>
						<span
							class="demo-photo block aspect-square"
							data-cooker-photo={item.catalogId}
							data-model={item.id}
							data-category={item.category}
							aria-hidden="true"
						></span>
						<span class="sr-only">
							<FactValue productId={item.catalogId} field="name" locale={language} />
						</span>
						<span
							class={[
								"price absolute bottom-1 left-1/2 -translate-x-1/2 rounded-2xl bg-[#333] px-[0.4rem] text-[length:var(--small)] text-white [&_[data-fact=price]]:[font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
							]}
						>
							<FactValue productId={item.catalogId} field="price" locale={language} />
						</span>
					</a>
				</li>
			{/each}
		</ul>
		{#if shops.length > 1}
			<button
				type="button"
				class="other flex min-h-[var(--tap)] w-full cursor-pointer items-center [justify-content:end] gap-2 border-t border-[var(--seam)] px-[0.6rem] text-[length:var(--small)] text-inherit focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
				onclick={() => (selectedShop = shops[(shops.indexOf(shop) + 1) % shops.length])}
			>
				{th ? 'ร้านค้าอื่น ๆ' : 'Other shops'} <span class="text-[1.25rem]" aria-hidden="true">›</span>
			</button>
		{/if}
	</section>
	<dialog
		class="m-auto max-h-[82dvh] w-[min(100%,32rem)] border border-[var(--seam)] bg-white text-[var(--ink)] backdrop:bg-black/40 [@media(max-width:699px)]:mb-0 [@media(max-width:699px)]:rounded-t-xl [@media(max-width:699px)]:pb-[env(safe-area-inset-bottom)]"
		bind:this={dialog}
		aria-labelledby="matching-shop-title"
	>
		<header
			class="sticky top-0 flex items-center justify-between gap-2 border-b border-[var(--seam)] bg-white px-[0.55rem] py-[0.35rem]"
		>
			<h2
				class="text-[length:max(1rem,var(--small))]/[1.3] font-semibold wrap-anywhere"
				id="matching-shop-title"
			>
				<FactValue productId={matches[0].catalogId} field="shop" locale={language} />
			</h2>
			<form method="dialog">
				<button
					class="min-h-[var(--tap)] cursor-pointer px-[0.6rem] text-inherit focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
				>
					{th ? 'ปิด' : 'Close'}
				</button>
			</form>
		</header>
		<ul
			class={[
				"inventory [&_[data-fact=price]]:[font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace]"
			]}
		>
			{#each inventory as item (item.id)}
				<li data-product={item.id}>
					<a
						class="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-[0.6rem] border-b border-[var(--seam)] p-2 text-inherit focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--ink)]"
						href={resolve(`/product/[id]?lang=${language}&theme=${theme}`, { id: item.id })}
					>
						<span
							class="demo-photo block aspect-square"
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
