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
		layout: 'table' | 'grid' | 'list' | 'large-print';
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
	<!-- eslint-disable svelte/no-navigation-without-resolve -- The route supplies its resolved listing URL through listingHref. -->
	<a
		class="inline-flex min-h-[var(--tap,44px)] items-center text-inherit underline underline-offset-[0.15em] group-[.large]/shelf:min-h-12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
		href={listingHref(id)}
	>
		<Fact fact={name} />
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{/snippet}

{#snippet factLine(label: string, fact: PrintedFact | undefined, numeric = false)}
	{#if fact}
		<div
			class="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-[var(--shelf-cell-padding,0.25rem)] [border-top:1px_dotted_var(--seam,#858172)]"
		>
			<dt>{label}</dt>
			<dd
				class={[
					"m-0 [&.number]:text-end [&.number]:[&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&.number]:[&_[data-fact]]:tabular-nums"
				]}
				class:number={numeric}
			>
				<Fact {fact} />
			</dd>
		</div>
	{/if}
{/snippet}

{#snippet originalPrice(fact: PrintedFact)}
	<span class="was block text-[var(--muted,#5d5d63)]">{t.was} <s><Fact {fact} /></s></span>
{/snippet}

<section
	class={[
		'group/shelf min-w-0 text-[var(--ink,#16161a)] [&.large]:text-[length:max(1.25rem,20px)] [&.large]:leading-[1.5] [&.large]:text-[var(--ink,#0d0d10)]'
	]}
	class:large={layout === 'large-print'}
	aria-label={t.shelf}
	lang={locale}
>
	{#if !rows.length}
		<p class="empty m-0 border border-dashed border-[var(--seam,#858172)] p-4">{t.empty}</p>
	{:else if layout === 'table'}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to scroll the table region.) -->
		<div
			class="table-scroll max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
			role="region"
			aria-label={t.shelf}
			tabindex="0"
		>
			<table class="w-full border-collapse">
				<thead>
					<tr>
						<th
							class="px-3 py-[var(--shelf-cell-padding,0.25rem)] text-start align-baseline [border-bottom:2px_solid_currentColor] first:min-w-40"
							scope="col"
						>
							{t.product}
						</th>
						<th
							scope="col"
							class={[
								"number px-3 py-[var(--shelf-cell-padding,0.25rem)] text-end align-baseline [border-bottom:2px_solid_currentColor] first:min-w-40 [&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&_[data-fact]]:tabular-nums"
							]}
						>
							{t.price}
						</th>
						{#each specColumns as column (column.field)}
							<th
								scope="col"
								class={[
									"number px-3 py-[var(--shelf-cell-padding,0.25rem)] text-end align-baseline [border-bottom:2px_solid_currentColor] first:min-w-40 [&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&_[data-fact]]:tabular-nums"
								]}
							>
								{column.label[locale]}
							</th>
						{/each}
						{#if details.includes('rating')}<th
								scope="col"
								class={[
									"number px-3 py-[var(--shelf-cell-padding,0.25rem)] text-end align-baseline [border-bottom:2px_solid_currentColor] first:min-w-40 [&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&_[data-fact]]:tabular-nums"
								]}
							>
								{t.rating}
							</th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.id)}
						<tr>
							<th
								class="px-3 py-[var(--shelf-cell-padding,0.25rem)] text-start align-baseline [border-bottom:1px_solid_var(--seam,#e9e6dc)] first:min-w-40"
								scope="row"
							>
								{@render listing(row.id, row.name)}
								{#if row.shop}<div class="table-meta text-[var(--muted,#5d5d63)]">
										<Fact fact={row.shop} />
									</div>{/if}
								{#if row.shipping}<div class="table-meta text-[var(--muted,#5d5d63)]">
										{t.shipping}
										<Fact fact={row.shipping} />
									</div>{/if}
							</th>
							<td
								class={[
									"number px-3 py-[var(--shelf-cell-padding,0.25rem)] text-end align-baseline [border-bottom:1px_solid_var(--seam,#e9e6dc)] [&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&_[data-fact]]:tabular-nums"
								]}
							>
								<Fact fact={row.price} />
								{#if row.originalPrice}{@render originalPrice(row.originalPrice)}{/if}
							</td>
							{#each row.specs as spec, i (specColumns[i].field)}
								<td
									class={[
										"number px-3 py-[var(--shelf-cell-padding,0.25rem)] text-end align-baseline [border-bottom:1px_solid_var(--seam,#e9e6dc)] [&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&_[data-fact]]:tabular-nums"
									]}
								>
									{#if spec}<Fact fact={spec} />{/if}
								</td>
							{/each}
							{#if details.includes('rating')}
								<td
									class={[
										"number px-3 py-[var(--shelf-cell-padding,0.25rem)] text-end align-baseline [border-bottom:1px_solid_var(--seam,#e9e6dc)] [&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&_[data-fact]]:tabular-nums"
									]}
								>
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
		<ul
			class={[
				'cards group/shelf-cards m-0 grid list-none gap-3 p-0 [&.shelf-grid]:grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]'
			]}
			class:shelf-grid={layout === 'grid'}
			class:list={layout === 'list'}
		>
			{#each rows as row (row.id)}
				<li
					class="rounded-[var(--radius,6px)] border border-[var(--seam,#858172)] bg-[var(--surface,#fff)] wrap-anywhere group-[.large]/shelf:has-[.art]:grid group-[.large]/shelf:has-[.art]:grid-cols-[minmax(3rem,25%)_minmax(0,1fr)]"
				>
					{#if row.category}
						<div
							class="art grid min-h-[7.5rem] place-items-center [border-start-start-radius:inherit] [border-start-end-radius:inherit] bg-[var(--tile,#e9e6dc)] text-[var(--accent,#16161a)] group-[.large]/shelf:min-h-auto group-[.large]/shelf:[border-start-end-radius:0] group-[.large]/shelf:[border-end-start-radius:inherit] group-[.list]/shelf-cards:min-h-auto group-[.list]/shelf-cards:[border-start-end-radius:0] group-[.list]/shelf-cards:[border-end-start-radius:inherit]"
						>
							<CategoryGlyph category={row.category} />
						</div>
					{/if}
					<div class="card-content min-w-0 px-4 py-3">
						<h3 class="m-0 text-[1.125em]">{@render listing(row.id, row.name)}</h3>
						{#each details as detail (detail)}
							{#if detail === 'price'}
								<dl class="m-0">
									<div
										class="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-[var(--shelf-cell-padding,0.25rem)] [border-top:1px_dotted_var(--seam,#858172)]"
									>
										<dt>{t.price}</dt>
										<dd
											class={[
												"number m-0 text-end [&_[data-fact]]:font-[family-name:var(--mono,'IBM_Plex_Mono','IBM_Plex_Sans_Thai',monospace)] [&_[data-fact]]:tabular-nums"
											]}
										>
											<span class="price text-[1.35em] font-bold">
												<Fact fact={row.price} />
											</span>
											{#if row.originalPrice}{@render originalPrice(row.originalPrice)}{/if}
										</dd>
									</div>
								</dl>
							{:else if detail === 'rating'}
								<dl class="m-0">
									{#each row.ratings as fact, i (ratingFields[i])}
										{@render factLine(t[ratingFields[i]], fact, true)}
									{/each}
								</dl>
							{:else if detail === 'specs' && row.specs.length}
								<dl class="m-0">
									{#each row.specs as spec, i (specColumns[i].field)}
										{@render factLine(specColumns[i].label[locale], spec, true)}
									{/each}
								</dl>
							{:else if detail === 'shipping' && row.shipping}
								<dl class="m-0">{@render factLine(t.shipping, row.shipping, true)}</dl>
							{:else if detail === 'shop' && row.shop}
								<p class="mx-0 mt-2 mb-0"><Fact fact={row.shop} /></p>
							{:else if detail === 'summary' && row.summary}
								<p class="mx-0 mt-2 mb-0"><Fact fact={row.summary} /></p>
							{:else if detail === 'reviews'}
								{#each row.reviews as review, i (i)}
									{#if review}<blockquote
											class="mx-0 mt-2 mb-0 ps-3 [border-inline-start:1px_solid_var(--seam,#858172)]"
										>
											<Fact fact={review} />
										</blockquote>{/if}
								{/each}
							{:else if detail === 'vouchers' && row.vouchers.length}
								<ul class="vouchers mx-0 mt-2 mb-0 ps-5" aria-label={t.vouchers}>
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
