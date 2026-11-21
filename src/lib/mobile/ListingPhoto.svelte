<script lang="ts">
	import { listings } from './shop-data';
	import type { ShopListing } from '../catalog-api/types';

	let {
		product,
		lang,
		decorative = false,
		loading = 'lazy',
		class: className
	}: {
		product: ShopListing;
		lang: 'en' | 'th';
		decorative?: boolean;
		loading?: 'eager' | 'lazy';
		class?: string;
	} = $props();
	const bundled = $derived(
		listings.find(
			(item) =>
				item.id === product.id &&
				item.source === product.source &&
				item.imageSource &&
				item.imageSource === product.imageSource
		)
	);
	const src = $derived(bundled?.image ?? product.image);
	let failed = $state<string | null>(null);
</script>

{#if src && src !== failed}
	<img
		class={className}
		{src}
		alt={decorative ? '' : product.name[lang]}
		{loading}
		onerror={(event) => (failed = event.currentTarget.getAttribute('src'))}
	/>
{:else if !decorative}
	<span class="unavailable">
		{lang === 'th' ? 'ยังไม่มีภาพที่ตรวจสอบแล้ว' : 'Verified image unavailable'}
	</span>
{/if}

<style>
	.unavailable {
		display: block;
		padding: 0.5em;
		color: var(--muted);
		font-size: 1em;
		line-height: 1.5;
	}
</style>
