<script lang="ts">
	import { categoryName } from '../catalog-api/client';
	import type { CatalogCategory, ShopListing } from '../catalog-api/types';

	let {
		product,
		categories,
		lang
	}: {
		product: ShopListing;
		categories: readonly CatalogCategory[];
		lang: 'en' | 'th';
	} = $props();
	const label = $derived(categoryName(product.category, categories, lang));
</script>

<span
	data-fact-key={`${product.id}:category`}
	data-raw={product.category}
	data-print={label}
	data-source="catalog"
>
	{label}
</span>
