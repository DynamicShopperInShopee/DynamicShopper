<script lang="ts">
	import '../lib/assets/products/cooker-photos.css';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { dev } from '$app/env';
	import { onMount, tick } from 'svelte';
	import { SvelteURL } from 'svelte/reactivity';
	import '../lib/assets/fonts/plex.css';
	import CategoryGlyph from '../lib/CategoryGlyph.svelte';
	import SearchShopPreview from './SearchShopPreview.svelte';
	import '../lib/assets/products/shelf-photos.css';
	import { categories, catalog, type Category, type Language } from '../lib/store-catalog';
	import { formatNumber, searchProducts, type Sort } from '../lib/store-search';
	import { formatBaht, products as canonical, specs, type Locale } from '../lib/catalog/index.ts';
	import { findAddOns, optimizeDeal, type DealReceipt, type AddOn } from '../lib/pricing/index.ts';
	import {
		defaultPlan,
		interpretOffline,
		personaPlan,
		rankProducts,
		validateProposal,
		type ShopperPlan,
		type Turn
	} from '../lib/personalization';
	import FactValue from '../lib/storefront/FactValue.svelte';
	import FactsReceipt from '../lib/storefront/FactsReceipt.svelte';
	import DealSlip from '../lib/storefront/DealSlip.svelte';
	import CompareShelves from '../lib/storefront/CompareShelves.svelte';
	import ShelfTable from '../lib/storefront/ShelfTable.svelte';
	import ShoppingAssistant from '../lib/storefront/ShoppingAssistant.svelte';
	import { getStoreOpenedAt } from '../lib/storefront/clock';
	import { fillPresentationGaps, requestLivePreview } from '../lib/storefront/live-preview';
	import { projectLiveHints } from '../lib/personalization/live';
	import { assistantCopy, rankingTerms, storefrontCopy } from '../lib/storefront/copy';

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
	let filterDialog = $state<HTMLDialogElement>();
	const sharedLook = $derived(page.url.searchParams.get('look') ?? '');
	const validLook = $derived(
		/^(standard|minimal|vibrant|large)\.(grid|list|table)\.(en|th)$/.test(sharedLook)
	);
	const eventDemo = $derived(page.url.searchParams.get('view') !== 'receipt' && !validLook);
	const originQuery = $derived(
		eventDemo ? '' : validLook ? '&view=receipt&look=' + sharedLook : '&view=receipt'
	);
	let proofRoot = $state<HTMLElement>();
	let plan = $state<ShopperPlan>(structuredClone(defaultPlan));
	let adapted = $state(false);
	let undoStack = $state<
		{
			plan: ShopperPlan;
			adapted: boolean;
			sort: Sort;
			freeShipping: boolean;
			locks: (keyof ShopperPlan)[];
		}[]
	>([]);
	let locks = $state<(keyof ShopperPlan)[]>([]);
	let compareOpen = $state(false);
	let traceOpen = $state(false);
	let poisonArmed = $state(false);
	let liveEnabled = $state(false);
	let livePending = $state(false);
	let liveFallback = $state(false);
	let liveModel = $state<string>();
	let liveRequest: AbortController | undefined;
	let pendingLocalTurn: Turn | undefined;

	function cancelLive() {
		liveRequest?.abort();
		liveRequest = undefined;
		pendingLocalTurn = undefined;
		livePending = false;
	}
	function toggleLive() {
		const fallback = pendingLocalTurn;
		cancelLive();
		liveEnabled = !liveEnabled;
		if (fallback) applyTurn(fallback);
	}
	let turn = $state<Turn>();
	let changes = $state<(keyof ShopperPlan)[]>([]);
	let focusedProduct = $state<string>();
	let quote = $state<{ receipt: DealReceipt; locale: Locale; addOns: readonly AddOn[] }>();
	let closeQuoteButton = $state<HTMLButtonElement>();
	let quoteTrigger: HTMLElement | undefined;
	let opening = $state<number>();
	let referenceTime = $state<number>();

	const categoryFromShelf = {
		mouse: 'mouse',
		earbuds: 'earbuds',
		power: 'power-bank',
		cooker: 'rice-cooker',
		skin: 'skincare'
	} as const;
	const shelfFromCategory = {
		mouse: 'mouse',
		earbuds: 'earbuds',
		'power-bank': 'power',
		'rice-cooker': 'cooker',
		skincare: 'skin'
	} as const;
	const activePlan = $derived<ShopperPlan>({
		...plan,
		query,
		locale: language,
		maxPrice: maxPrice ?? null,
		category: category === 'all' ? null : categoryFromShelf[category],
		theme: theme === 'large' ? 'large-print' : theme
	});
	const ranked = $derived(
		adapted
			? rankProducts(
					freeShipping ? canonical.filter(({ shipping }) => shipping === 0) : canonical,
					activePlan
				)
			: []
	);
	const catalogById = new Map(catalog.map((product) => [product.catalogId, product]));
	const a = $derived(assistantCopy[language]);
	const personas = ['standard', 'tech', 'visual', 'mom'] as const;
	let shareCopied = $state(false);

	function remember() {
		undoStack = [
			...undoStack.slice(-19),
			{
				plan: structuredClone($state.snapshot(activePlan)),
				adapted,
				sort,
				freeShipping,
				locks: [...locks]
			}
		];
	}
	function register(key: keyof ShopperPlan) {
		cancelLive();
		if (!locks.includes(key)) locks = [...locks, key];
	}
	function writePlan(next: ShopperPlan) {
		plan = next;
		language = next.locale;
		theme = next.theme === 'large-print' ? 'large' : next.theme;
		query = draftQuery = next.query;
		category = next.category ? shelfFromCategory[next.category] : 'all';
		maxPrice = draftPrice = next.maxPrice ?? undefined;
	}
	function changePlan(patch: Partial<ShopperPlan>, respectLocks: boolean) {
		cancelLive();
		const previous = $state.snapshot(activePlan);
		const entries = Object.entries(patch).filter(
			([key, value]) =>
				value !== undefined &&
				!(respectLocks && locks.includes(key as keyof ShopperPlan)) &&
				JSON.stringify(previous[key as keyof ShopperPlan]) !== JSON.stringify(value)
		);
		changes = entries.map(([key]) => key as keyof ShopperPlan);
		if (!changes.length) return;
		remember();
		writePlan({ ...previous, ...Object.fromEntries(entries) });
		adapted = true;
	}
	function undo() {
		cancelLive();
		const previous = undoStack.at(-1);
		if (!previous) return;
		undoStack = undoStack.slice(0, -1);
		writePlan(previous.plan);
		adapted = previous.adapted;
		sort = previous.sort;
		freeShipping = draftShipping = previous.freeShipping;
		locks = previous.locks;
		changes = [];
	}
	function restoreDefaults() {
		cancelLive();
		remember();
		writePlan(structuredClone(defaultPlan));
		locks = [];
		adapted = false;
		sort = 'default';
		freeShipping = draftShipping = false;
		changes = [];
	}
	function removePreference(key: keyof ShopperPlan) {
		const previous = [...locks];
		changePlan({ [key]: structuredClone(defaultPlan[key]) }, false);
		locks = previous.filter((item) => item !== key);
	}
	function selectPersona(persona: (typeof personas)[number]) {
		changePlan(
			{
				...personaPlan(persona, language),
				query,
				category: activePlan.category,
				maxPrice: activePlan.maxPrice
			},
			false
		);
		for (const field of [
			'theme',
			'layout',
			'density',
			'details',
			'simplified',
			'sections',
			'priorities'
		] as const)
			register(field);
		if (persona === 'mom') register('locale');
	}
	function termName(key: string, productId?: string) {
		const plain = key.startsWith('spec.') ? key.slice(5) : key;
		const product = canonical.find(({ id }) => id === productId);
		const definitions = product ? specs[product.category] : Object.values(specs).flat();
		return (
			definitions.find(({ key: specKey }) => specKey === plain)?.label[language] ??
			rankingTerms[plain]?.[language === 'th' ? 1 : 0] ??
			a.priorities
		);
	}
	function changeName(key: keyof ShopperPlan) {
		return key in a ? a[key as keyof typeof a] : a.appearance;
	}
	function openDeal(productId: string, locale: Locale = language) {
		openBasket([productId], locale);
	}
	function openBasket(productIds: readonly string[], locale: Locale = language) {
		const openedAt = getStoreOpenedAt();
		const context = { openedAt, now: Math.max(openedAt, Date.now()) };
		const basket = productIds.map((productId) => ({ productId, quantity: 1 }));
		const receipt = optimizeDeal(basket, context);
		if (!receipt) return;
		quoteTrigger =
			document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
		focusedProduct = productIds[0];
		quote = { receipt, locale, addOns: findAddOns(basket, context) };
		void tick().then(() => closeQuoteButton?.focus());
	}
	function closeDeal() {
		quote = undefined;
		quoteTrigger?.focus();
	}
	function applyTurn(next: Turn) {
		turn = next;
		changes = [];
		switch (next.intent) {
			case 'change':
				changePlan(next.patch, true);
				break;
			case 'undo':
				undo();
				break;
			case 'reset':
				restoreDefaults();
				break;
			case 'deal':
				if (next.productIds.length) openBasket(next.productIds);
				break;
		}
	}

	function send(message: string) {
		cancelLive();
		liveModel = undefined;
		liveFallback = false;
		const focus = products.some((product) => product.catalogId === focusedProduct)
			? focusedProduct
			: products[0]?.catalogId;
		const simulating = dev && poisonArmed;
		poisonArmed = false;
		const local = simulating
			? validateProposal(
					{
						intent: 'change',
						patch: { price: 1, layout: 'foreign', sections: ['unknown'] },
						reply: '฿1'
					},
					activePlan,
					focus
				)
			: interpretOffline(message, activePlan, focus);
		if (
			simulating ||
			!dev ||
			!liveEnabled ||
			(local.intent !== 'chat' && local.intent !== 'change')
		) {
			applyTurn(local);
			return;
		}
		const hints = projectLiveHints(message);
		if (!hints.length) {
			applyTurn(local);
			return;
		}
		const request = new AbortController();
		liveRequest = request;
		pendingLocalTurn = local;
		livePending = true;
		turn = undefined;
		changes = [];
		void requestLivePreview(resolve('/api/local-assistant'), hints, request.signal).then(
			(result) => {
				if (liveRequest !== request) return;
				liveRequest = undefined;
				pendingLocalTurn = undefined;
				livePending = false;
				if (!result) {
					liveFallback = true;
					applyTurn(local);
					return;
				}
				const proposed = validateProposal(
					{ intent: 'change', patch: result.patch },
					activePlan,
					focus
				);
				const additions = fillPresentationGaps(local.patch, proposed.patch, activePlan, locks);
				const dropped = result.rejected
					? [...new Set([...proposed.dropped, 'unknown-field'])]
					: proposed.dropped;
				if (!Object.keys(additions).length) {
					applyTurn({ ...local, dropped });
					return;
				}
				liveModel = result.model;
				applyTurn({ ...proposed, patch: { ...local.patch, ...additions }, dropped });
			}
		);
	}

	async function shareLook() {
		const link = new SvelteURL(page.url.href);
		link.search = '';
		link.searchParams.set('look', `${theme}.${adapted ? plan.layout : 'grid'}.${language}`);
		try {
			await navigator.clipboard.writeText(link.href);
			shareCopied = true;
		} catch {
			shareCopied = false;
		}
	}
	onMount(() => {
		opening = getStoreOpenedAt();
		referenceTime = Math.max(opening, Date.now());
		const timer = window.setInterval(() => {
			if (opening !== undefined) referenceTime = Math.max(opening, Date.now());
		}, 60_000);
		return () => {
			cancelLive();
			window.clearInterval(timer);
		};
	});
	onMount(() => {
		const look = page.url.searchParams.get('look');
		if (!look || look.length > 40) return;
		const [nextTheme, nextLayout, nextLocale] = look.split('.');
		if (
			look.split('.').length !== 3 ||
			!themes.includes(nextTheme as Theme) ||
			!(nextLayout === 'grid' || nextLayout === 'list' || nextLayout === 'table') ||
			!(nextLocale === 'en' || nextLocale === 'th')
		)
			return;
		changePlan(
			{
				theme: nextTheme === 'large' ? 'large-print' : (nextTheme as ShopperPlan['theme']),
				layout: nextLayout,
				locale: nextLocale
			},
			false
		);
	});

	const t = $derived(storefrontCopy[language]);
	const hasFilters = $derived(maxPrice !== undefined || freeShipping);
	const products = $derived.by(() => {
		const matched = searchProducts({ query, category, sort, maxPrice, freeShipping });
		if (!adapted || eventDemo) return matched;
		if (sort !== 'default') {
			const visible = new Set(
				rankProducts(canonical, { ...activePlan, simplified: false }).map(
					({ product }) => product.id
				)
			);
			const filtered = matched.filter(({ catalogId }) => visible.has(catalogId));
			return plan.simplified ? filtered.slice(0, 3) : filtered;
		}
		return ranked.flatMap(({ product }) => catalogById.get(product.id) ?? []);
	});
	const topDeal = $derived.by(() => {
		const top = products[0];
		if (
			eventDemo ||
			!adapted ||
			!plan.sections.includes('best-deal') ||
			!top ||
			opening === undefined ||
			referenceTime === undefined
		)
			return null;
		return optimizeDeal([{ productId: top.catalogId, quantity: 1 }], {
			openedAt: opening,
			now: referenceTime
		});
	});

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		remember();
		register('query');
		query = draftQuery.trim();
	}

	function applyFilters(event: SubmitEvent) {
		event.preventDefault();
		remember();
		if (draftPrice !== undefined) register('maxPrice');
		maxPrice = draftPrice;
		freeShipping = draftShipping;
		if (eventDemo) filterDialog?.close();
	}

	function clearFilters() {
		cancelLive();
		locks = locks.filter((key) => key !== 'maxPrice');
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

<div
	class="store"
	class:event-demo={eventDemo}
	data-theme={theme}
	data-density={adapted ? plan.density : 'comfortable'}
	lang={language}
>
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
					<select aria-label={t.theme} bind:value={theme} onchange={() => register('theme')}>
						{#each themes as option (option)}
							<option value={option}>{t[option]}</option>
						{/each}
					</select>
					<button
						type="button"
						lang={language === 'th' ? 'en' : 'th'}
						disabled={!interactive}
						onclick={() => {
							register('locale');
							language = language === 'th' ? 'en' : 'th';
						}}
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
						filterDialog?.showModal();
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
					aria-describedby={sort === 'price-low' || sort === 'price-high'
						? 'price-sort-direction'
						: undefined}
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
				{#if sort === 'price-low' || sort === 'price-high'}
					<span id="price-sort-direction" class="visually-hidden">{t[sort]}</span>
				{/if}
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
			<button
				aria-pressed={category === 'all'}
				onclick={() => {
					register('category');
					category = 'all';
				}}
			>
				{t.all}
			</button>
			{#each categoryKeys as key (key)}
				<button
					aria-pressed={category === key}
					onclick={() => {
						register('category');
						category = key;
					}}
				>
					{categories[key][language]}
				</button>
			{/each}
			{#if eventDemo}
				<button
					type="button"
					lang={language === 'th' ? 'en' : 'th'}
					disabled={!interactive}
					onclick={() => {
						register('locale');
						language = language === 'th' ? 'en' : 'th';
					}}
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
						onclick={() => filterDialog?.close()}
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

		{#if !eventDemo}
			<section class="shopper-tools" aria-label={a.persona}>
				<ShoppingAssistant locale={language} onSend={send} />
				<div class="shopper-actions">
					{#each personas as persona (persona)}
						<button type="button" onclick={() => selectPersona(persona)}>{a[persona]}</button>
					{/each}
					<button
						type="button"
						aria-expanded={compareOpen}
						onclick={() => (compareOpen = !compareOpen)}
					>
						{compareOpen ? a.closeCompare : a.compare}
					</button>
					<button type="button" disabled={!undoStack.length} onclick={undo}>{a.undo}</button>
					<button type="button" onclick={restoreDefaults}>{a.reset}</button>
					<button
						type="button"
						disabled={!interactive}
						aria-expanded={traceOpen}
						onclick={() => (traceOpen = !traceOpen)}
					>
						{a.trace}
					</button>
				</div>
				{#if livePending}
					<p class="assistant-reply" role="status">
						{language === 'th' ? 'กำลังทดสอบโมเดล' : 'Testing the live model'}
					</p>
				{/if}
				{#if turn}
					<div class="assistant-reply" aria-live="polite">
						<span class="mode-label">
							{liveModel ? (language === 'th' ? 'โมเดลสด' : 'Live model') : a.offline}
						</span>
						<p>{turn.reply}</p>
						{#if turn.citations.length}
							<strong>{a.fromListing}</strong>
							<ul>
								{#each turn.citations as citation (`${citation.productId}:${citation.field}`)}
									<li>
										<a
											href={resolve(`/product/[id]?lang=${language}&theme=${theme}${originQuery}`, {
												id: citation.productId
											})}
										>
											<FactValue
												productId={citation.productId}
												field={citation.field}
												locale={language}
											/>
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}
				{#if changes.length}
					<div class="assistant-reply" aria-live="polite">
						<strong>{a.changed}</strong>
						<div class="shopper-actions">
							{#each [...new Set(changes.map(changeName))] as label (label)}
								<span>{label}</span>
							{/each}
						</div>
					</div>
				{/if}
				{#if adapted || locks.length}
					<div class="shopper-actions" aria-label={a.appearance}>
						{#each ['theme', 'layout', 'locale', 'category', 'maxPrice', 'query', 'specPreferences'] as value (value)}
							{@const key = value as keyof ShopperPlan}
							{#if JSON.stringify(activePlan[key]) !== JSON.stringify(defaultPlan[key])}
								<button
									type="button"
									aria-label={`${a.remove} ${changeName(key)}`}
									onclick={() => removePreference(key)}
								>
									{changeName(key)}{key === 'maxPrice' && maxPrice
										? ` · ${formatBaht(maxPrice, language)}`
										: ''} ×
								</button>
							{/if}
						{/each}
					</div>
				{/if}
				{#if traceOpen}
					<div class="assistant-reply" aria-label={a.trace}>
						<p>
							{liveModel
								? (language === 'th' ? 'โมเดลสด' : 'Live model') + ` · ${liveModel}`
								: a.offline}
						</p>
						{#if liveFallback}<p>
								{language === 'th'
									? 'ใช้การตอบแบบออฟไลน์แทน'
									: 'Live model unavailable. Used offline mode.'}
							</p>{/if}
						{#if dev}
							<button type="button" onclick={toggleLive} aria-pressed={liveEnabled}>
								{liveEnabled
									? language === 'th'
										? 'บังคับโหมดออฟไลน์'
										: 'Force offline'
									: language === 'th'
										? 'ลองใช้โมเดลสด'
										: 'Try live model'}
							</button>
						{/if}
						{#if turn?.guarded}<p>{a.guard}</p>{/if}
						{#if turn?.dropped.length}<p>{a.rejected}</p>{/if}
						{#if !changes.length}<p>{a.noChange}</p>{/if}
						{#if dev}<button
								type="button"
								disabled={poisonArmed}
								onclick={() => (poisonArmed = true)}
							>
								{poisonArmed ? a.armed : a.poison}
							</button>{/if}
					</div>
				{/if}
			</section>
			{#if compareOpen}
				<CompareShelves plan={activePlan} locale={language} {freeShipping} onDeal={openDeal} />
			{/if}
			{#if quote}
				<section class="quote" lang={quote.locale}>
					<button
						type="button"
						bind:this={closeQuoteButton}
						onclick={closeDeal}
						onkeydown={(event) => {
							if (event.key === 'Escape') closeDeal();
						}}
					>
						{assistantCopy[quote.locale].closeDeal}
					</button>
					<DealSlip receipt={quote.receipt} locale={quote.locale} addOns={quote.addOns} />
				</section>
			{/if}
			{#if topDeal && !quote}<DealSlip receipt={topDeal} locale={language} />{/if}
			{#if adapted && plan.sections.includes('what-matters') && products.length}
				<section class="assistant-reply">
					<strong>{a.guide}</strong>
					<p>
						{[
							...new Set(
								[
									...Object.keys(activePlan.specPreferences),
									...Object.keys(activePlan.priorities)
								].map((key) => termName(key, products[0]?.catalogId))
							)
						].join(' · ')}
					</p>
				</section>
			{/if}
			{#if adapted && plan.sections.includes('share')}
				<div class="shopper-actions">
					<button type="button" onclick={shareLook}>{a.share}</button>
					{#if shareCopied}<span role="status">{a.shared}</span>{/if}
				</div>
			{/if}
		{/if}
		{#if eventDemo && products.length && products.every((product) => product.category === 'cooker')}
			<SearchShopPreview {products} {language} {theme} />
		{/if}
		<section id="products" aria-labelledby="products-heading" tabindex="-1">
			<div class="results-header">
				<h2 id="products-heading">{t.products}</h2>
				{#if eventDemo}
					<a class="assistant-link" href={resolve('/?view=receipt')}>
						{language === 'th' ? 'ผู้ช่วยช้อปปิ้ง' : 'Shopping assistant'}
					</a>
				{/if}
				<p aria-live="polite">
					<span class="visually-hidden">{t.products} </span>
					<span class="figure" data-fact="resultCount" data-raw={products.length}>
						{formatNumber(products.length)}
					</span>
				</p>
			</div>
			{#if !eventDemo}<FactsReceipt root={proofRoot} locale={language} />{/if}
			<div bind:this={proofRoot}>
				{#if products.length === 0}
					<div class="empty">
						<h3>{t.empty}</h3>
						<p>{t.emptyHint}</p>
						<button type="button" class="primary" onclick={reset}>{t.reset}</button>
					</div>
				{:else if !eventDemo && adapted && plan.layout === 'table'}
					<ShelfTable
						products={products.flatMap(
							(product) => canonical.find(({ id }) => id === product.catalogId) ?? []
						)}
						locale={language}
						onDeal={openDeal}
						highlightedSpecs={plan.highlightedSpecs}
					/>
				{:else}
					{#if !eventDemo && adapted && plan.sections.includes('compare')}
						<ShelfTable
							products={products
								.slice(0, 3)
								.flatMap((product) => canonical.find(({ id }) => id === product.catalogId) ?? [])}
							locale={language}
							onDeal={openDeal}
							highlightedSpecs={plan.highlightedSpecs}
						/>
					{/if}
					<ul
						class="product-grid"
						class:list-layout={!eventDemo && adapted && plan.layout === 'list'}
					>
						{#each products as product (product.id)}
							<li class="product" data-product={product.catalogId}>
								{#if eventDemo}
									<div
										class="art demo-photo"
										data-category={product.category}
										data-model={product.id}
										data-cooker-photo={product.catalogId}
										aria-hidden="true"
									></div>
								{:else}
									<div class="art"><CategoryGlyph category={product.category} /></div>
								{/if}
								<div class="card-body">
									<h3>
										<a
											class="product-link"
											href={resolve(`/product/[id]?lang=${language}&theme=${theme}${originQuery}`, {
												id: product.id
											})}
										>
											<FactValue productId={product.catalogId} field="name" locale={language} />
										</a>
									</h3>
									<div class="price">
										<span class="visually-hidden">{t.price} </span>
										<FactValue
											tag="strong"
											class="figure"
											productId={product.catalogId}
											field="price"
											locale={language}
										/>
										{#if product.originalPrice !== null}
											<span class="visually-hidden">{t.was} </span>
											<FactValue
												tag="s"
												class="figure"
												productId={product.catalogId}
												field="originalPrice"
												locale={language}
											/>
										{/if}
									</div>
									<div class="shipping">
										<span>{t.shipping}</span>
										<span class="leader" aria-hidden="true"></span>
										<FactValue
											class="figure"
											productId={product.catalogId}
											field="shipping"
											locale={language}
										/>
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
											<FactValue
												class="figure"
												productId={product.catalogId}
												field="rating"
												locale={language}
											/>
										</span>
										<span>
											{t.sold}
											<FactValue
												class="figure"
												productId={product.catalogId}
												field="sold"
												locale={language}
											/>
										</span>
									</div>
									<FactValue
										tag="p"
										class="shop"
										productId={product.catalogId}
										field="shop"
										locale={language}
									/>
									{#if !eventDemo}
										{@const reasons =
											ranked.find(({ product: item }) => item.id === product.catalogId)?.terms ??
											[]}
										{#if adapted && plan.details.includes('summary')}
											<FactValue
												tag="p"
												productId={product.catalogId}
												field="summary"
												locale={language}
											/>
										{/if}
										{#if adapted && (plan.sections.includes('reviews') || plan.details.includes('reviews'))}
											<FactValue
												tag="p"
												productId={product.catalogId}
												field="review.0"
												locale={language}
											/>
										{/if}
										<button
											class="best-price"
											type="button"
											onclick={() => openDeal(product.catalogId)}
										>
											{a.deal}
										</button>
										{#if adapted && sort === 'default' && !plan.simplified && reasons.length && products.length > 1}
											<details class="rank">
												<summary>{a.rank}</summary>
												<ul>
													{#each reasons.slice(0, 3) as reason (reason.key)}
														<li>{termName(reason.key, product.catalogId)}</li>
													{/each}
												</ul>
											</details>
										{/if}
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>
		<footer>
			{eventDemo
				? language === 'th'
					? 'DynamicShopper · ภาพประกอบสินค้าจำลอง'
					: 'DynamicShopper · Illustrative product images'
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
	.card-body :global(.shop) {
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
	.store[data-density='compact'] .card-body {
		padding: 0.5rem;
		gap: 0.3rem;
	}
	.store[data-density='spacious'] .card-body {
		padding: 1rem;
		gap: 0.65rem;
	}
	.list-layout {
		grid-template-columns: minmax(0, 1fr);
	}
	.shopper-tools,
	.quote {
		margin-block: 1rem;
		border-block: 1px solid var(--seam);
		padding-block: 0.7rem;
	}
	.shopper-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		align-items: center;
		margin-block: 0.55rem;
	}
	.assistant-reply {
		border: 1px dashed var(--seam);
		padding: 0.6rem 0.75rem;
		margin-block: 0.55rem;
		overflow-wrap: anywhere;
	}
	.assistant-reply p {
		margin-block: 0.25rem;
	}
	.mode-label {
		color: var(--muted);
	}
	.best-price,
	.rank {
		position: relative;
		z-index: 1;
		justify-self: start;
	}
	.rank summary {
		min-block-size: var(--tap);
		align-content: center;
		cursor: pointer;
	}
	.product-link::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.product:has(.product-link:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.product {
		position: relative;
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
		color: var(--accent);
	}
	.art:not(.demo-photo) {
		background: #e9e6dc;
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
	.store :global(.figure) {
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
	.price :global(strong) {
		font-size: max(1.45rem, var(--size));
	}
	.price :global(s) {
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
	.card-body :global(.shop) {
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
	}

	.event-demo .card-body {
		padding: 0.4rem;
	}
	.event-demo .card-body h3 {
		font-size: 0.875rem;
		font-weight: 400;
	}
	.event-demo .price :global(strong) {
		color: var(--accent);
		font-size: 1.1rem;
	}
	.event-demo .price :global(s) {
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
	.assistant-link {
		margin-inline-start: auto;
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
		font-size: var(--small);
		color: var(--ink);
		text-decoration: underline;
	}
</style>
