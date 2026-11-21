<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import '../lib/assets/fonts/plex.css';
	import CategoryGlyph from '../lib/CategoryGlyph.svelte';
	import { categories, type Category, type Language } from '../lib/store-catalog';
	import { formatBaht, formatNumber, searchProducts, type Sort } from '../lib/store-search';

	const copy = {
		en: {
			title: 'Browse products',
			skip: 'Skip to products',
			search: 'Search products',
			searchHint: 'Try gaming mouse',
			submit: 'Search',
			categories: 'Categories',
			all: 'All',
			sort: 'Sort by',
			default: 'Catalog order',
			'price-low': 'Price: low to high',
			'price-high': 'Price: high to low',
			'top-rated': 'Top rated',
			'top-sales': 'Top sales',
			filters: 'Filters',
			maxPrice: 'Maximum price (฿)',
			freeOnly: 'Free shipping only',
			clear: 'Clear filters',
			apply: 'Apply filters',
			reset: 'Reset search',
			products: 'Products',
			empty: 'No products match',
			emptyHint: 'Try a different search or clear your filters.',
			shipping: 'Shipping',
			free: 'Free',
			was: 'Was',
			price: 'Price',
			sold: 'Sold',
			rating: 'Rating',
			theme: 'Theme',
			standard: 'Standard',
			minimal: 'Minimal',
			vibrant: 'Vibrant',
			large: 'Large print',
			simulated: 'Simulated catalog'
		},
		th: {
			title: 'เลือกดูสินค้า',
			skip: 'ข้ามไปที่รายการสินค้า',
			search: 'ค้นหาสินค้า',
			searchHint: 'ลองค้นหาเมาส์เกมมิ่ง',
			submit: 'ค้นหา',
			categories: 'หมวดหมู่',
			all: 'ทั้งหมด',
			sort: 'เรียงตาม',
			default: 'ลำดับแค็ตตาล็อก',
			'price-low': 'ราคาต่ำไปสูง',
			'price-high': 'ราคาสูงไปต่ำ',
			'top-rated': 'คะแนนสูงสุด',
			'top-sales': 'ขายดี',
			filters: 'ตัวกรอง',
			maxPrice: 'ราคาสูงสุด (฿)',
			freeOnly: 'เฉพาะสินค้าส่งฟรี',
			clear: 'ล้างตัวกรอง',
			apply: 'ใช้ตัวกรอง',
			reset: 'ล้างการค้นหา',
			products: 'สินค้า',
			empty: 'ไม่พบสินค้าที่ตรงกัน',
			emptyHint: 'ลองเปลี่ยนคำค้นหรือล้างตัวกรอง',
			shipping: 'ค่าจัดส่ง',
			free: 'ฟรี',
			was: 'ราคาเดิม',
			price: 'ราคา',
			sold: 'ขายแล้ว',
			rating: 'คะแนน',
			theme: 'ธีม',
			standard: 'มาตรฐาน',
			minimal: 'เรียบง่าย',
			vibrant: 'สีสด',
			large: 'ตัวอักษรใหญ่',
			simulated: 'แค็ตตาล็อกจำลอง'
		}
	} as const;

	type Theme = 'standard' | 'minimal' | 'vibrant' | 'large';
	const themes = ['standard', 'minimal', 'vibrant', 'large'] as const;
	const sorts = ['default', 'price-low', 'price-high', 'top-rated'] as const;
	const categoryKeys = Object.keys(categories) as Category[];

	let interactive = $state(false);
	onMount(() => {
		interactive = true;
	});

	let language = $state<Language>('en');
	let theme = $state<Theme>('standard');
	let category = $state<Category | 'all'>('all');
	let sort = $state<Sort>('default');
	let draftQuery = $state('');
	let query = $state('');
	let draftPrice = $state<number>();
	let draftShipping = $state(false);
	let maxPrice = $state<number>();
	let freeShipping = $state(false);
	let filtersOpen = $state(false);
	let filterDialog: HTMLDialogElement;
	const eventDemo = $derived(page.url.searchParams.get('demo') === 'shopee');

	const t = $derived(copy[language]);
	const hasFilters = $derived(maxPrice !== undefined || freeShipping);
	const products = $derived(searchProducts({ query, category, sort, maxPrice, freeShipping }));

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		query = draftQuery.trim();
	}

	function applyFilters(event: SubmitEvent) {
		event.preventDefault();
		maxPrice = draftPrice;
		freeShipping = draftShipping;
		if (eventDemo) filterDialog.close();
	}

	function clearFilters() {
		draftPrice = undefined;
		maxPrice = undefined;
		draftShipping = false;
		freeShipping = false;
	}

	function reset() {
		draftQuery = '';
		query = '';
		category = 'all';
		sort = 'default';
		clearFilters();
	}
</script>

<svelte:head>
	<title>DynamicShopper</title>
	<meta
		name="description"
		content="Browse the DynamicShopper simulated catalog in Thai or English."
	/>
</svelte:head>

<div class="store" class:event-demo={eventDemo} data-theme={theme} lang={language}>
	<a class="skip" href="#products">{t.skip}</a>
	{#if !eventDemo}
		<header class="masthead">
			<div class="wrap masthead-inner">
				<a class="brand" href={resolve('/')} aria-label="DynamicShopper">
					<svg
						viewBox="0 0 24 24"
						width="25"
						height="25"
						fill="none"
						stroke="currentColor"
						stroke-width="1.75"
						aria-hidden="true"
					>
						<path d="M5 3h14v18l-3.5-2-3.5 2-3.5-2L5 21zM8 8h8m-8 4h8m-8 4h4" />
					</svg>
					DynamicShopper
				</a>
				<div class="settings">
					<select aria-label={t.theme} bind:value={theme}>
						{#each themes as option (option)}
							<option value={option}>{t[option]}</option>
						{/each}
					</select>
					<button
						type="button"
						lang={language === 'th' ? 'en' : 'th'}
						disabled={!interactive}
						onclick={() => (language = language === 'th' ? 'en' : 'th')}
					>
						{language === 'th' ? 'English' : 'ไทย'}
					</button>
				</div>
			</div>
		</header>
	{/if}

	<main class="wrap">
		<h1 class:visually-hidden={eventDemo}>{t.title}</h1>
		<form class="search" role="search" onsubmit={submitSearch}>
			{#if eventDemo}
				<button type="button" class="search-back" aria-label={t.reset} onclick={reset}>
					<svg
						viewBox="0 0 24 24"
						width="22"
						height="22"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						aria-hidden="true"
					>
						<path d="M21 12H4m7-7-7 7 7 7" />
					</svg>
				</button>
			{/if}
			<label class="visually-hidden" for="search">{t.search}</label>
			<input id="search" type="search" placeholder={t.searchHint} bind:value={draftQuery} />
			{#if eventDemo}
				<button type="submit" class="search-icon" aria-label={t.submit}>
					<svg
						viewBox="0 0 24 24"
						width="22"
						height="22"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						aria-hidden="true"
					>
						<circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" />
					</svg>
				</button>
				<button
					class="filter-trigger"
					type="button"
					aria-haspopup="dialog"
					onclick={() => {
						draftPrice = maxPrice;
						draftShipping = freeShipping;
						filterDialog.showModal();
					}}
				>
					<svg
						viewBox="0 0 24 24"
						width="20"
						height="20"
						fill="none"
						stroke="currentColor"
						stroke-width="1.6"
						aria-hidden="true"
					>
						<path d="M3 5h18l-7 8v6l-4 2v-8z" />
					</svg>
					{t.filters}
				</button>
			{:else}
				<button class="primary" type="submit">{t.submit}</button>
			{/if}
		</form>

		{#if eventDemo}
			<div class="sort-tabs" role="group" aria-label={t.sort}>
				<button type="button" aria-pressed={sort === 'default'} onclick={() => (sort = 'default')}>
					{language === 'th' ? 'เกี่ยวข้อง' : 'Relevance'}
				</button>
				<button
					type="button"
					aria-pressed={sort === 'top-sales'}
					onclick={() => (sort = 'top-sales')}
				>
					{t['top-sales']}
				</button>
				<button
					type="button"
					aria-label={sort === 'price-low' ? t['price-high'] : t['price-low']}
					class:active={sort === 'price-low' || sort === 'price-high'}
					aria-description={sort === 'price-low' || sort === 'price-high' ? t[sort] : undefined}
					onclick={() => (sort = sort === 'price-low' ? 'price-high' : 'price-low')}
				>
					{t.price}
					<svg
						viewBox="0 0 16 16"
						width="14"
						height="14"
						stroke="currentColor"
						fill="none"
						aria-hidden="true"
					>
						{#if sort !== 'price-high'}<path d="m4 7 4-4 4 4" />{/if}
						{#if sort !== 'price-low'}<path d="m4 9 4 4 4-4" />{/if}
					</svg>
				</button>
			</div>
		{/if}

		<nav class="categories" aria-label={t.categories}>
			{#if eventDemo}
				<button
					type="button"
					aria-pressed={freeShipping}
					onclick={() => {
						freeShipping = !freeShipping;
						draftShipping = freeShipping;
					}}
				>
					<svg
						viewBox="0 0 24 24"
						width="17"
						height="17"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						aria-hidden="true"
					>
						<path d="M2 6h12v11H2zM14 10h4l4 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle
							cx="18"
							cy="18"
							r="2"
						/>
					</svg>
					{language === 'th' ? 'ส่งฟรี' : 'Free shipping'}
				</button>
			{/if}
			<button aria-pressed={category === 'all'} onclick={() => (category = 'all')}>{t.all}</button>
			{#each categoryKeys as key (key)}
				<button aria-pressed={category === key} onclick={() => (category = key)}>
					{categories[key][language]}
				</button>
			{/each}
			{#if eventDemo}
				<button
					type="button"
					lang={language === 'th' ? 'en' : 'th'}
					disabled={!interactive}
					onclick={() => (language = language === 'th' ? 'en' : 'th')}
				>
					{language === 'th' ? 'English' : 'ไทย'}
				</button>
			{/if}
		</nav>

		{#if !eventDemo}
			<div class="toolbar">
				<label class="sort">
					<span>{t.sort}</span>
					<select bind:value={sort}>
						{#each sorts as option (option)}
							<option value={option}>{t[option]}</option>
						{/each}
					</select>
				</label>
				<button
					aria-expanded={filtersOpen}
					aria-controls="search-filters"
					onclick={() => (filtersOpen = !filtersOpen)}
				>
					<svg
						viewBox="0 0 20 20"
						width="18"
						height="18"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						aria-hidden="true"
					>
						<path d="M2 5h16M5 10h10m-7 5h4" />
					</svg>
					{t.filters}
				</button>
			</div>
		{/if}

		{#snippet filterFields()}
			<label class="budget">
				{t.maxPrice}
				<input
					type="number"
					min="0"
					max={Number.MAX_SAFE_INTEGER}
					step="1"
					inputmode="numeric"
					bind:value={draftPrice}
				/>
			</label>
			<label class="shipping-option">
				<input type="checkbox" bind:checked={draftShipping} />
				{t.freeOnly}
			</label>
			<div class="filter-actions">
				<button class="primary" type="submit">{t.apply}</button>
				<button type="button" onclick={clearFilters}>{t.clear}</button>
			</div>
		{/snippet}

		{#if eventDemo}
			<dialog class="demo-filter" bind:this={filterDialog} aria-labelledby="demo-filter-title">
				<div class="drawer-heading">
					<h2 id="demo-filter-title">{t.filters}</h2>
					<button
						type="button"
						aria-label={language === 'th' ? 'ปิด' : 'Close'}
						onclick={() => filterDialog.close()}
					>
						<svg
							viewBox="0 0 16 16"
							width="20"
							height="20"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"
						>
							<path d="m4 4 8 8M12 4l-8 8" />
						</svg>
					</button>
				</div>
				<form class="filters" onsubmit={applyFilters}>{@render filterFields()}</form>
			</dialog>
		{:else}
			<form id="search-filters" class="filters" hidden={!filtersOpen} onsubmit={applyFilters}>
				{@render filterFields()}
			</form>
		{/if}

		{#if hasFilters}
			<div class="chips">
				{#if maxPrice !== undefined}
					<button
						type="button"
						onclick={() => {
							maxPrice = undefined;
							draftPrice = undefined;
						}}
					>
						{t.maxPrice}
						{formatNumber(maxPrice)}
						<svg
							viewBox="0 0 16 16"
							width="15"
							height="15"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"
						>
							<path d="m4 4 8 8M12 4l-8 8" />
						</svg>
					</button>
				{/if}
				{#if freeShipping}
					<button
						type="button"
						onclick={() => {
							freeShipping = false;
							draftShipping = false;
						}}
					>
						{t.freeOnly}
						<svg
							viewBox="0 0 16 16"
							width="15"
							height="15"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							aria-hidden="true"
						>
							<path d="m4 4 8 8M12 4l-8 8" />
						</svg>
					</button>
				{/if}
			</div>
		{/if}

		<section id="products" aria-labelledby="products-heading" tabindex="-1">
			<div class="results-header">
				<h2 id="products-heading">{t.products}</h2>
				<p aria-live="polite">
					<span class="visually-hidden">{t.products} </span>
					<span class="figure" data-fact="resultCount" data-raw={products.length}>
						{formatNumber(products.length)}
					</span>
				</p>
			</div>
			{#if products.length === 0}
				<div class="empty">
					<h3>{t.empty}</h3>
					<p>{t.emptyHint}</p>
					<button type="button" class="primary" onclick={reset}>{t.reset}</button>
				</div>
			{:else}
				<ul class="product-grid">
					{#each products as product (product.id)}
						<li class="product" data-product={product.id}>
							<div class="art"><CategoryGlyph category={product.category} /></div>
							<div class="card-body">
								<h3 data-fact="name" data-raw={product.name[language]}>{product.name[language]}</h3>
								<div class="price">
									<span class="visually-hidden">{t.price} </span>
									<strong class="figure" data-fact="price" data-raw={product.price}>
										{formatBaht(product.price)}
									</strong>
									{#if product.originalPrice !== null}
										<span class="visually-hidden">{t.was} </span>
										<s class="figure" data-fact="originalPrice" data-raw={product.originalPrice}>
											{formatBaht(product.originalPrice)}
										</s>
									{/if}
								</div>
								<div class="shipping">
									<span>{t.shipping}</span>
									<span class="leader" aria-hidden="true"></span>
									<span class="figure" data-fact="shipping" data-raw={product.shipping}>
										{product.shipping === 0 ? t.free : formatBaht(product.shipping)}
									</span>
								</div>
								<div class="metadata">
									<span>
										<svg
											viewBox="0 0 20 20"
											width="15"
											height="15"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
											aria-hidden="true"
										>
											<path
												d="m10 2 2.3 5.1 5.6.6-4.2 3.8 1.2 5.5-4.9-2.8L5.1 17l1.2-5.5-4.2-3.8 5.6-.6z"
											/>
										</svg>
										<span class="visually-hidden">{t.rating} </span>
										<span class="figure" data-fact="rating" data-raw={product.rating}>
											{formatNumber(product.rating)}
										</span>
									</span>
									<span>
										{t.sold}
										<span class="figure" data-fact="sold" data-raw={product.sold}>
											{formatNumber(product.sold)}
										</span>
									</span>
								</div>
								<p class="shop" data-fact="shop" data-raw={product.shop}>{product.shop}</p>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
		<footer>
			{eventDemo
				? language === 'th'
					? 'DynamicShopper · เดโมสำหรับงาน'
					: 'DynamicShopper · Event demo'
				: t.simulated}
		</footer>
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
	}
	.store {
		--paper: #fbfbf8;
		--surface: #fff;
		--ink: #16161a;
		--muted: #5d5d63;
		--seam: #e9e6dc;
		--accent: #16161a;
		--void: #d1263b;
		--radius: 4px;
		--tap: 44px;
		--size: 1rem;
		--small: 0.875rem;
		min-height: 100vh;
		background: var(--paper);
		color: var(--ink);
		font:
			var(--size)/1.5 'IBM Plex Sans Thai',
			'Noto Sans Thai',
			system-ui,
			sans-serif;
	}
	.store[data-theme='minimal'] {
		--paper: #fff;
		--seam: #ecebe6;
		--radius: 0;
	}
	.store[data-theme='vibrant'] {
		--accent: #2f3ccf;
		--muted: #4f5068;
		--seam: #e3e3ef;
		--radius: 6px;
	}
	.store[data-theme='large'] {
		--ink: #0d0d10;
		--accent: #0d0d10;
		--muted: #3d3d42;
		--seam: #858172;
		--void: #b01e31;
		--radius: 6px;
		--size: 1.25rem;
		--small: 1.25rem;
		--tap: 48px;
	}
	.store :is(button, a, input, select):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.wrap {
		width: min(100% - 2.5rem, 70rem);
		margin-inline: auto;
	}
	.masthead {
		border-bottom: 1px solid var(--seam);
		background: var(--surface);
	}
	.masthead-inner,
	.settings,
	.search,
	.toolbar,
	.sort,
	.filter-actions,
	.chips {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		flex-wrap: wrap;
	}
	.masthead-inner {
		justify-content: space-between;
		padding-block: 0.6rem;
	}
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: var(--tap);
		color: var(--ink);
		text-decoration: none;
		font-weight: 750;
		letter-spacing: -0.035em;
	}
	button,
	input,
	select {
		box-sizing: border-box;
		min-height: var(--tap);
		min-width: 0;
		font: inherit;
		color: var(--ink);
		background: var(--surface);
		border: 1px solid var(--ink);
		border-radius: var(--radius);
		padding: 0.4rem 0.7rem;
	}
	button {
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
	}
	button:hover {
		background: var(--paper);
	}
	.primary {
		color: white;
		background: var(--accent);
		border-color: var(--accent);
		font-weight: 650;
	}
	.primary:hover {
		background: var(--accent);
		text-decoration: underline;
	}
	main {
		padding-top: clamp(1.15rem, 4vw, 3rem);
	}
	h1,
	h2,
	h3,
	p {
		margin: 0;
	}
	h1 {
		font-size: clamp(1.85rem, 5vw, 3.25rem);
		line-height: 1.23;
		letter-spacing: -0.035em;
	}
	.search {
		margin-block: 0.85rem 1.1rem;
		flex-wrap: nowrap;
	}
	.search input {
		flex: 1;
	}
	input::placeholder {
		color: var(--muted);
	}
	.categories {
		display: flex;
		flex-wrap: wrap;
		gap: 0 0.55rem;
		border-bottom: 1px solid var(--seam);
	}
	.categories button {
		padding-inline: 0.45rem;
		background: transparent;
		border: 0;
		border-radius: 0;
		border-bottom: 3px solid transparent;
		color: var(--muted);
	}
	.categories button[aria-pressed='true'] {
		border-color: var(--accent);
		color: var(--ink);
		font-weight: 700;
	}
	.toolbar {
		justify-content: space-between;
		margin-block: 1rem;
	}
	.sort {
		color: var(--muted);
		font-size: var(--small);
	}
	.filters {
		display: flex;
		gap: 0.85rem 1.1rem;
		flex-wrap: wrap;
		align-items: end;
		padding: 0.85rem;
		border: 1px solid var(--ink);
		background: var(--surface);
		border-radius: var(--radius);
		margin-bottom: 1rem;
	}
	.filters[hidden] {
		display: none;
	}
	.budget {
		display: grid;
		gap: 0.3rem;
	}
	.budget input {
		width: min(100%, 12rem);
	}
	.shipping-option {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
		gap: 0.45rem;
		cursor: pointer;
	}
	.shipping-option input {
		min-height: 0;
		width: 1.15rem;
		height: 1.15rem;
		accent-color: var(--accent);
	}
	.chips {
		margin-bottom: 1rem;
	}
	.chips button {
		border-radius: 999px;
		font-size: var(--small);
	}
	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		border-bottom: 2px solid var(--ink);
		padding-bottom: 0.4rem;
		margin-bottom: 0.75rem;
	}
	h2 {
		font-size: 1.375rem;
	}
	.results-header p,
	footer,
	.shipping,
	.metadata,
	.shop {
		color: var(--muted);
		font-size: var(--small);
	}
	.product-grid {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}
	.product {
		min-width: 0;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: 7.5rem 1fr;
		border: 1px solid var(--seam);
		border-radius: var(--radius);
		background: var(--surface);
		overflow-wrap: anywhere;
	}
	.art {
		display: grid;
		place-items: center;
		background: #e9e6dc;
		color: var(--accent);
	}
	.card-body {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 0.8rem;
	}
	h3 {
		font-size: var(--size);
		line-height: 1.4;
		font-weight: 650;
	}
	.card-body h3 {
		margin-bottom: 0.45rem;
	}
	.figure {
		font-family: 'IBM Plex Mono', 'IBM Plex Sans Thai', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
	}
	.price {
		display: flex;
		gap: 0.25rem 0.6rem;
		align-items: baseline;
		flex-wrap: wrap;
		margin-top: auto;
	}
	.price strong {
		font-size: max(1.45rem, var(--size));
	}
	.price s {
		color: var(--void);
		font-size: var(--small);
	}
	.shipping {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		margin-block: 0.25rem 0.45rem;
		padding-block: 0.32rem;
		border-block: 1px dashed var(--seam);
	}
	.leader {
		flex: 1;
		border-bottom: 1px dotted var(--muted);
	}
	.metadata {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.2rem 0.45rem;
	}
	.metadata > span {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.shop {
		margin-top: 0.2rem;
	}
	.empty {
		padding: 1rem;
		border: 1px dashed var(--ink);
	}
	.empty p {
		margin-block: 0.25rem 0.8rem;
	}
	footer {
		padding-block: 1.25rem;
	}
	.skip,
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}
	.skip:focus {
		clip-path: none;
		z-index: 1;
		inset: 0.5rem auto auto 0.5rem;
		width: auto;
		height: auto;
		background: var(--surface);
		color: var(--ink);
		padding: 0.5rem;
	}

	@media (max-width: 760px) {
		.product-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 520px) {
		.wrap {
			width: calc(100% - 1.5rem);
		}
		.masthead-inner,
		.settings {
			gap: 0.3rem 0.5rem;
		}
		.masthead-inner {
			padding-block: 0.35rem;
		}
		.settings :is(button, select) {
			font-size: var(--small);
			padding-inline: 0.45rem;
		}
		.product-grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.product {
			grid-template-columns: minmax(5rem, 25%) minmax(0, 1fr);
			grid-template-rows: auto;
		}
		.toolbar {
			gap: 0.4rem;
		}
		.sort {
			gap: 0.4rem;
		}
		.sort select {
			max-width: 12.25rem;
		}
		.store[data-theme='large'] .product {
			grid-template-columns: minmax(4rem, 20%) minmax(0, 1fr);
		}
	}

	.event-demo {
		--paper: #f5f5f5;
		--accent: #b83a23;
		--seam: #e4e4e4;
		--radius: 6px;
		--small: 0.8125rem;
		--ink: #222;
		--muted: #585858;
	}
	.event-demo main {
		padding-top: 0;
		width: min(100%, 64rem);
	}
	.event-demo .search,
	.event-demo .sort-tabs,
	.event-demo .categories {
		background: var(--surface);
	}
	.event-demo .search {
		position: sticky;
		top: 0;
		z-index: 3;
		margin: 0;
		padding: 0.375rem 0.5rem;
		gap: 0.375rem;
	}
	.event-demo .search input {
		border-color: #ee4d2d;
		border-radius: 0.75rem;
		padding-inline-end: 2.75rem;
	}
	.event-demo .search-back {
		flex: 0 0 44px;
		padding: 0;
		border: 0;
		color: var(--accent);
	}
	.event-demo .search-icon {
		flex: none;
		width: 44px;
		margin-inline-start: -3.125rem;
		border: 0;
		background: transparent;
		color: var(--ink);
		z-index: 1;
	}
	.event-demo .filter-trigger {
		border: 0;
		color: var(--accent);
		gap: 0.2rem;
		padding-inline: 0.4rem;
	}
	.sort-tabs {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		border-bottom: 1px solid var(--seam);
	}
	.sort-tabs button {
		border: 0;
		border-bottom: 2px solid transparent;
		border-radius: 0;
		color: var(--muted);
		padding: 0.25rem;
		overflow-wrap: anywhere;
	}
	.sort-tabs button[aria-pressed='true'],
	.sort-tabs button.active {
		color: var(--accent);
		border-color: var(--accent);
	}
	.event-demo .categories {
		position: sticky;
		top: calc(var(--tap) + 0.75rem);
		z-index: 2;
		overflow-x: auto;
		flex-wrap: nowrap;
		scrollbar-width: none;
		padding: 0.375rem 0.5rem;
		gap: 0.375rem;
	}
	.event-demo .categories button {
		flex: none;
		white-space: nowrap;
		border: 1px solid transparent;
		border-radius: var(--radius);
		background: #f5f5f5;
		font-size: var(--small);
		padding-inline: 0.5rem;
	}
	.event-demo .categories button[aria-pressed='true'] {
		color: var(--accent);
		border-color: var(--accent);
	}
	.event-demo .results-header {
		border: 0;
		margin-bottom: 0;
		padding: 0.3rem 0.5rem;
	}
	.event-demo .results-header h2 {
		font-size: var(--small);
		color: var(--muted);
	}
	.event-demo .product-grid {
		gap: 0.375rem;
		padding-inline: 0.375rem;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.event-demo .product {
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto 1fr;
	}
	.event-demo .art {
		aspect-ratio: 1;
		background: #efefef;
		color: var(--muted);
	}
	.event-demo .card-body {
		padding: 0.4rem;
	}
	.event-demo .card-body h3 {
		font-size: 0.875rem;
		font-weight: 400;
	}
	.event-demo .price strong {
		color: var(--accent);
		font-size: 1.1rem;
	}
	.event-demo .price s {
		color: var(--muted);
	}
	.event-demo .shipping {
		border: 0;
		margin: 0;
	}
	.event-demo .leader {
		border: 0;
	}
	.event-demo .chips {
		margin: 0.375rem;
	}
	.event-demo .empty {
		margin: 0.5rem;
	}
	.demo-filter {
		box-sizing: border-box;
		margin: 0 0 0 auto;
		padding: 0;
		width: min(88%, 24rem);
		height: 100dvh;
		max-width: none;
		max-height: none;
		border: 0;
		background: var(--surface);
		color: var(--ink);
	}
	.demo-filter::backdrop {
		background: rgb(0 0 0 / 48%);
	}
	.demo-filter[open] {
		display: flex;
		flex-direction: column;
	}
	.drawer-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--paper);
	}
	.drawer-heading h2 {
		font-size: 1rem;
	}
	.drawer-heading button {
		border: 0;
		background: transparent;
	}
	.demo-filter .filters {
		flex: 1;
		flex-direction: column;
		align-items: stretch;
		flex-wrap: nowrap;
		border: 0;
		margin: 0;
	}
	.demo-filter .filter-actions {
		margin-top: auto;
		flex-direction: row-reverse;
	}
	.demo-filter .filter-actions button {
		flex: 1;
		border-color: var(--accent);
	}
	.event-demo footer {
		padding-inline: 0.5rem;
	}

	@media (max-width: 710px) {
		.event-demo .product-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
