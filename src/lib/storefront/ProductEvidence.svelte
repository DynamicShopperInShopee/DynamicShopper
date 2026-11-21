<script lang="ts">
	import { getProduct, specs, type Locale } from '../catalog';
	import type { ShopperPlan } from '../personalization';
	import FactValue from './FactValue.svelte';

	let {
		productId,
		locale,
		details
	}: {
		productId: string;
		locale: Locale;
		details: ShopperPlan['details'];
	} = $props();
	const product = $derived(getProduct(productId));
</script>

{#if product}
	{#each details as field (field)}
		{#if field === 'specs'}
			<dl class="m-0 grid gap-1">
				{#each specs[product.category].filter(({ key }) => product?.specs[key] !== undefined) as spec (spec.key)}
					<div class="flex justify-between gap-2 [border-bottom:1px_dotted_var(--seam)]">
						<dt>{spec.label[locale]}</dt>
						<dd class="m-0 text-end font-[family-name:'IBM_Plex_Mono',monospace]">
							<FactValue {productId} field={`spec.${spec.key}`} {locale} />
						</dd>
					</div>
				{/each}
			</dl>
		{:else if field === 'reviews' && product.reviews.length}
			<blockquote class="m-0 ps-[0.65rem] [border-inline-start:2px_solid_var(--seam)]">
				<FactValue {productId} field="review.0" {locale} />
			</blockquote>
		{:else if field === 'summary'}
			<FactValue tag="p" {productId} field="summary" {locale} />
		{/if}
	{/each}
{/if}
