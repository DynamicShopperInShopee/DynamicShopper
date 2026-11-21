<script module lang="ts">
	import type { AppliedVoucher } from '#lib/pricing/index.ts';

	export type ShelfVoucher = Pick<AppliedVoucher, 'code' | 'expiresSoon'>;
</script>

<script lang="ts">
	import { resolveCatalogFact } from './catalogFact';
	import type { Snippet } from 'svelte';
	import CategoryGlyph from '#lib/CategoryGlyph.svelte';
	import type { Category } from '#lib/store-catalog.js';
	import type { ShopperPlan } from '#lib/personalization/index.ts';
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
	type Detail = ShopperPlan['details'][number];
	const defaultDetails: readonly Detail[] = ['image', 'price', 'specs'];

	let {
		productIds,
		layout,
		locale,
		columns,
		resolve = resolveCatalogFact,
		listingHref,
		categoryFor,
		details = defaultDetails,
		vouchersFor,
		extras
	}: {
		productIds: readonly string[];
		layout: 'table' | 'grid' | 'large-print';
		locale: FactLocale;
		columns: readonly SpecColumn[];
		resolve?: ResolvePrintedFact;
		listingHref: (id: string) => string;
		categoryFor?: (id: string) => Category | undefined;
		details?: readonly Detail[];
		vouchersFor?: (id: string) => readonly ShelfVoucher[];
		extras?: Snippet<[string]>;
	} = $props();

	const copy = {
		en: {
			product: 'Product',
			price: 'Price',
			was: 'Was',
			empty: 'No products to show',
			shelf: 'Products',
			rating: 'Rating',
			reviewCount: 'Reviews',
			sold: 'Sold',
			shop: 'Shop',
			shipping: 'Shipping',
			vouchers: 'Vouchers',
			expiry: 'Expires soon'
		},
		th: {
			product: 'สินค้า',
			price: 'ราคา',
			was: 'ราคาเดิม',
			empty: 'ไม่มีสินค้าให้แสดง',
			shelf: 'รายการสินค้า',
			rating: 'คะแนน',
			reviewCount: 'จำนวนรีวิว',
			sold: 'ขายแล้ว',
			shop: 'ร้านค้า',
			shipping: 'ค่าจัดส่ง',
			vouchers: 'โค้ดส่วนลด',
			expiry: 'ใกล้หมดอายุ'
		}
	};
	const t = $derived(copy[locale]);
	const specColumns = $derived(details.includes('specs') ? columns : []);
	const ratingFields = ['rating', 'reviewCount', 'sold'] as const;
	const rows = $derived(
		[...new Set(productIds)].flatMap((id) => {
			const name = resolve(id, 'name', locale);
			const price = resolve(id, 'price', locale);
			if (!name || !price) return [];
			const fact = (field: string) => resolve(id, field, locale);
			return [
				{
					id,
					name,
					price,
					originalPrice: fact('originalPrice'),
					specs: specColumns.map((column) => fact(column.field)),
					category: details.includes('image') ? categoryFor?.(id) : undefined,
					summary: details.includes('summary') ? fact('summary') : undefined,
					shop: details.includes('shop') ? fact('shop') : undefined,
					shipping: details.includes('shipping') ? fact('shipping') : undefined,
					ratings: details.includes('rating') ? ratingFields.map((field) => fact(field)) : [],
					reviews: details.includes('reviews') ? [fact('review.0'), fact('review.1')] : [],
					vouchers: details.includes('vouchers') ? (vouchersFor?.(id) ?? []) : []
				}
			];
		})
	);
</script>

{#snippet listing(id: string, name: PrintedFact)}
	<a href={listingHref(id)}><Fact fact={name} /></a>
{/snippet}

{#snippet factLine(label: string, fact: PrintedFact | undefined, numeric = false)}
	{#if fact}
		<div>
			<dt>{label}</dt>
			<dd class:number={numeric}><Fact {fact} /></dd>
		</div>
	{/if}
{/snippet}

{#snippet originalPrice(fact: PrintedFact)}
	<span class="was">{t.was} <s><Fact {fact} /></s></span>
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
						{#each specColumns as column (column.field)}
							<th scope="col" class="number">{column.label[locale]}</th>
						{/each}
						{#if details.includes('rating')}<th scope="col" class="number">{t.rating}</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.id)}
						<tr>
							<th scope="row">
								{@render listing(row.id, row.name)}
								{#if row.shop}<div class="table-meta"><Fact fact={row.shop} /></div>{/if}
								{#if row.shipping}<div class="table-meta">
										{t.shipping}
										<Fact fact={row.shipping} />
									</div>{/if}
							</th>
							<td class="number">
								<Fact fact={row.price} />
								{#if row.originalPrice}{@render originalPrice(row.originalPrice)}{/if}
							</td>
							{#each row.specs as spec, i (specColumns[i].field)}
								<td class="number">
									{#if spec}<Fact fact={spec} />{/if}
								</td>
							{/each}
							{#if details.includes('rating')}
								<td class="number">
									{#each row.ratings as fact, i (ratingFields[i])}
										{#if fact}<div>
												{#if i > 0}{t[ratingFields[i]]}
												{/if}<Fact {fact} />
											</div>{/if}
									{/each}
								</td>
							{/if}
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
						{#each details as detail (detail)}
							{#if detail === 'price'}
								<dl>
									<div>
										<dt>{t.price}</dt>
										<dd class="number">
											<span class="price"><Fact fact={row.price} /></span>
											{#if row.originalPrice}{@render originalPrice(row.originalPrice)}{/if}
										</dd>
									</div>
								</dl>
							{:else if detail === 'rating'}
								<dl>
									{#each row.ratings as fact, i (ratingFields[i])}
										{@render factLine(t[ratingFields[i]], fact, true)}
									{/each}
								</dl>
							{:else if detail === 'specs' && row.specs.length}
								<dl>
									{#each row.specs as spec, i (specColumns[i].field)}
										{@render factLine(specColumns[i].label[locale], spec, true)}
									{/each}
								</dl>
							{:else if detail === 'shipping' && row.shipping}
								<dl>{@render factLine(t.shipping, row.shipping, true)}</dl>
							{:else if detail === 'shop' && row.shop}
								<p><Fact fact={row.shop} /></p>
							{:else if detail === 'summary' && row.summary}
								<p><Fact fact={row.summary} /></p>
							{:else if detail === 'reviews'}
								{#each row.reviews as review, i (i)}
									{#if review}<blockquote><Fact fact={review} /></blockquote>{/if}
								{/each}
							{:else if detail === 'vouchers' && row.vouchers.length}
								<ul class="vouchers" aria-label={t.vouchers}>
									{#each row.vouchers as voucher (voucher.code)}
										<li>
											<span
												data-source="pricing"
												data-field="voucher.code"
												data-product={row.id}
												data-raw={JSON.stringify(voucher.code)}
											>
												{voucher.code}
											</span>
											{#if voucher.expiresSoon}<span
													data-source="pricing"
													data-field="voucher.expiresSoon"
													data-product={row.id}
													data-raw="true"
												>
													· {t.expiry}
												</span>{/if}
										</li>
									{/each}
								</ul>
							{/if}
						{/each}
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
		padding: var(--shelf-cell-padding, 0.25rem) 0.75rem;
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
	.cards > li {
		border: 1px solid var(--seam, #858172);
		border-radius: var(--radius, 6px);
		background: var(--surface, #fff);
		overflow-wrap: anywhere;
	}
	.card-content {
		min-width: 0;
		padding: 0.75rem 1rem;
	}
	.card-content p,
	.card-content blockquote,
	.vouchers {
		margin: 0.5rem 0 0;
	}
	.card-content blockquote {
		padding-inline-start: 0.75rem;
		border-inline-start: 1px solid var(--seam, #858172);
	}
	.vouchers {
		padding-inline-start: 1.25rem;
	}
	.was {
		display: block;
	}
	.table-meta,
	.was {
		color: var(--muted, #5d5d63);
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
	.large .cards > li:has(.art) {
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
		padding-block: var(--shelf-cell-padding, 0.25rem);
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
