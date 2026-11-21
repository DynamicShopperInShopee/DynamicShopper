<script lang="ts">
	import type { Snippet } from 'svelte';
	import ReadingControls from './ReadingControls.svelte';
	import { resolve } from '$app/paths';
	import {
		categories,
		products,
		specs,
		getProduct,
		formatBaht,
		type Category,
		type Locale
	} from '../catalog';
	import ProductShelf from '../storefront/ProductShelf.svelte';
	import Fact from '../storefront/Fact.svelte';
	import FactsSlip from '../storefront/FactsSlip.svelte';
	import ItemizedDealSlip from '../storefront/ItemizedDealSlip.svelte';
	import { resolveCatalogFact } from '../storefront/catalogFact';
	import { getStoreSession } from '../storefront/store.svelte';
	import { quoteBasket } from '../storefront/quoteBasket';
	import { blockNames, type Recipe } from './parts';
	let {
		recipe,
		locale,
		dataState = 'ready',
		onready
	}: {
		recipe: Recipe;
		locale: Locale;
		dataState?: 'ready' | 'empty' | 'loading' | 'error';
		onready: () => void;
	} = $props();
	const session = getStoreSession();
	let query = $state('');
	let category = $state<Category>('rice-cooker');
	let ceiling = $state<number | undefined>();
	let saved = $state<string[]>([]);
	let reading = $state('standard');
	let scope = $state<HTMLElement>();
	const t = (en: string, th: string) => (locale === 'th' ? th : en);
	const shown = $derived(
		dataState === 'empty'
			? []
			: products
					.filter(
						(p) =>
							p.category === category &&
							(ceiling === undefined || p.price <= ceiling) &&
							`${p.name.en} ${p.name.th}`.toLowerCase().includes(query.toLowerCase().trim())
					)
					.slice(0, 2)
	);
	const ids = $derived(shown.map((p) => p.id));
	const columns = $derived(
		specs[category].map((s) => ({ field: `spec.${s.key}`, label: s.label }))
	);
	const quote = $derived(
		recipe.availability === 'ready' && recipe.blocks.includes('voucher') && dataState === 'ready'
			? quoteBasket(
					ids.map((productId) => ({ productId, quantity: 1 })),
					locale,
					session.clock.context
				)
			: undefined
	);
	const listingHref = (id: string) =>
		`${resolve('/product/[id]', { id })}?${new URLSearchParams({ lang: locale, theme: reading })}`;
	function clear() {
		query = '';
		ceiling = undefined;
		onready();
	}
</script>

<ReadingControls
	{locale}
	bind:reading
	separateApply={recipe.blocks.includes('apply')}
	onreset={() => {
		clear();
		saved = [];
	}}
>
	{#snippet children(readingControls: Snippet<[string]>)}
		<div
			class="canvas {recipe.arrangement}"
			class:readable={reading === 'large'}
			data-preset={recipe.id}
			bind:this={scope}
		>
			{#if dataState === 'loading'}
				<div class="state" role="status">
					<h3>{t('Loading catalog', 'กำลังโหลดข้อมูลสินค้า')}</h3>
					<p>{t('Your selected view stays ready.', 'มุมมองที่เลือกยังคงอยู่')}</p>
					<div class="skeleton" aria-hidden="true"></div>
				</div>
			{:else if dataState === 'error'}
				<div class="state" role="alert">
					<h3>{t('Catalog is unavailable', 'ยังโหลดข้อมูลสินค้าไม่ได้')}</h3>
					<p>{t('Keep your view and try again.', 'ลองใหม่ได้โดยคงมุมมองเดิมไว้')}</p>
					<button onclick={onready}>{t('Try again', 'ลองอีกครั้ง')}</button>
				</div>
			{:else if recipe.availability === 'service'}
				<div class="state" role="status">
					<h3>{recipe.title[locale]}</h3>
					<p>
						{dataState === 'empty'
							? t('No verified data yet.', 'ยังไม่มีข้อมูลที่ยืนยันได้')
							: t('Waiting for the connected service.', 'รอการเชื่อมต่อบริการ')}
					</p>
					<p>{recipe.dependency[locale]}</p>
				</div>
				{#each recipe.blocks as block (block)}
					<section class="anatomy block" aria-label={blockNames[block][locale]}>
						<h3>{blockNames[block][locale]}</h3>
						{#if block === 'photos'}<div class="media-slot" aria-hidden="true">
								<svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor">
									<rect x="4" y="8" width="40" height="32" rx="2" /><path d="m19 16 14 8-14 8Z" />
								</svg>
							</div>
						{:else if block === 'search' || block === 'budget' || block === 'preferences'}<label>
								{blockNames[block][locale]}<input
									disabled
									placeholder={t('Available when connected', 'ใช้งานได้เมื่อเชื่อมระบบ')}
								/>
							</label>
						{:else if block === 'apply' || block === 'payment' || block === 'undo'}<button disabled>
								{blockNames[block][locale]}
							</button>
						{:else}<div class="data-slot">
								<p>{t('No confirmed value', 'ยังไม่มีค่าที่ยืนยันได้')}</p>
							</div>{/if}
					</section>
				{/each}
			{:else}
				{#each recipe.blocks as block (block)}
					<section class="block block-{block}" aria-label={blockNames[block][locale]}>
						<h3>{blockNames[block][locale]}</h3>
						{#if block === 'scope'}
							<div class="brand"><strong>DynamicShopper</strong></div>
						{:else if block === 'search'}
							<label>
								{t('Search products', 'ค้นหาสินค้า')}<input
									type="search"
									bind:value={query}
									placeholder={t('Name or detail', 'ชื่อหรือรายละเอียด')}
								/>
							</label>
						{:else if block === 'categories'}
							<label>
								{t('Category', 'หมวดหมู่')}<select bind:value={category}>
									{#each Object.entries(categories) as [id, name] (id)}<option value={id}>
											{name[locale]}
										</option>{/each}
								</select>
							</label>
						{:else if block === 'budget'}
							<label>
								{t('Maximum price in baht', 'ราคาสูงสุดเป็นบาท')}<input
									type="number"
									min="1"
									step="1"
									bind:value={ceiling}
									placeholder={t('No limit', 'ไม่จำกัด')}
								/>
							</label>
						{:else if block === 'products' || block === 'photos' || block === 'specs'}
							{#if block === 'photos'}
								<p>
									{t(
										'Original product photographs are pending the sourced catalog.',
										'รอภาพถ่ายสินค้าต้นฉบับจากแค็ตตาล็อกที่มีแหล่งข้อมูล'
									)}
								</p>
							{/if}
							<ProductShelf
								productIds={ids}
								layout={block === 'specs'
									? 'table'
									: recipe.arrangement === 'rail' || recipe.arrangement === 'receipt'
										? 'list'
										: 'grid'}
								{locale}
								{columns}
								{listingHref}
								details={block === 'specs'
									? ['price', 'specs']
									: block === 'photos'
										? ['image', 'price']
										: ['image', 'price', 'summary']}
							/>
							{#if block === 'products'}<div class="actions">
									{#each shown as p (p.id)}<button
											aria-pressed={saved.includes(p.id)}
											onclick={() =>
												(saved = saved.includes(p.id)
													? saved.filter((id) => id !== p.id)
													: [...saved, p.id])}
										>
											{t('Save', 'บันทึก')}
											<Fact fact={resolveCatalogFact(p.id, 'name', locale)!} />
										</button>{/each}
								</div>{/if}
						{:else if block === 'price' || block === 'shipping' || block === 'review'}
							<div class="receipt">
								{#each shown as p (p.id)}{@const name = resolveCatalogFact(
										p.id,
										'name',
										locale
									)}{@const fact = resolveCatalogFact(
										p.id,
										block === 'review' ? 'review.0' : block === 'shipping' ? 'shipping' : 'price',
										locale
									)}{#if name && fact}<div>
											<strong><Fact fact={name} /></strong>
											<p><Fact {fact} /></p>
										</div>{/if}{/each}
							</div>
						{:else if block === 'voucher'}
							<ItemizedDealSlip
								receipt={quote?.receipt}
								{locale}
								formatMoney={formatBaht}
								productName={(id: string, lang: Locale) => getProduct(id)?.name[lang]}
							/>
						{:else if block === 'source'}
							<p>
								{t(
									'This review uses the shared catalog fixtures. The updated product database is pending.',
									'การตรวจแบบนี้ใช้ชุดข้อมูลแค็ตตาล็อกร่วม และรอฐานสินค้าเวอร์ชันอัปเดต'
								)}
							</p>
							<FactsSlip {scope} resolve={resolveCatalogFact} {locale} />
						{:else if block === 'saved'}
							{#if saved.length}<ul>
									{#each saved as id (id)}{@const name = resolveCatalogFact(
											id,
											'name',
											locale
										)}{#if name}<li>
												<Fact fact={name} /><button
													onclick={() => (saved = saved.filter((item) => item !== id))}
												>
													{t('Remove', 'นำออก')}
												</button>
											</li>{/if}{/each}
								</ul>
							{:else}<p>{t('Your shortlist is empty.', 'ยังไม่มีรายการที่สนใจ')}</p>
								<div class="actions">
									{#each shown as p (p.id)}<button onclick={() => (saved = [...saved, p.id])}>
											{t('Save', 'บันทึก')}
											<Fact fact={resolveCatalogFact(p.id, 'name', locale)!} />
										</button>{/each}
								</div>{/if}
						{:else if block === 'preferences' || block === 'apply' || block === 'undo'}
							{@render readingControls(block)}
						{:else if block === 'question'}
							<p>{t('What would help you choose?', 'ข้อมูลแบบไหนช่วยให้คุณเลือกได้ง่ายขึ้น?')}</p>
							<a href={resolve('/?view=receipt#assistant')}>
								{t('Open the store assistant', 'เปิดผู้ช่วยหน้าร้าน')}
							</a>
						{:else}
							<div class="unavailable">
								<strong>{t('Service not connected', 'ยังไม่ได้เชื่อมบริการ')}</strong>
								<p>
									{block === 'payment'
										? t(
												'Payment choices and confirmation appear after checkout is connected.',
												'ตัวเลือกชำระเงินและการยืนยันจะแสดงเมื่อเชื่อมระบบชำระเงินแล้ว'
											)
										: t(
												'Order status appears after account and order services are connected.',
												'สถานะคำสั่งซื้อจะแสดงเมื่อเชื่อมบัญชีและระบบคำสั่งซื้อแล้ว'
											)}
								</p>
							</div>
						{/if}
					</section>
				{/each}
				{#if !shown.length}<div class="state" role="status">
						<h3>{t('No matching products', 'ไม่พบสินค้าที่ตรงกัน')}</h3>
						<button onclick={clear}>{t('Clear filters', 'ล้างตัวกรอง')}</button>
					</div>{/if}
			{/if}
		</div>
	{/snippet}
</ReadingControls>

<style>
	.canvas {
		display: grid;
		gap: 16px;
		padding: 24px;
		background: var(--paper);
		container-type: inline-size;
		min-width: 0;
		line-height: 1.6;
	}
	.block {
		min-width: 0;
		padding: 20px;
		background: var(--surface);
		border: 1px solid var(--seam);
		overflow-wrap: anywhere;
	}
	h3 {
		font-size: max(14px, var(--storefront-small));
		color: var(--muted);
		margin: 0 0 16px;
		font-weight: 500;
	}
	p {
		margin: 8px 0;
	}
	.brand {
		background: #ee4d2d;
		color: #fff;
		padding: 20px;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		align-items: center;
	}
	.brand strong {
		font-size: 28px;
	}
	label {
		display: grid;
		gap: 8px;
	}
	input,
	select,
	button,
	a {
		font: inherit;
		min-height: var(--tap, 44px);
		max-width: 100%;
		box-sizing: border-box;
	}
	input,
	select,
	button {
		border: 1px solid var(--muted);
		background: var(--surface);
		color: var(--ink);
		padding: 10px 12px;
		border-radius: var(--radius);
		min-width: 0;
	}
	button {
		cursor: pointer;
		text-align: start;
	}
	button:disabled {
		color: var(--muted);
		border-color: var(--seam);
		cursor: default;
	}
	a {
		display: inline-flex;
		align-items: center;
		color: var(--accent);
		text-underline-offset: 4px;
	}
	:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 3px;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}
	.receipt {
		border-top: 1px dashed var(--muted);
	}
	.receipt > div {
		padding: 12px 0;
		border-bottom: 1px dashed var(--muted);
	}
	.receipt p {
		font-family: var(--mono);
	}
	.unavailable,
	.state {
		border: 1px dashed var(--muted);
		padding: 20px;
		background: var(--surface);
	}
	.state {
		grid-column: 1 / -1;
	}
	.skeleton {
		height: 80px;
		background: var(--seam);
		margin-top: 16px;
	}
	.media-slot {
		min-height: 160px;
		display: grid;
		place-items: center;
		background: var(--seam);
		color: var(--muted);
	}
	.data-slot {
		border-block: 1px dashed var(--muted);
		padding-block: 20px;
		color: var(--muted);
	}
	ul {
		padding-inline-start: 20px;
	}
	li button {
		margin-inline-start: 8px;
	}
	.split,
	.tiles {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
	.tiles .block:first-child {
		grid-column: 1/-1;
	}
	.rail {
		display: flex;
		flex-wrap: wrap;
	}
	.rail .block {
		flex: 1 1 220px;
	}
	.receipt.canvas {
		gap: 0;
	}
	.receipt.canvas .block {
		border: 0;
		border-bottom: 1px dashed var(--muted);
	}
	.focus {
		grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
	}
	.focus .block:first-child {
		grid-row: span 3;
	}
	.readable {
		font-size: 20px;
		--storefront-small: 20px;
		--tap: 48px;
	}
	.readable :global(*) {
		font-size: max(1em, 20px);
	}
	@container (max-width: 560px) {
		.block {
			grid-column: 1/-1;
			grid-row: auto !important;
			padding: 16px;
		}
	}
	@media (max-width: 700px) {
		.canvas {
			padding: 12px;
		}
	}
</style>
