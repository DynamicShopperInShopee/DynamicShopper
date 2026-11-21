<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import '../../../lib/assets/fonts/plex.css';
	import { riceCookerReviews, riceCookerSpecs } from '../../../lib/store-catalog';
	import type { PageProps } from './$types';
	import ProductDescription from './ProductDescription.svelte';
	import ProductGallery from './ProductGallery.svelte';
	import ProductSummary from './ProductSummary.svelte';
	import SpecificationsSheet from './SpecificationsSheet.svelte';

	let { data }: PageProps = $props();
	const product = $derived(data.product);
	const th = $derived(data.language === 'th');
	const specs = $derived(riceCookerSpecs[product.id]);
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
			aria-hidden={product.id === 'cooker-1' ? undefined : true}
		>
			{#if product.id === 'cooker-1'}
				<ProductGallery {th} />
			{/if}
		</div>
		<ProductSummary {product} language={data.language} {specs} hasReview={Boolean(review)} />
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
		background: #d0dce6;
	}
	.art[data-category='skin'] {
		background-position: 50% 100%;
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
	}
	@media (min-width: 700px) {
		.listing {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
</style>
