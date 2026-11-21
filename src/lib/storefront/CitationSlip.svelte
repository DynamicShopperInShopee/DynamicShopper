<script lang="ts">
	import Fact from './Fact.svelte';
	import type { FactLocale, ResolvePrintedFact } from './verifyFacts';

	let {
		citations,
		locale,
		resolve,
		listingHref
	}: {
		citations: readonly { productId: string; field: string }[];
		locale: FactLocale;
		resolve: ResolvePrintedFact;
		listingHref: (id: string) => string;
	} = $props();

	const rows = $derived(
		citations.flatMap(({ productId, field }) => {
			if (!(
				field === 'summary' ||
				field === 'review.0' ||
				field === 'review.1' ||
				field.startsWith('spec.')
			))
				return [];
			const fact = resolve(productId, field, locale);
			return fact && fact.productId === productId && fact.field === field ? [fact] : [];
		})
	);
</script>

{#if rows.length}
	<section lang={locale} aria-label={locale === 'th' ? 'จากรายการสินค้า' : 'From the listing'}>
		<h2>{locale === 'th' ? 'จากรายการสินค้า' : 'From the listing'}</h2>
		<ul>
			{#each rows as row}
				<li><a href={listingHref(row.productId)}><Fact fact={row} /></a></li>
			{/each}
		</ul>
	</section>
{:else}
	<p lang={locale}>
		{locale === 'th' ? 'ยืนยันจากรายการสินค้าไม่ได้' : "I can't confirm that from the listing"}
	</p>
{/if}

<style>
	section {
		max-width: 28rem;
		padding: 1rem;
		border: 1px solid var(--seam, #e9e6dc);
		background: var(--surface, #fff);
	}
	h2 {
		margin: 0;
		font-size: inherit;
	}
	ul {
		margin: 0.5rem 0 0;
		padding-inline-start: 1.25rem;
	}
	a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap, 3rem);
		color: inherit;
		text-decoration: underline;
	}
	a:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
</style>
