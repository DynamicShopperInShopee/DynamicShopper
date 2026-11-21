<script lang="ts">
	import type { Snippet } from 'svelte';
	import CategoryGlyph from '#lib/CategoryGlyph.svelte';
	import type { Category } from '#lib/store-catalog.js';
	import Fact from './Fact.svelte';
	import {
		type FactLocale,
		type LocalizedText,
		type PrintedFact,
		type ResolvePrintedFact
	} from './verifyFacts';

	interface SpecColumn {
		field: string;
		label: LocalizedText;
	}

	let {
		productIds,
		layout,
		locale,
		columns,
		resolve,
		listingHref,
		categoryFor,
		extras
	}: {
		productIds: readonly string[];
		layout: 'table' | 'grid' | 'large-print';
		locale: FactLocale;
		columns: readonly SpecColumn[];
		resolve: ResolvePrintedFact;
		listingHref: (id: string) => string;
		categoryFor?: (id: string) => Category | undefined;
		extras?: Snippet<[string]>;
	} = $props();

	const copy = {
		en: { product: 'Product', price: 'Price', empty: 'No products to show', shelf: 'Products' },
		th: { product: 'สินค้า', price: 'ราคา', empty: 'ไม่มีสินค้าให้แสดง', shelf: 'รายการสินค้า' }
	};
	const t = $derived(copy[locale]);
	const rows = $derived(
		[...new Set(productIds)].flatMap((id) => {
			const name = resolve(id, 'name', locale);
			const price = resolve(id, 'price', locale);
			if (!name || !price) return [];
			const specs = columns.map((column) => resolve(id, column.field, locale));
			return [{ id, name, price, specs, category: categoryFor?.(id) }];
		})
	);
</script>

{#snippet listing(id: string, name: PrintedFact)}
	<a href={listingHref(id)}><Fact fact={name} /></a>
{/snippet}

<section class:large={layout === 'large-print'} aria-label={t.shelf} lang={locale}>
	{#if !rows.length}
		<p class="empty">{t.empty}</p>
	{:else if layout === 'table'}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll the table region.) -->
		<div class="table-scroll" role="region" aria-label={t.shelf} tabindex="0">
			<table>
				<thead>
					<tr>
						<th scope="col">{t.product}</th>
						<th scope="col" class="number">{t.price}</th>
						{#each columns as column (column.field)}
							<th scope="col" class="number">{column.label[locale]}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.id)}
						<tr>
							<th scope="row">{@render listing(row.id, row.name)}</th>
							<td class="number"><Fact fact={row.price} /></td>
							{#each row.specs as spec, i (columns[i].field)}
								<td class="number">
									{#if spec}<Fact fact={spec} />{/if}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<ul class="cards" class:grid={layout === 'grid'}>
			{#each rows as row (row.id)}
				<li>
					{#if row.category}
						<div class="art"><CategoryGlyph category={row.category} /></div>
					{/if}
					<div class="card-content">
						<h3>{@render listing(row.id, row.name)}</h3>
						<dl>
							<div>
								<dt>{t.price}</dt>
								<dd class="number price"><Fact fact={row.price} /></dd>
							</div>
							{#each row.specs as spec, i (columns[i].field)}
								{#if spec}
									<div>
										<dt>{columns[i].label[locale]}</dt>
										<dd class="number"><Fact fact={spec} /></dd>
									</div>
								{/if}
							{/each}
						</dl>
						{@render extras?.(row.id)}
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	section {
		min-width: 0;
		color: var(--ink, #16161a);
	}
	.table-scroll {
		max-width: 100%;
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
	}
	th,
	td {
		padding: 0.25rem 0.75rem;
		border-bottom: 1px solid var(--seam, #e9e6dc);
		text-align: start;
		vertical-align: baseline;
	}
	thead th {
		border-bottom: 2px solid currentColor;
	}
	th:first-child {
		min-width: 10rem;
	}
	a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap, 44px);
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.15em;
	}
	a:focus-visible,
	.table-scroll:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 2px;
	}
	.number {
		text-align: end;
	}
	.number :global([data-fact]) {
		font-family: var(--mono, 'IBM Plex Mono', 'IBM Plex Sans Thai', monospace);
		font-variant-numeric: tabular-nums;
	}
	.large {
		font-size: max(1.25rem, 20px);
		line-height: 1.5;
		color: var(--ink, #0d0d10);
	}
	.cards {
		display: grid;
		gap: 0.75rem;
		padding: 0;
		margin: 0;
		list-style: none;
	}
	.cards.grid {
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
	}
	.cards li {
		border: 1px solid var(--seam, #858172);
		border-radius: var(--radius, 6px);
		background: var(--surface, #fff);
		overflow-wrap: anywhere;
	}
	.card-content {
		min-width: 0;
		padding: 0.75rem 1rem;
	}
	.art {
		display: grid;
		place-items: center;
		min-height: 7.5rem;
		border-start-start-radius: inherit;
		border-start-end-radius: inherit;
		background: var(--tile, #e9e6dc);
		color: var(--accent, #16161a);
	}
	.large .cards li:has(.art) {
		display: grid;
		grid-template-columns: minmax(3rem, 25%) minmax(0, 1fr);
	}
	.large .art {
		min-height: auto;
		border-start-end-radius: 0;
		border-end-start-radius: inherit;
	}
	.cards h3 {
		margin: 0;
		font-size: 1.125em;
	}
	.large a {
		min-height: 48px;
	}
	dl,
	dd {
		margin: 0;
	}
	dl > div {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: baseline;
		padding-block: 0.25rem;
		border-top: 1px dotted var(--seam, #858172);
	}
	.price {
		font-size: 1.35em;
		font-weight: 700;
	}
	.empty {
		margin: 0;
		padding: 1rem;
		border: 1px dashed var(--seam, #858172);
	}
</style>
