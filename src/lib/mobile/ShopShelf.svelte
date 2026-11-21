<script lang="ts">
	import ListingPhoto from './ListingPhoto.svelte';
	import { catalogNameAttributes } from './name-attributes';
	import { tick } from 'svelte';
	import ListingCard from './ListingCard.svelte';
	import type { ShopListing, CatalogCategory } from '../catalog-api/types';
	import { pageListings } from '../catalog-api/client';
	import ListingCategory from './ListingCategory.svelte';
	import type { ShopperPlan } from '../personalization/plan';
	import { formatBaht } from '../catalog';
	let {
		plan,
		rows,
		categories = [],
		saved = [],
		onopen,
		onsave,
		forceCompare = false,
		page = $bindable(1)
	}: {
		plan: ShopperPlan;
		rows: readonly ShopListing[];
		categories?: readonly CatalogCategory[];
		saved?: string[];
		onopen: (product: ShopListing) => void;
		onsave?: (id: string) => void;
		forceCompare?: boolean;
		page?: number;
	} = $props();
	const lang = $derived(plan.locale);
	const window = $derived(pageListings(rows, page));
	const sections = $derived(
		[...new Set([...plan.sections, 'products'])].filter(
			(section) => section === 'products' || (section === 'what-matters' && rows.length > 0)
		)
	);
	const factOrder = $derived(
		plan.details.includes('specs') ? ['size', 'price'] : ['price', 'size']
	);
	const table = $derived(
		plan.layout === 'table' || forceCompare || plan.sections.includes('compare')
	);
	const guide = $derived([
		...new Map(window.items.map((product) => [product.category, product])).values()
	]);
	let start = $state<HTMLDivElement>();
	const t = (en: string, th: string) => (lang === 'th' ? th : en);
	const number = (n: number) => new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US').format(n);
	async function move(next: number) {
		page = next;
		await tick();
		start?.scrollIntoView({ block: 'start', behavior: 'instant' });
		start?.focus({ preventScroll: true });
	}
</script>

<div class="shelf-start" bind:this={start} tabindex="-1"></div>
{#each sections as section (section)}
	{#if section === 'what-matters'}
		<section class="choosing-guide" data-section="what-matters">
			<h3>{t('Explore this selection', 'สำรวจสินค้าที่เลือกดู')}</h3>
			<p>
				{t('Open a listing from a product group on this page.', 'เปิดรายการจากกลุ่มสินค้าที่อยู่ในหน้านี้')}
			</p>
			<div class="use-options">
				{#each guide.slice(0, 8) as product (product.category)}<button
						onclick={() => onopen(product)}
					>
						<ListingCategory {product} {categories} {lang} />
					</button>{/each}
			</div>
		</section>
	{:else}
		<div data-section="products">
			{#if window.items.length}<p class="price-note">
					{t(
						'Prices displayed by Shopee when observed; options and eligibility may affect the price.',
						'ราคาที่หน้า Shopee แสดงตอนตรวจ อาจขึ้นกับตัวเลือกและสิทธิ์'
					)}
				</p>{/if}
			{#if table && window.items.length}
				<section class="comparison products {plan.density}" data-layout="table">
					<div class="table-scroll">
						<table>
							<caption>{t('Compare before choosing', 'เทียบก่อนตัดสินใจ')}</caption>
							<thead>
								<tr>
									<th scope="col">{t('Listing', 'รายการสินค้า')}</th>
									{#if plan.details.includes('image')}<th scope="col">
											{t('Picture', 'รูปสินค้า')}
										</th>{/if}
									{#each factOrder as fact (fact)}<th scope="col">
											{fact === 'size'
												? t('Listed details', 'รายละเอียดจากรายการ')
												: t('Observed listing price', 'ราคาที่แสดงตอนตรวจ')}
										</th>{/each}
									<th scope="col">{t('Details', 'รายละเอียด')}</th>
								</tr>
							</thead>
							<tbody>
								{#each window.items as product (product.id)}<tr>
										<th scope="row">
											<button
												onclick={() => onopen(product)}
												{...catalogNameAttributes(product, lang)}
											>
												{product.name[lang]}
											</button><small>
												<ListingCategory {product} {categories} {lang} />
											</small>
										</th>
										{#if plan.details.includes('image')}<td class="photo-cell">
												<ListingPhoto {product} {lang} />
											</td>{/if}
										{#each factOrder as fact (fact)}<td class:price-cell={fact === 'price'}>
												{#if fact === 'size'}
													{#if product.size}<span
															data-fact-key={`${product.id}:size`}
															data-raw={product.size[lang]}
														>
															{product.size[lang]}
														</span>{:else}<span class="unknown">
															{t('Not provided by source', 'ต้นทางไม่ได้ระบุ')}
														</span>{/if}
												{:else if product.price !== null}<span
														data-fact-key={`${product.id}:shopPrice`}
														data-raw={product.price}
														data-print={formatBaht(product.price, lang)}
													>
														{formatBaht(product.price, lang)}
													</span>
												{:else}<span class="unknown">
														{t('Price unavailable', 'ยังไม่มีราคาที่ตรวจสอบได้')}
													</span>{/if}
												{#if fact === 'price' && product.sourceLabel}<small
														class="source-label"
														data-fact-key={`${product.id}:sourceLabel`}
														data-raw={product.sourceLabel[lang]}
													>
														{product.sourceLabel[lang]}
													</small>{/if}
											</td>{/each}
										<td>
											<button class="open-product" onclick={() => onopen(product)}>
												{t('View product', 'ดูสินค้า')}
											</button>
										</td>
									</tr>{/each}
							</tbody>
						</table>
					</div>
					<p class="table-note">
						{t(
							'Saved listing prices, not unit prices. Confirm the selected variant and current terms at the source.',
							'ราคาจากรายการที่บันทึกไว้ ไม่ใช่ราคาต่อหน่วย ตรวจสอบตัวเลือกและเงื่อนไขปัจจุบันที่ต้นทาง'
						)}
					</p>
				</section>
			{:else}
				<div class="products {plan.layout} {plan.density}" data-layout={plan.layout}>
					{#each window.items as product (product.id)}<ListingCard
							{product}
							{lang}
							{categories}
							details={plan.details}
							saved={saved.includes(product.id)}
							onsave={onsave ? () => onsave?.(product.id) : undefined}
							onopen={() => onopen(product)}
						/>{/each}
				</div>
			{/if}
			{#if rows.length}<nav class="pagination" aria-label={t('Product pages', 'หน้ารายการสินค้า')}>
					<p>
						{t('Showing', 'แสดง')}
						{number(window.start + 1)}–{number(window.start + window.items.length)}
						{t('of', 'จาก')} <span data-catalog-count={rows.length}>{number(rows.length)}</span>
					</p>
					{#if window.pages > 1}<div>
							<button disabled={window.page <= 1} onclick={() => move(window.page - 1)}>
								{t('Previous page', 'หน้าก่อน')}
							</button><span>{number(window.page)} / {number(window.pages)}</span><button
								disabled={window.page >= window.pages}
								onclick={() => move(window.page + 1)}
							>
								{t('Next page', 'หน้าถัดไป')}
							</button>
						</div>{/if}
				</nav>{/if}
		</div>
	{/if}
{/each}

<style>
	.price-note {
		margin: 0 0 12px;
		color: var(--muted);
		font-size: 14px;
	}
	:global(.large) .price-note {
		font-size: 20px;
	}
	.source-label {
		display: block;
		margin-top: 6px;
		font-size: 13px;
		font-weight: 400;
		color: var(--muted);
		white-space: normal;
	}
	:global(.large) .source-label {
		font-size: 20px;
	}
	[data-section],
	.shelf-start {
		min-width: 0;
	}
	.shelf-start {
		scroll-margin-top: 100px;
	}
	.choosing-guide {
		border-block: 1px dashed var(--muted);
		padding: 16px 0;
		margin-bottom: 18px;
	}
	.choosing-guide h3 {
		margin: 0;
		font-size: 1.1em;
	}
	.choosing-guide p {
		color: var(--muted);
		margin: 8px 0;
	}
	.use-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.use-options button {
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--line);
		padding: 8px 12px;
	}
	.products {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		min-width: 0;
	}
	.products.list,
	:global(.large) .products {
		grid-template-columns: 1fr;
	}
	.products.comparison {
		display: block;
		background: var(--surface);
		border: 1px solid var(--line);
	}
	.table-scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		min-width: 640px;
		border-collapse: collapse;
		table-layout: fixed;
		font-size: 14px;
	}
	caption {
		padding: 16px;
		font-size: 1.15em;
		text-align: left;
		font-weight: 600;
		border-bottom: 2px solid var(--ink);
	}
	th,
	td {
		padding: 14px 10px;
		border-bottom: 1px solid var(--line);
		border-right: 1px solid var(--line);
		vertical-align: top;
		overflow-wrap: anywhere;
		text-align: left;
	}
	th:first-child {
		width: 28%;
	}
	th button {
		font-weight: 600;
		padding: 0;
		text-align: left;
		background: transparent;
		border: 0;
		color: var(--ink);
	}
	th small {
		display: block;
		color: var(--muted);
		margin-top: 6px;
		font-weight: 400;
	}
	button {
		font: inherit;
		min-height: 44px;
		cursor: pointer;
	}
	.open-product {
		background: var(--accent);
		color: white;
		border: 0;
		padding: 8px;
		border-radius: 4px;
		width: 100%;
	}
	.price-cell {
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 700;
		font-size: 1.2em;
	}
	.unknown {
		color: var(--muted);
		font:
			400 0.875rem 'IBM Plex Sans Thai',
			sans-serif;
	}
	.table-note {
		margin: 0;
		padding: 14px;
		color: var(--muted);
		font-size: 13px;
	}
	.photo-cell :global(img) {
		width: 100%;
		height: 100px;
		object-fit: contain;
	}
	.compact :is(th, td) {
		padding: 10px 8px;
	}
	.spacious :is(th, td) {
		padding-block: 20px;
	}
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
		padding: 20px 0;
	}
	.pagination p {
		margin: 0;
		color: var(--muted);
	}
	.pagination > div {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		align-items: center;
	}
	.pagination button {
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--line);
		padding: 8px 12px;
	}
	.pagination button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	:global(.large) :is(table, .table-note, .unknown, th small, .pagination, .choosing-guide) {
		font-size: 20px;
	}
	:global(.large) button {
		min-height: 48px;
	}
	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>
