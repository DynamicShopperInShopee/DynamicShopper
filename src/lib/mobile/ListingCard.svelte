<script lang="ts">
	import ListingPhoto from './ListingPhoto.svelte';
	import { catalogNameAttributes } from './name-attributes';
	import { formatBaht } from '../catalog';
	import type { ShopListing, CatalogCategory } from '../catalog-api/types';
	import ListingCategory from './ListingCategory.svelte';
	import type { ShopperPlan } from '../personalization/plan';
	let {
		product,
		lang,
		categories = [],
		details = ['image', 'price', 'shipping'],
		saved = false,
		onsave,
		onopen
	}: {
		product: ShopListing;
		lang: 'en' | 'th';
		categories?: readonly CatalogCategory[];
		details?: ShopperPlan['details'];
		saved?: boolean;
		onsave?: () => void;
		onopen: () => void;
	} = $props();
	const summary = $derived(details.includes('summary'));
	const facts = $derived(details.includes('specs') ? ['size', 'price'] : ['price', 'size']);
</script>

{#snippet picture()}
	<button class="picture" onclick={onopen} aria-label={product.name[lang]}>
		<ListingPhoto {product} {lang} />
	</button>
{/snippet}

<article class:no-picture={!details.includes('image')} class:summary>
	{#if details.includes('image') && !summary}{@render picture()}{/if}
	<div class="body">
		<div class="line">
			<span class="category">
				<ListingCategory {product} {categories} {lang} />
			</span>{#if onsave}<button
					class="save"
					aria-label={lang === 'th' ? 'บันทึก ' + product.name.th : 'Save ' + product.name.en}
					aria-pressed={saved}
					onclick={onsave}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill={saved ? 'currentColor' : 'none'}
						stroke="currentColor"
						stroke-width="1.5"
					>
						<path d="M6 3h12v18l-6-4-6 4z" />
					</svg>
				</button>{/if}
		</div>
		<h3>
			<button onclick={onopen} {...catalogNameAttributes(product, lang)}>
				{product.name[lang]}
			</button>
		</h3>
		{#each facts as fact (fact)}
			{#if fact === 'size' && product.size}
				{#if details.includes('specs')}<span class="spec-label">
						{lang === 'th' ? 'ขนาดจากรายการสินค้า' : 'Listed size'}
					</span>{/if}
				<p
					class:spec-first={details.includes('specs')}
					data-fact-key={`${product.id}:size`}
					data-raw={product.size[lang]}
				>
					{product.size[lang]}
				</p>
			{:else if fact === 'price' && product.price !== null}
				<strong
					class="price"
					data-fact-key={`${product.id}:shopPrice`}
					data-raw={product.price}
					data-print={formatBaht(product.price, lang)}
				>
					{formatBaht(product.price, lang)}
				</strong>
			{:else if fact === 'price'}
				<p>{lang === 'th' ? 'ยังไม่มีราคาที่ตรวจสอบได้' : 'Price unavailable'}</p>
			{/if}
		{/each}

		{#if product.sourceLabel}<small
				data-fact-key={`${product.id}:sourceLabel`}
				data-raw={product.sourceLabel[lang]}
			>
				{product.sourceLabel[lang]}
			</small>{:else}<small>
				{lang === 'th' ? 'ราคาอ้างอิงจากรายการต้นทาง' : 'Saved source price'}
			</small>{/if}
		<button class="open" onclick={onopen}>
			{lang === 'th' ? 'ดูสินค้า' : 'View product'} <span aria-hidden="true">→</span>
		</button>
	</div>
	{#if details.includes('image') && summary}{@render picture()}{/if}
</article>

<style>
	article {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: 4px;
		overflow: hidden;
	}
	button {
		font: inherit;
		cursor: pointer;
		color: inherit;
		background: transparent;
		border: 0;
		min-height: 44px;
	}
	.picture {
		display: grid;
		place-items: center;
		width: 100%;
		padding: 0;
		aspect-ratio: 1;
		background: white;
	}
	.picture :global(img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
	.body {
		padding: 12px;
	}
	.line {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.category,
	small {
		font-size: 12px;
		color: var(--muted);
	}
	.save {
		width: 44px;
		display: grid;
		place-items: center;
	}
	h3 {
		font-size: 16px;
		line-height: 1.5;
		margin: 0;
	}
	h3 button {
		text-align: left;
		font-weight: 600;
		padding: 0;
	}
	p {
		font-size: 13px;
		color: var(--muted);
		margin: 6px 0 16px;
	}
	.price {
		font-family: monospace;
		font-size: 24px;
		display: block;
		letter-spacing: -1px;
	}
	.body > small {
		display: block;
		margin: 4px 0 12px;
	}
	.open {
		border-top: 1px solid var(--line);
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0;
	}
	.open span {
		font-size: 20px;
	}
	:global(.large) :is(h3, p, small, .category, .spec-label) {
		font-size: 20px;
	}
	:global(.large) button {
		min-height: 48px;
	}
	:global(.list) article {
		display: grid;
		grid-template-columns: 112px minmax(0, 1fr);
	}
	:global(.list) .picture {
		align-self: start;
		margin-top: 16px;
	}
	:global(.list) article.no-picture {
		display: block;
	}
	.spec-label {
		display: block;
		color: var(--muted);
		font-size: 12px;
		margin-top: 12px;
	}
	.spec-first {
		color: var(--ink);
		padding-block: 12px;
		border-block: 1px dotted var(--muted);
	}
	:global(.list) article.summary {
		grid-template-columns: minmax(0, 1fr) 96px;
	}
	.summary .picture {
		aspect-ratio: 1.6;
	}
	:global(.large) article {
		display: block;
	}
	:global(.large) .picture {
		max-height: 240px;
		aspect-ratio: auto;
	}
	:global(.large) .picture :global(img) {
		height: 240px;
	}
	:global(.spacious) .body {
		padding: 20px;
	}
	button:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: -3px;
	}
</style>
