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
	<section class="max-w-[28rem] border border-[var(--seam,#e9e6dc)] bg-[var(--surface,#fff)] p-4" lang={locale} aria-label={locale === 'th' ? 'จากรายการสินค้า' : 'From the listing'}>
		<h2 class="m-0 text-[inherit]">{locale === 'th' ? 'จากรายการสินค้า' : 'From the listing'}</h2>
		<ul class="mt-2 mb-0 ps-5">
			{#each rows as row, index (index)}
				<li>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- The caller supplies the resolved listing URL. -->
					<a class="inline-flex min-h-[var(--tap,3rem)] items-center text-inherit underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current" href={listingHref(row.productId)}><Fact fact={row} /></a>
				</li>
			{/each}
		</ul>
	</section>
{:else}
	<p lang={locale}>
		{locale === 'th' ? 'ยืนยันจากรายการสินค้าไม่ได้' : "I can't confirm that from the listing"}
	</p>
{/if}

