<script lang="ts">
	import { resolve } from '$app/paths';
	import type { catalog, Language } from '../../../lib/store-catalog';
	import { formatBaht, formatNumber } from '../../../lib/store-search';

	let {
		shop,
		products,
		language
	}: {
		shop: string;
		products: typeof catalog;
		language: Language;
	} = $props();
	const th = $derived(language === 'th');
</script>

<section class="shop" aria-label={th ? 'ร้านค้า' : 'Shop'}>
	<h2 data-fact="shop" data-raw={shop}>{shop}</h2>
	{#if products.length}
		<section aria-labelledby="more-from-shop" class="shelf">
			<h3 id="more-from-shop">{th ? 'สินค้าอื่นจากร้านนี้' : 'More from this shop'}</h3>
			<ul>
				{#each products as product (product.id)}
					<li>
						<a href={`${resolve('/product/[id]', { id: product.id })}?lang=${language}`}>
							<div
								class="catalog-photo"
								data-category={product.category}
								data-model={product.id}
								aria-hidden="true"
							></div>
							<div class="card">
								<p class="name" data-fact="name" data-raw={product.name[language]}>
									{product.name[language]}
								</p>
								<span class="sr-only">{th ? 'ราคา' : 'Price'}</span>
								<strong data-fact="price" data-raw={product.price}>
									{formatBaht(product.price)}
								</strong>
								<p class="rating">
									<svg
										viewBox="0 0 20 20"
										width="14"
										height="14"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										aria-hidden="true"
									>
										<path
											d="m10 2 2.3 5.1 5.6.6-4.2 3.8 1.2 5.5-4.9-2.8L5.1 17l1.2-5.5-4.2-3.8 5.6-.6z"
										/>
									</svg>
									<span class="sr-only">{th ? 'คะแนน' : 'Rating'}</span>
									<span data-fact="rating" data-raw={product.rating}>
										{formatNumber(product.rating)}
									</span>
								</p>
								<p class="sold">
									{th ? 'ขายแล้ว' : 'Sold'}
									<span data-fact="sold" data-raw={product.sold}>{formatNumber(product.sold)}</span>
								</p>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>

<style>
	.shop {
		--shelf-inset: 1rem;
		min-width: 0;
		border-top: 0.5rem solid #f3f3f3;
		padding-block: 1rem 0.75rem;
	}
	h2,
	h3 {
		margin: 0;
		padding-inline: var(--shelf-inset);
		font-weight: 600;
	}
	h2 {
		font-size: 1.125rem;
	}
	.shelf {
		margin-top: 0.75rem;
		border-top: 1px solid #e9e6dc;
		padding-top: 0.75rem;
	}
	ul {
		display: grid;
		grid-auto-columns: clamp(7.5rem, 30vw, 10.5rem);
		grid-auto-flow: column;
		gap: 0.5rem;
		margin: 0;
		padding: 0.5rem var(--shelf-inset) 0.375rem;
		overflow-x: auto;
		overscroll-behavior-inline: contain;
		scroll-padding-inline: var(--shelf-inset);
		scroll-snap-type: inline proximity;
		scrollbar-width: thin;
	}
	li {
		scroll-snap-align: start;
	}
	a {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid #e9e6dc;
		border-radius: 4px;
		overflow: hidden;
		color: inherit;
		text-decoration: none;
	}
	a:focus-visible {
		outline: 2px solid #16161a;
		outline-offset: 2px;
	}
	.catalog-photo {
		aspect-ratio: 1;
	}
	.card {
		padding: 0.45rem;
		font-size: 0.875rem;
	}
	.card p {
		margin: 0;
	}
	.name {
		display: -webkit-box;
		min-height: 2.7em;
		overflow: hidden;
		overflow-wrap: anywhere;
		line-height: 1.35;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	strong,
	[data-fact='rating'],
	[data-fact='sold'] {
		font-family: var(--product-figure-font);
	}
	strong {
		display: block;
		margin-block: 0.1rem 0.3rem;
		font-size: 1rem;
	}
	.rating {
		display: flex;
		align-items: center;
		gap: 0.2rem;
	}
	.sold {
		color: #5d5d63;
		font-size: 0.75rem;
	}
</style>
