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
	const sources = $derived(
		[bundled?.image, product.image].filter((url): url is string => Boolean(url))
	);
	let failed = $state<string[]>([]);
	const src = $derived(sources.find((url) => !failed.includes(url)));

	function imageFailed(event: Event & { currentTarget: Element }) {
		const url = event.currentTarget.getAttribute('src');
		failed = sources.filter((candidate) => candidate === url || failed.includes(candidate));
	}
</script>

{#if src}
	<img
		class={className}
		{src}
		alt={decorative ? '' : product.name[lang]}
		{loading}
		onerror={imageFailed}
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
