<script module lang="ts">
	import { catalog, type Category } from '../store-catalog';
	import '../assets/products/cooker-photos.css';
	import '../assets/products/shelf-photos.css';

	// Other marketplace tiles reuse a category illustration. Only these models have their own crop.
	const illustrated = new Set([
		'mouse-1',
		'mouse-2',
		'mouse-3',
		'mouse-4',
		'mouse-5',
		'mouse-6',
		'cooker-1',
		'cooker-2',
		'cooker-3',
		'cooker-4',
		'cooker-6',
		'skin-1',
		'skin-2',
		'skin-3',
		'skin-4',
		'skin-5',
		'skin-6'
	]);
	const photographs = new Map(
		catalog
			.filter((product) => illustrated.has(product.id))
			.map((product) => [product.catalogId, product])
	);
</script>

<script lang="ts">
	import type { Locale } from '../catalog';
	import CategoryGlyph from '../CategoryGlyph.svelte';
	import CookerPhotoCaption from './CookerPhotoCaption.svelte';

	let {
		id,
		category,
		locale,
		caption = false
	}: { id: string; category: Category; locale: Locale; caption?: boolean } = $props();
	const photo = $derived(photographs.get(id));
</script>

{#if photo}
	<div
		class="demo-photo relative aspect-square w-full max-w-48"
		data-category={photo.category}
		data-model={photo.id}
		data-cooker-photo={id}
		aria-hidden={caption && id === 'cooker-one-button' ? undefined : true}
	>
		{#if caption && id === 'cooker-one-button'}<CookerPhotoCaption {locale} compact />{/if}
	</div>
{:else}
	<CategoryGlyph {category} />
{/if}
