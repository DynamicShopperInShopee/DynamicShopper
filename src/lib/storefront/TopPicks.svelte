<script lang="ts">
	import { resolve } from '$app/paths';
	import { type Locale } from '../catalog';
	import type { catalog } from '../store-catalog';
	import FactValue from './FactValue.svelte';

	let {
		products,
		locale,
		theme,
		originQuery
	}: {
		products: typeof catalog;
		locale: Locale;
		theme: string;
		originQuery: string;
	} = $props();
</script>

{#if products.length}
	<section aria-labelledby="top-picks-title">
		<h2 id="top-picks-title">{locale === 'th' ? 'สินค้าที่คัดให้' : 'Top picks'}</h2>
		<ul>
			{#each products.slice(0, 3) as product (product.id)}
				<li>
					<a
						href={resolve(`/product/[id]?lang=${locale}&theme=${theme}${originQuery}`, {
							id: product.id
						})}
					>
						<FactValue productId={product.catalogId} field="name" {locale} />
					</a>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	section {
		margin-block: 1rem;
		border-block-start: 2px solid var(--ink);
	}
	h2 {
		margin-block: 0.65rem 0;
		font-size: 1.125em;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		border-block-end: 1px solid var(--seam);
	}
	a {
		display: flex;
		align-items: center;
		min-height: var(--tap);
		color: var(--ink);
		text-underline-offset: 0.2em;
	}
</style>
