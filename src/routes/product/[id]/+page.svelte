<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import '../../../lib/assets/fonts/plex.css';
	import { riceCookerReviews, riceCookerSpecs } from '../../../lib/store-catalog';
	import { formatBaht, formatNumber } from '../../../lib/store-search';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const product = $derived(data.product);
	const th = $derived(data.language === 'th');
	const specs = $derived(riceCookerSpecs[product.id]);
	import SpecificationsSheet from './SpecificationsSheet.svelte';
	import ProductDescription from './ProductDescription.svelte';
	const review = $derived(riceCookerReviews[product.id]?.[data.language]);
	let hero = $state<HTMLDivElement>();
	let overHero = $state(true);

	onMount(() => {
		if (!hero) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				overHero = entry.isIntersecting;
			},
			{ rootMargin: '-60px 0px 0px' }
		);
		observer.observe(hero);
		return () => observer.disconnect();
	});
</script>

<svelte:head><title>{product.name[data.language]} · DynamicShopper</title></svelte:head>

<main class:with-actions={Boolean(specs)} lang={data.language} data-product={product.id}>
	<header data-over-hero={overHero}>
		<a class="back" href={resolve('/')} aria-label={th ? 'กลับหน้าร้าน' : 'Back to store'}>
			<svg
				viewBox="0 0 24 24"
				width="24"
				height="24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.6"
				aria-hidden="true"
			>
				<path d="M21 12H4m7-7-7 7 7 7" />
			</svg>
		</a>
		<span class="hero-shop" data-fact="shop" data-raw={product.shop}>{product.shop}</span>
		<a class="header-search" href={resolve('/')} aria-label={th ? 'ค้นหาสินค้า' : 'Search products'}>
			<svg
				viewBox="0 0 20 20"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<circle cx="8" cy="8" r="5" /><path d="m12 12 5 5" />
			</svg>
			<span>{th ? 'ค้นหาสินค้า' : 'Search products'}</span>
		</a>
		<a
			class="language"
			href={`${resolve('/product/[id]', { id: product.id })}?lang=${th ? 'en' : 'th'}`}
		>
			{th ? 'English' : 'ไทย'}
		</a>
	</header>
	<div class="listing">
		<div
			class="art"
			bind:this={hero}
			data-category={product.category}
			data-model={product.id}
			aria-hidden="true"
		></div>
		<section aria-labelledby="product-title">
			<dl class="prices">
				<div>
					<dt>{th ? 'ราคา' : 'Price'}</dt>
					<dd data-fact="price" data-raw={product.price}>{formatBaht(product.price)}</dd>
				</div>
				{#if product.originalPrice !== null}
					<div>
						<dt>{th ? 'ราคาเดิม' : 'Original price'}</dt>
						<dd data-fact="originalPrice" data-raw={product.originalPrice}>
							<s>{formatBaht(product.originalPrice)}</s>
						</dd>
					</div>
				{/if}
				<div class="sold">
					<dt>{th ? 'ขายแล้ว' : 'Sold'}</dt>
					<dd data-fact="sold" data-raw={product.sold}>{formatNumber(product.sold)}</dd>
				</div>
			</dl>
			{#if specs}
				<dl class="highlights">
					<div>
						<dt>{th ? 'ความจุ' : 'Capacity'}</dt>
						<dd data-fact="capacity" data-raw={specs[0]}>
							{formatNumber(specs[0])}
							{th ? 'ลิตร' : 'L'}
						</dd>
					</div>
					<div>
						<dt>{th ? 'การรับประกัน' : 'Warranty'}</dt>
						<dd data-fact="warranty" data-raw={specs[3]}>
							{formatNumber(specs[3])}
							{th ? 'ปี' : specs[3] === 1 ? 'year' : 'years'}
						</dd>
					</div>
				</dl>
			{/if}
			<h1 id="product-title" data-fact="name" data-raw={product.name[data.language]}>
				{product.name[data.language]}
			</h1>
			<dl class="facts">
				<div class="delivery">
					<dt>
						<svg
							aria-hidden="true"
							width="22"
							height="22"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
						>
							<path d="M2 5h12v12H2zM14 9h4l4 5v3h-8" /><circle cx="6" cy="18" r="2" /><circle
								cx="18"
								cy="18"
								r="2"
							/>
						</svg>
						{th ? 'ค่าจัดส่ง' : 'Shipping'}
					</dt>
					<dd data-fact="shipping" data-raw={product.shipping}>
						{product.shipping === 0 ? (th ? 'ฟรี' : 'Free') : formatBaht(product.shipping)}
					</dd>
				</div>
				<div>
					<dt>{th ? 'คะแนน' : 'Rating'}</dt>
					<dd data-fact="rating" data-raw={product.rating}>{formatNumber(product.rating)}</dd>
				</div>
			</dl>
		</section>
	</div>
	<ProductDescription {product} language={data.language} {review} {specs} />
	{#if specs}
		<SpecificationsSheet {specs} {th} hasReview={Boolean(review)} />
	{/if}
</main>

<style>
	main {
		--product-figure-font: 'IBM Plex Mono', 'IBM Plex Sans Thai', ui-monospace, monospace;
		max-width: 72rem;
		margin: auto;
		padding: 0 0 2rem;
		font-family: 'IBM Plex Sans Thai', system-ui, sans-serif;
		color: #16161a;
		background: #fff;
	}
	header {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		border-bottom: 1px solid #e9e6dc;
		position: sticky;
		top: 0;
		z-index: 1;
		background: #fff;
		padding: 0.375rem 0.75rem;
	}
	header a {
		min-height: 44px;
		display: flex;
		align-items: center;
		color: inherit;
	}
	.hero-shop {
		display: none;
	}
	.back {
		flex: 0 0 44px;
		justify-content: center;
	}
	.header-search {
		flex: 1;
		min-width: 0;
		gap: 0.5rem;
		padding-inline: 0.65rem;
		background: #f4f4f4;
	}
	.listing {
		display: grid;
		gap: 0;
	}
	.art {
		width: 100%;
		aspect-ratio: 1;
		background: white url('../../../lib/assets/products/demo-categories.jpg') no-repeat 0 0 / 300%
			200%;
	}
	.art[data-category='earbuds'] {
		background-position: 50% 0;
	}
	.art[data-category='power'] {
		background-position: 100% 0;
	}
	.art[data-category='cooker'] {
		background-position: 0 100%;
	}
	.art[data-model='cooker-1'] {
		background: #d0dce6 url('../../../lib/assets/products/cooker-listing-hero.jpg') center / cover
			no-repeat;
	}
	.art[data-category='skin'] {
		background-position: 50% 100%;
	}

	dl {
		margin: 1rem 0;
		border-block: 1px dashed #777;
		padding-block: 0.5rem;
	}
	dl div {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 0.25rem 0;
	}
	dd {
		margin: 0;
		font-family: var(--product-figure-font);
	}
	section {
		min-width: 0;
		padding: 0 1rem;
	}
	h1 {
		overflow-wrap: anywhere;
		font-size: 1.25rem;
		line-height: 1.4;
		margin: 0.75rem 0 0.25rem;
	}
	.prices {
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		align-items: baseline;
		border-top: 0;
		border-bottom: 1px solid #e9e6dc;
	}
	.prices div {
		display: block;
	}
	.prices dt {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.prices .sold {
		display: flex;
		gap: 0.25rem;
		margin-inline-start: auto;
		font-size: 0.875rem;
	}
	.prices .sold dt {
		position: static;
		width: auto;
		height: auto;
		overflow: visible;
		clip-path: none;
	}
	.prices dd[data-fact='price'] {
		font-size: 1.7rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}
	.facts {
		border: 0;
		margin: 0;
	}
	.facts div {
		min-height: 44px;
		align-items: center;
		border-top: 1px solid #e9e6dc;
	}
	.highlights {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		margin: 0;
		padding: 0.55rem 0;
		border-top: 0;
		border-bottom: 1px solid #e9e6dc;
	}
	.highlights div {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.1rem;
		padding: 0.15rem 0.6rem;
	}
	.highlights div + div {
		border-inline-start: 1px solid #e9e6dc;
	}
	.highlights dt {
		font-size: 0.875rem;
		color: #5d5d63;
	}
	.highlights dd {
		font-weight: 600;
	}
	.delivery dt {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	@media (max-width: 699px) {
		main {
			--product-actions-height: 50px;
		}
		main.with-actions {
			padding-bottom: calc(var(--product-actions-height) + env(safe-area-inset-bottom, 0px));
		}
		header {
			height: 60px;
			box-sizing: border-box;
			margin-bottom: -60px;
			border: 0;
			background: transparent;
			padding: 8px;
			gap: 4px;
			pointer-events: none;
		}
		header a {
			box-sizing: border-box;
			min-width: 44px;
			justify-content: center;
			background: #27394e;
			color: white;
			border-radius: 999px;
			text-decoration: none;
			pointer-events: auto;
		}
		header .back {
			margin-inline-end: 0.2rem;
		}
		.hero-shop {
			display: block;
			flex: 0 1 auto;
			min-width: 0;
			margin-inline: auto;
			padding: 0.2rem 0.35rem;
			border-radius: 3px;
			color: white;
			background: #27394e;
			overflow-wrap: anywhere;
			font-size: 0.875rem;
			font-weight: 600;
			line-height: 1.25;
		}
		header .header-search {
			background: #27394e;
			flex: 0 0 44px;
			padding: 0;
		}
		.header-search span {
			display: none;
		}
		.language {
			padding-inline: 0.55rem;
			font-size: 0.875rem;
		}
		header[data-over-hero='false'] {
			background: #fff;
			border-bottom: 1px solid #e9e6dc;
		}
		header[data-over-hero='false'] .hero-shop {
			display: none;
		}
		header[data-over-hero='false'] a {
			color: #16161a;
			background: #fff;
		}
		header[data-over-hero='false'] .header-search {
			flex: 1 1 auto;
			justify-content: flex-start;
			padding-inline: 0.65rem;
			background: #f4f4f4;
			border-radius: 4px;
		}
		header[data-over-hero='false'] .header-search span {
			display: inline;
		}
		section {
			padding-inline: 0.8rem;
		}
		.prices {
			min-height: 52px;
			align-content: center;
			padding-block: 0.4rem;
		}
		.prices dd[data-fact='price'] {
			font-size: 1.375rem;
		}
		.prices s,
		.prices .sold {
			font-size: 0.8rem;
		}
		h1 {
			font-size: 1rem;
			font-weight: 400;
			margin: 0.8rem 0 0.25rem;
		}
		.delivery {
			min-height: 58px;
		}
	}
	@media (min-width: 700px) {
		.listing {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
</style>
