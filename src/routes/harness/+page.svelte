<script lang="ts">
	import '../../lib/assets/products/cooker-photos.css';
	import { resolve } from '$app/paths';
	import { afterNavigate, snapshot } from '$app/navigation';
	import { carrySearchToListing, readSearchSelection, searchLimit } from '../search-navigation';
	import { page } from '$app/state';
	import { dev } from '$app/env';
	import { onMount, tick } from 'svelte';
	import { SvelteURL } from 'svelte/reactivity';
	import '../../lib/assets/fonts/plex.css';
	import CategoryGlyph from '../../lib/CategoryGlyph.svelte';
	import CookerSearchSort from '../CookerSearchSort.svelte';
	import SearchQuickFilters from '../SearchQuickFilters.svelte';
	import CookerPhotoCaption from '../../lib/storefront/CookerPhotoCaption.svelte';
	import SearchShopPreview from '../SearchShopPreview.svelte';
	import '../../lib/assets/products/shelf-photos.css';
	import { categories, catalog, type Category, type Language } from '../../lib/store-catalog';
	import { formatNumber, searchProducts, type Sort } from '../../lib/store-search';
	import {
		formatBaht,
		getProduct,
		products as canonical,
		specs,
		type Locale
	} from '../../lib/catalog/index.ts';
	import {
		findAddOns,
		optimizeDeal,
		type DealReceipt,
		type AddOn
	} from '../../lib/pricing/index.ts';
	import { defaultPlan, personaPlan, type ShopperPlan, type Turn } from '../../lib/personalization';
	import FactValue from '../../lib/storefront/FactValue.svelte';
	import FactsReceipt from '../../lib/storefront/FactsReceipt.svelte';
	import DealSlip from '../../lib/storefront/DealSlip.svelte';
	import CompareShelves from '../../lib/storefront/CompareShelves.svelte';
	import ShelfTable from '../../lib/storefront/ShelfTable.svelte';
	import ShoppingAssistant from '#lib/harness-ui/ChatForm.svelte';
	import { getStoreSession } from '#lib/storefront/store.svelte.ts';
	import { HarnessContext, setHarness } from '#lib/harness-ui/context.svelte.ts';
	import {
		toHarness,
		fromHarness,
		websiteState,
		websiteTurn,
		websiteRanking as rankProducts,
		partMap
	} from '#lib/harness-ui/website-adapter.ts';
	import { defaultCatalog, whatChanged, pageSections } from '#lib/harness/index.ts';
	import ChangeSlip from '#lib/harness-ui/ChangeSlip.svelte';
	import Accuracy from '#lib/harness-ui/Accuracy.svelte';
	import AdaptiveCard from '#lib/harness-ui/AdaptiveCard.svelte';

	import { assistantCopy, rankingTerms, storefrontCopy } from '../../lib/storefront/copy';

	type Theme = 'standard' | 'minimal' | 'vibrant' | 'large';
	const themes = ['standard', 'minimal', 'vibrant', 'large'] as const;
	const sorts = ['default', 'price-low', 'price-high', 'top-rated'] as const;
	const cookerSorts = ['default', 'top-sales', 'price-low', 'price-high', 'top-rated'] as const;
	const categoryKeys = Object.keys(categories) as Category[];

	const session = getStoreSession();
	const harness = setHarness(new HarnessContext());
	let assistantOpen = $state(false);
	let interactive = $state(false);
	onMount(() => {
		interactive = true;
		if (page.url.hash === '#assistant') {
			const selection = readSearchSelection(page.state.storeSearch);
			if (selection) restoreSearch({ ...selection, scrollY: undefined });
			assistantOpen = true;
			void tick().then(() =>
				document.querySelector<HTMLInputElement>('.shopper-tools input')?.focus()
			);
		}
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
			capacity?: number;
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

	function cancelLive() {
		harness.cancel();
		livePending = false;
	}
	function toggleLive() {
		cancelLive();
		liveEnabled = !liveEnabled;
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
	const eligibleProducts = $derived(
		canonical.filter(
			(product) =>
				(!freeShipping || product.shipping === 0) &&
				(!cookerSearch || capacity === undefined || product.specs.capacity === capacity)
		)
	);
	const ranked = $derived(adapted ? rankProducts(eligibleProducts, activePlan) : []);
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
				capacity,
				freeShipping,
				locks: [...locks]
			}
		];
	}
	function syncHarness() {
		harness.state = websiteState(
			harness.state,
			$state.snapshot(activePlan),
			[...locks],
			$state.snapshot(undoStack)
		);
	}
	function receipt(before: ShopperPlan) {
		const after = $state.snapshot(activePlan);
		changes = (Object.keys(after) as (keyof ShopperPlan)[]).filter(
			(k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])
		);
		syncHarness();
		harness.changes = whatChanged(
			harness.state.plan,
			changes.map((k) => partMap[k]),
			language,
			defaultCatalog
		);
	}
	function compareSignal() {
		syncHarness();
		harness.signal('open_compare');
	}
	function acceptSuggestion(id: Parameters<typeof harness.accept>[0]) {
		const offered = harness.state.suggestions.find((s) => s.id === id);
		if (!offered) return;
		syncHarness();
		harness.accept(id);
		const next = fromHarness(harness.state.plan);
		const nextLocks = Object.entries(partMap)
			.filter(([, part]) => harness.state.explicit.includes(part))
			.map(([key]) => key as keyof ShopperPlan);
		changePlan(next, false);
		locks = nextLocks;
		syncHarness();
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
		if (!respectLocks)
			locks = [...new Set([...locks, ...entries.map(([key]) => key as keyof ShopperPlan)])];
		receipt(previous);
	}
	function undo() {
		cancelLive();
		const before = $state.snapshot(activePlan);
		const previous = undoStack.at(-1);
		if (!previous) return;
		undoStack = undoStack.slice(0, -1);
		writePlan(previous.plan);
		adapted = previous.adapted;
		sort = previous.sort;
		capacity = previous.capacity;
		freeShipping = draftShipping = previous.freeShipping;
		locks = previous.locks;
		receipt(before);
	}
	function restoreDefaults(keepReply = false) {
		cancelLive();
		quote = undefined;
		quoteTrigger = undefined;
		focusedProduct = undefined;
		if (!keepReply) {
			turn = undefined;
			harness.last = undefined;
			liveModel = undefined;
			liveFallback = false;
		}
		const before = $state.snapshot(activePlan);
		remember();
		writePlan(structuredClone(defaultPlan));
		locks = [];
		adapted = false;
		capacity = undefined;
		sort = 'default';
		freeShipping = draftShipping = false;
		receipt(before);
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
		const openedAt = session.clock.context?.openedAt ?? Date.now();
		referenceTime = Math.max(openedAt, Date.now());
		const context = { openedAt, now: referenceTime };
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
	async function send(message: string) {
		cancelLive();
		harness.state = websiteState(
			harness.state,
			$state.snapshot(activePlan),
			[...locks],
			$state.snapshot(undoStack)
		);
		const focus = products.some((p) => p.catalogId === focusedProduct)
			? focusedProduct
			: products[0]?.catalogId;
		if (focus) harness.focus(focus);
		harness.forceOffline = !liveEnabled && !(dev && poisonArmed);
		harness.poison = dev && poisonArmed;
		poisonArmed = false;
		livePending = true;
		const result = await harness.send(message);
		livePending = harness.pending;
		if (!result) return;
		turn = websiteTurn(result);
		liveModel = result.backend === 'model' ? (result.trace.model ?? 'AI') : undefined;
		liveFallback = !harness.forceOffline && result.backend === 'offline';
		if (result.turn.intent === 'undo') {
			undo();
		} else if (result.turn.intent === 'reset') {
			restoreDefaults(true);
		} else if (JSON.stringify(result.state.plan) !== JSON.stringify(toHarness(activePlan))) {
			remember();
			writePlan(fromHarness(result.state.plan));
			adapted = true;
		}
		changes = result.changes.flatMap((line) =>
			Object.entries(partMap)
				.filter(([, part]) => part === line.part)
				.map(([key]) => key as keyof ShopperPlan)
		);
		harness.changes = whatChanged(
			toHarness(activePlan),
			result.changes.map((line) => line.part),
			language,
			defaultCatalog
		);
		if (result.deal) openBasket(result.basket);
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
		opening = session.clock.context?.openedAt ?? Date.now();
		harness.openedAt = opening;
		referenceTime = Math.max(opening, Date.now());
		const timer = window.setInterval(() => {
			if (opening !== undefined) {
				referenceTime = Math.max(opening, Date.now());
				if (quote) {
					const basket = quote.receipt.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity
					}));
					const clock = { openedAt: opening, now: referenceTime };
					const updated = optimizeDeal(basket, clock);
					if (updated) quote = { ...quote, receipt: updated, addOns: findAddOns(basket, clock) };
				}
			}
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
	let capacity = $state<number>();
	const queryMatches = $derived(eventDemo && query ? searchProducts({ query, category }) : []);
	const cookerSearch = $derived(
		eventDemo &&
			(category === 'cooker' ||
				(queryMatches.length > 0 && queryMatches.every((item) => item.category === 'cooker')))
	);
	const skinSearch = $derived(
		eventDemo &&
			(category === 'skin' ||
				(queryMatches.length > 0 && queryMatches.every((item) => item.category === 'skin')))
	);
	function captureSearch() {
		return eventDemo
			? {
					category,
					language,
					sort,
					query,
					draftQuery,
					maxPrice,
					freeShipping,
					capacity,
					scrollY: Math.max(0, Math.round(window.scrollY))
				}
			: undefined;
	}
	function restoreSearch(input: unknown) {
		const selection = readSearchSelection(input);
		if (!eventDemo || !selection) return;
		({ category, language, sort, query, draftQuery, maxPrice, freeShipping, capacity } = selection);
		draftPrice = maxPrice;
		draftShipping = freeShipping;
		if (selection.scrollY !== undefined) {
			const offset = selection.scrollY;
			void tick().then(async () => {
				await document.fonts.ready;
				await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
				if (page.route.id !== '/harness') return;
				const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
				window.scrollTo({ top: Math.min(offset, maxScroll), behavior: 'instant' });
			});
		}
	}
	snapshot({ id: 'event-store-search', capture: captureSearch, restore: restoreSearch });
	carrySearchToListing(captureSearch);
	afterNavigate(({ from, type }) => {
		if (type !== 'popstate' && from?.route.id === '/product/[id]')
			restoreSearch(page.state.storeSearch);
	});
	const selectedCapacityProduct = $derived(
		cookerSearch && capacity !== undefined
			? canonical.find(
					(item) => item.category === 'rice-cooker' && item.specs.capacity === capacity
				)
			: undefined
	);
	const hasFilters = $derived(maxPrice !== undefined || freeShipping || !!selectedCapacityProduct);
	const products = $derived.by(() => {
		const matched = searchProducts({ query, category, sort, maxPrice, freeShipping }).filter(
			(item) =>
				!cookerSearch ||
				capacity === undefined ||
				getProduct(item.catalogId)?.specs.capacity === capacity
		);
		if (!adapted) return matched;
		if (sort !== 'default') {
			const visible = new Set(
				rankProducts(canonical, { ...activePlan, simplified: false }).map(
					({ product }) => product.id
				)
			);
			const filtered = matched.filter(({ catalogId }) => visible.has(catalogId));
			return plan.simplified ? filtered.slice(0, 3) : filtered;
		}
		const visible = new Set(matched.map((item) => item.catalogId));
		return ranked
			.filter(({ product }) => visible.has(product.id))
			.flatMap(({ product }) => catalogById.get(product.id) ?? []);
	});
	const topDeal = $derived.by(() => {
		const top = products[0];
		if (
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
		changePlan({ query: draftQuery.trim() }, false);
		capacity = undefined;
	}

	function applyFilters(event: SubmitEvent) {
		cancelLive();
		event.preventDefault();
		remember();
		if (draftPrice !== undefined) register('maxPrice');
		maxPrice = draftPrice;
		freeShipping = draftShipping;
		if (eventDemo) filterDialog?.close();
	}

	function clearFilters() {
		cancelLive();
		capacity = undefined;
		locks = locks.filter((key) => key !== 'maxPrice');
		draftPrice = undefined;
		maxPrice = undefined;
		draftShipping = false;
		freeShipping = false;
	}

	function chooseCategory(value: Category | 'all') {
		changePlan({ category: value === 'all' ? null : categoryFromShelf[value] }, false);
		capacity = undefined;
	}

	function openFilters(trigger: HTMLButtonElement) {
		trigger.focus({ preventScroll: true });
		draftPrice = maxPrice;
		draftShipping = freeShipping;
		filterDialog?.showModal();
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
	class={[
		"store harness-store group/harness min-h-screen bg-[var(--paper)] text-[var(--ink)] [font:var(--size)/1.5_'IBM_Plex_Sans_Thai','Noto_Sans_Thai',system-ui,sans-serif] [&_.figure]:[font-family:'IBM_Plex_Mono','IBM_Plex_Sans_Thai',ui-monospace,monospace] [&_.figure]:tabular-nums [&_:where(button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible)]:outline-2 [&_:where(button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible)]:outline-offset-2 [&_:where(button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible)]:outline-[var(--accent)] [&.event-demo]:[overflow-anchor:none] [&:not(.event-demo)_button]:[min-inline-size:var(--tap)]"
	]}
	class:event-demo={eventDemo}
	data-theme={theme}
	data-density={adapted ? plan.density : 'comfortable'}
	lang={language}
>
	<a
		class="skip absolute size-px overflow-hidden [clip-path:inset(50%)] focus:inset-[0.5rem_auto_auto_0.5rem] focus:z-[1] focus:size-auto focus:bg-[var(--surface)] focus:p-2 focus:text-[var(--ink)] focus:[clip-path:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
		href="#products"
	>
		{t.skip}
	</a>
	{#if !eventDemo}
		<header class="masthead border-b border-[var(--seam)] bg-[var(--surface)]">
			<div
				class="wrap masthead-inner mx-auto flex w-[min(100%-2.5rem,70rem)] flex-wrap items-center justify-between gap-[0.65rem] py-[0.6rem] [@media(max-width:520px)]:w-[calc(100%-1.5rem)] [@media(max-width:520px)]:gap-x-2 [@media(max-width:520px)]:gap-y-[0.3rem] [@media(max-width:520px)]:py-[0.35rem]"
			>
				<a
					class="brand inline-flex min-h-[var(--tap)] items-center gap-[0.45rem] font-[750] tracking-[-0.035em] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
					href={resolve('/')}
					aria-label="DynamicShopper"
				>
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
				<div
					class="settings flex flex-wrap items-center gap-[0.65rem] [@media(max-width:520px)]:gap-x-2 [@media(max-width:520px)]:gap-y-[0.3rem]"
				>
					<select
						class="box-border min-h-[var(--tap)] min-w-0 rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [@media(max-width:520px)]:px-[0.45rem] [@media(max-width:520px)]:text-[length:var(--small)]"
						aria-label={t.theme}
						value={theme}
						onchange={(e) =>
							changePlan(
								{
									theme:
										e.currentTarget.value === 'large'
											? 'large-print'
											: (e.currentTarget.value as ShopperPlan['theme'])
								},
								false
							)}
					>
						{#each themes as option (option)}
							<option value={option}>{t[option]}</option>
						{/each}
					</select>
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [@media(max-width:520px)]:px-[0.45rem] [@media(max-width:520px)]:text-[length:var(--small)]"
						type="button"
						lang={language === 'th' ? 'en' : 'th'}
						disabled={!interactive}
						onclick={() => {
							changePlan({ locale: language === 'th' ? 'en' : 'th' }, false);
						}}
					>
						{language === 'th' ? 'English' : 'ไทย'}
					</button>
				</div>
			</div>
		</header>
	{/if}

	<main
		class="wrap mx-auto w-[min(100%-2.5rem,70rem)] pt-[clamp(1.15rem,4vw,3rem)] group-[.event-demo]/harness:w-[min(100%,64rem)] group-[.event-demo]/harness:pt-0 [@media(max-width:520px)]:w-[calc(100%-1.5rem)]"
	>
		<h1
			class={[
				'm-0 text-[length:clamp(1.85rem,5vw,3.25rem)]/[1.23] tracking-[-0.035em] [&.visually-hidden]:absolute [&.visually-hidden]:size-px [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)]'
			]}
			class:visually-hidden={eventDemo}
		>
			{t.title}
		</h1>
		<form
			class={[
				'search group/search mt-[0.85rem] mb-[1.1rem] flex items-center gap-[0.65rem] group-[.event-demo]/harness:sticky group-[.event-demo]/harness:top-0 group-[.event-demo]/harness:z-[3] group-[.event-demo]/harness:m-0 group-[.event-demo]/harness:gap-1.5 group-[.event-demo]/harness:bg-[var(--surface)] group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:py-1.5 [@media(max-width:699px)]:[&.cooker-search]:grid [@media(max-width:699px)]:[&.cooker-search]:grid-cols-[var(--tap)_minmax(0,1fr)_var(--tap)] [@media(max-width:699px)]:[&.cooker-search]:gap-0.5 [@media(max-width:699px)]:[&.cooker-search]:px-0.5'
			]}
			class:cooker-search={cookerSearch}
			role="search"
			onsubmit={submitSearch}
		>
			{#if eventDemo}
				<button
					type="button"
					class="search-back inline-flex min-h-[var(--tap)] min-w-0 flex-[0_0_44px] cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border-0 bg-[var(--surface)] p-0 text-[var(--accent)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [@media(max-width:699px)]:group-[.cooker-search]/search:[grid-area:1/1]"
					aria-label={t.reset}
					onclick={reset}
				>
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
			<label
				class="visually-hidden absolute size-px overflow-hidden [clip-path:inset(50%)]"
				for="search"
			>
				{t.search}
			</label>
			<input
				class="box-border min-h-[var(--tap)] min-w-0 flex-1 rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] group-[.event-demo]/harness:rounded-xl group-[.event-demo]/harness:border-[var(--accent)] group-[.event-demo]/harness:pe-11 placeholder:text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [@media(max-width:699px)]:group-[.cooker-search]/search:w-full [@media(max-width:699px)]:group-[.cooker-search]/search:ps-[var(--tap)] [@media(max-width:699px)]:group-[.cooker-search]/search:pe-2 [@media(max-width:699px)]:group-[.cooker-search]/search:[grid-area:1/2]"
				id="search"
				maxlength={eventDemo ? searchLimit : undefined}
				type="search"
				placeholder={category !== 'all' ? categories[category][language] : t.searchHint}
				bind:value={draftQuery}
			/>
			{#if eventDemo}
				<button
					type="submit"
					class="search-icon z-[1] -ms-[3.125rem] inline-flex min-h-[var(--tap)] w-[44px] min-w-0 flex-none cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border-0 bg-transparent px-[0.7rem] py-[0.4rem] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [@media(max-width:699px)]:group-[.cooker-search]/search:m-0 [@media(max-width:699px)]:group-[.cooker-search]/search:w-[var(--tap)] [@media(max-width:699px)]:group-[.cooker-search]/search:justify-self-start [@media(max-width:699px)]:group-[.cooker-search]/search:[grid-area:1/2]"
					aria-label={t.submit}
				>
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
				{#if cookerSearch}
					<CookerSearchSort
						label={t.sort}
						bind:sort={
							() => sort,
							(value: Sort) => {
								cancelLive();
								remember();
								sort = value;
							}
						}
						options={cookerSorts.map((value) => ({ value, label: t[value] }))}
					/>
				{:else}
					<button
						class="filter-trigger inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.2rem] rounded-[var(--radius)] border-0 bg-[var(--surface)] px-[0.4rem] py-[0.4rem] text-[var(--accent)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="button"
						aria-haspopup="dialog"
						onclick={(event) => openFilters(event.currentTarget)}
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
				{/if}
			{:else}
				<button
					class="primary inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-[0.7rem] py-[0.4rem] [font-weight:650] text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
					type="submit"
				>
					{t.submit}
				</button>
			{/if}
		</form>

		{#if skinSearch && products.length > 0}
			<SearchShopPreview {products} {language} {theme} />
		{/if}
		{#if eventDemo && !cookerSearch}
			<div
				class="sort-tabs grid grid-cols-4 border-b border-[var(--seam)] bg-[var(--surface)]"
				role="group"
				aria-label={t.sort}
			>
				<button
					class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-2 border-transparent bg-[var(--surface)] p-1 wrap-anywhere text-[var(--muted)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]"
					type="button"
					aria-pressed={sort === 'default'}
					onclick={() => {
						cancelLive();
						remember();
						sort = 'default';
					}}
				>
					{language === 'th' ? 'เกี่ยวข้อง' : 'Relevance'}
				</button>
				<button
					class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-2 border-transparent bg-[var(--surface)] p-1 wrap-anywhere text-[var(--muted)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]"
					type="button"
					aria-pressed={sort === 'top-rated'}
					onclick={() => {
						cancelLive();
						remember();
						sort = 'top-rated';
					}}
				>
					{t['top-rated']}
				</button>
				<button
					class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-2 border-transparent bg-[var(--surface)] p-1 wrap-anywhere text-[var(--muted)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)]"
					type="button"
					aria-pressed={sort === 'top-sales'}
					onclick={() => {
						cancelLive();
						remember();
						sort = 'top-sales';
					}}
				>
					{t['top-sales']}
				</button>
				<button
					class={[
						'inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-2 border-transparent bg-[var(--surface)] p-1 wrap-anywhere text-[var(--muted)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:text-[var(--accent)] [&.active]:border-[var(--accent)] [&.active]:text-[var(--accent)]'
					]}
					type="button"
					aria-label={sort === 'price-low' ? t['price-high'] : t['price-low']}
					class:active={sort === 'price-low' || sort === 'price-high'}
					aria-describedby={sort === 'price-low' || sort === 'price-high'
						? 'price-sort-direction'
						: undefined}
					onclick={() => {
						cancelLive();
						remember();
						sort = sort === 'price-low' ? 'price-high' : 'price-low';
					}}
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
					<span
						id="price-sort-direction"
						class="visually-hidden absolute size-px overflow-hidden [clip-path:inset(50%)]"
					>
						{t[sort]}
					</span>
				{/if}
			</div>
		{/if}

		{#if cookerSearch || skinSearch}
			<SearchQuickFilters
				cooker={cookerSearch}
				{language}
				{category}
				bind:capacity={
					() => capacity,
					(value: number | undefined) => {
						cancelLive();
						remember();
						capacity = value;
					}
				}
				{freeShipping}
				{openFilters}
				toggleShipping={() => {
					cancelLive();
					remember();
					freeShipping = !freeShipping;
					draftShipping = freeShipping;
				}}
				changeCategory={(value: Category | 'all') => {
					if (query) {
						draftQuery = query = '';
					}
					chooseCategory(value);
				}}
				toggleLanguage={() => {
					changePlan({ locale: language === 'th' ? 'en' : 'th' }, false);
				}}
			/>
		{:else}
			<nav
				class="categories flex flex-wrap gap-x-[0.55rem] gap-y-0 border-b border-[var(--seam)] group-[.event-demo]/harness:sticky group-[.event-demo]/harness:top-[calc(var(--tap)+0.75rem)] group-[.event-demo]/harness:z-[2] group-[.event-demo]/harness:[scrollbar-width:none] group-[.event-demo]/harness:flex-nowrap group-[.event-demo]/harness:gap-1.5 group-[.event-demo]/harness:overflow-x-auto group-[.event-demo]/harness:bg-[var(--surface)] group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:py-1.5"
				aria-label={t.categories}
			>
				{#if eventDemo}
					<button
						class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-[3px] border-transparent bg-transparent px-[0.45rem] py-[0.4rem] text-[var(--muted)] group-[.event-demo]/harness:flex-none group-[.event-demo]/harness:rounded-[var(--radius)] group-[.event-demo]/harness:border group-[.event-demo]/harness:bg-[var(--paper)] group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:text-[length:var(--small)] group-[.event-demo]/harness:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:font-bold aria-pressed:text-[var(--ink)] group-[.event-demo]/harness:aria-pressed:text-[var(--accent)]"
						type="button"
						aria-pressed={freeShipping}
						onclick={() => {
							cancelLive();
							remember();
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
					class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-[3px] border-transparent bg-transparent px-[0.45rem] py-[0.4rem] text-[var(--muted)] group-[.event-demo]/harness:flex-none group-[.event-demo]/harness:rounded-[var(--radius)] group-[.event-demo]/harness:border group-[.event-demo]/harness:bg-[var(--paper)] group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:text-[length:var(--small)] group-[.event-demo]/harness:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:font-bold aria-pressed:text-[var(--ink)] group-[.event-demo]/harness:aria-pressed:text-[var(--accent)]"
					aria-pressed={category === 'all'}
					onclick={() => chooseCategory('all')}
				>
					{t.all}
				</button>
				{#each categoryKeys as key (key)}
					<button
						class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-[3px] border-transparent bg-transparent px-[0.45rem] py-[0.4rem] text-[var(--muted)] group-[.event-demo]/harness:flex-none group-[.event-demo]/harness:rounded-[var(--radius)] group-[.event-demo]/harness:border group-[.event-demo]/harness:bg-[var(--paper)] group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:text-[length:var(--small)] group-[.event-demo]/harness:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:font-bold aria-pressed:text-[var(--ink)] group-[.event-demo]/harness:aria-pressed:text-[var(--accent)]"
						aria-pressed={category === key}
						onclick={() => chooseCategory(key)}
					>
						{categories[key][language]}
					</button>
				{/each}
				{#if eventDemo}
					<button
						class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] border-b-[3px] border-transparent bg-transparent px-[0.45rem] py-[0.4rem] text-[var(--muted)] group-[.event-demo]/harness:flex-none group-[.event-demo]/harness:rounded-[var(--radius)] group-[.event-demo]/harness:border group-[.event-demo]/harness:bg-[var(--paper)] group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:text-[length:var(--small)] group-[.event-demo]/harness:whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] aria-pressed:border-[var(--accent)] aria-pressed:font-bold aria-pressed:text-[var(--ink)] group-[.event-demo]/harness:aria-pressed:text-[var(--accent)]"
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
		{/if}

		{#if !eventDemo}
			<div
				class="toolbar my-4 flex flex-wrap items-center justify-between gap-[0.65rem] [@media(max-width:520px)]:gap-[0.4rem]"
			>
				<label
					class="sort flex flex-wrap items-center gap-[0.65rem] text-[length:var(--small)] text-[var(--muted)] [@media(max-width:520px)]:gap-[0.4rem]"
				>
					<span>{t.sort}</span>
					<select
						class="box-border min-h-[var(--tap)] min-w-0 rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [@media(max-width:520px)]:max-w-[12.25rem]"
						bind:value={sort}
						onchange={cancelLive}
					>
						{#each sorts as option (option)}
							<option value={option}>{t[option]}</option>
						{/each}
					</select>
				</label>
				<button
					class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
			<label class="budget grid gap-[0.3rem]">
				{t.maxPrice}
				<input
					class="box-border min-h-[var(--tap)] w-[min(100%,12rem)] min-w-0 rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] placeholder:text-[var(--muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
					type="number"
					min="0"
					max={Number.MAX_SAFE_INTEGER}
					step="1"
					inputmode="numeric"
					bind:value={draftPrice}
				/>
			</label>
			<label
				class="shipping-option inline-flex min-h-[var(--tap)] cursor-pointer items-center gap-[0.45rem]"
			>
				<input
					class="box-border size-[1.15rem] min-h-0 min-w-0 rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
					type="checkbox"
					bind:checked={draftShipping}
				/>
				{t.freeOnly}
			</label>
			<div
				class="filter-actions flex flex-wrap items-center gap-[0.65rem] group-[.demo-filter]/drawer:mt-auto group-[.demo-filter]/drawer:flex-row-reverse"
			>
				<button
					class="primary inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-[0.7rem] py-[0.4rem] [font-weight:650] text-white group-[.demo-filter]/drawer:flex-1 group-[.demo-filter]/drawer:border-[var(--accent)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
					type="submit"
				>
					{t.apply}
				</button>
				<button
					class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] group-[.demo-filter]/drawer:flex-1 group-[.demo-filter]/drawer:border-[var(--accent)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
					type="button"
					onclick={clearFilters}
				>
					{t.clear}
				</button>
			</div>
		{/snippet}

		{#if eventDemo}
			<dialog
				class="demo-filter group/drawer m-[0_0_0_auto] box-border h-dvh max-h-none w-[min(88%,24rem)] max-w-none border-0 bg-[var(--surface)] p-0 text-[var(--ink)] backdrop:bg-black/48 open:flex open:flex-col"
				bind:this={filterDialog}
				aria-labelledby="demo-filter-title"
			>
				<div
					class="drawer-heading flex items-center justify-between gap-2 bg-[var(--paper)] px-3 py-2"
				>
					<h2 class="m-0 text-[1rem]" id="demo-filter-title">{t.filters}</h2>
					<button
						class="inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border-0 bg-transparent px-[0.7rem] py-[0.4rem] text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
				<form
					class="filters flex flex-1 flex-col items-stretch gap-x-[1.1rem] gap-y-[0.85rem] rounded-[var(--radius)] border-0 bg-[var(--surface)] p-[0.85rem]"
					onsubmit={applyFilters}
				>
					{@render filterFields()}
				</form>
			</dialog>
		{:else}
			<form
				id="search-filters"
				class={[
					'filters mb-4 flex flex-wrap items-end gap-x-[1.1rem] gap-y-[0.85rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] p-[0.85rem] [&[hidden]]:hidden'
				]}
				hidden={!filtersOpen}
				onsubmit={applyFilters}
			>
				{@render filterFields()}
			</form>
		{/if}

		{#if hasFilters}
			<div
				class="chips mb-4 flex flex-wrap items-center gap-[0.65rem] group-[.event-demo]/harness:m-1.5"
			>
				{#if selectedCapacityProduct}
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[999px] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[length:var(--small)] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="button"
						onclick={() => (capacity = undefined)}
					>
						{language === 'th' ? 'ความจุ' : 'Capacity'}
						<FactValue
							productId={selectedCapacityProduct.id}
							field="spec.capacity"
							locale={language}
						/>
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
				{#if maxPrice !== undefined}
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[999px] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[length:var(--small)] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[999px] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[length:var(--small)] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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

		{#if assistantOpen || !eventDemo}
			<section
				id="assistant"
				class="shopper-tools my-4 border-y border-[var(--seam)] py-[0.7rem]"
				aria-label={a.persona}
			>
				<ShoppingAssistant locale={language} onSend={send} pending={livePending} />
				<div class="shopper-actions my-[0.55rem] flex flex-wrap items-center gap-[0.4rem]">
					{#each personas as persona (persona)}
						<button
							class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
							type="button"
							onclick={() => selectPersona(persona)}
						>
							{a[persona]}
						</button>
					{/each}
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="button"
						aria-expanded={compareOpen}
						onclick={() => {
							compareOpen = !compareOpen;
							if (compareOpen) compareSignal();
						}}
					>
						{compareOpen ? a.closeCompare : a.compare}
					</button>
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="button"
						disabled={!undoStack.length}
						onclick={undo}
					>
						{a.undo}
					</button>
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="button"
						onclick={() => restoreDefaults()}
					>
						{a.reset}
					</button>
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="button"
						disabled={!interactive}
						aria-expanded={traceOpen}
						onclick={() => (traceOpen = !traceOpen)}
					>
						{a.trace}
					</button>
				</div>
				{#if livePending}
					<p
						class="assistant-reply my-[0.55rem] border border-dashed border-[var(--seam)] px-3 py-[0.6rem] wrap-anywhere"
						role="status"
					>
						{language === 'th' ? 'กำลังทดสอบโมเดล' : 'Testing the live model'}
					</p>
				{/if}
				{#if turn}
					<div
						class="assistant-reply my-[0.55rem] border border-dashed border-[var(--seam)] px-3 py-[0.6rem] wrap-anywhere"
						aria-live="polite"
					>
						<span class="mode-label text-[var(--muted)]">
							{liveModel ? (language === 'th' ? 'โมเดลสด' : 'Live model') : a.offline}
						</span>
						<p class="mx-0 my-1">{turn.reply}</p>
						{#if turn.citations.length}
							<strong>{a.fromListing}</strong>
							<ul>
								{#each turn.citations as citation (`${citation.productId}:${citation.field}`)}
									<li>
										<a
											class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
				<ChangeSlip lines={harness.changes} lang={language} />
				{#each harness.state.suggestions as suggestion (suggestion.id)}
					<div
						class="assistant-reply my-[0.55rem] border border-dashed border-[var(--seam)] px-3 py-[0.6rem] wrap-anywhere"
					>
						<p class="mx-0 my-1">
							{language === 'th'
								? 'อยากใช้มุมมองตามการเลือกดูของคุณไหม?'
								: 'Would this view suit your browsing?'}
						</p>
						{#each harness.preview(suggestion.patch) as line (line.part)}<p class="mx-0 my-1">
								{line.text}
							</p>{/each}
						<button
							class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
							onclick={() => {
								acceptSuggestion(suggestion.id);
							}}
						>
							{language === 'th' ? 'ใช้คำแนะนำ' : 'Apply suggestion'}
						</button>
						<button
							class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
							onclick={() => harness.dismiss(suggestion.id)}
						>
							{language === 'th' ? 'ไม่ใช้' : 'Dismiss'}
						</button>
					</div>
				{/each}
				{#if adapted || locks.length}
					<div
						class="shopper-actions my-[0.55rem] flex flex-wrap items-center gap-[0.4rem]"
						aria-label={a.appearance}
					>
						{#each ['theme', 'layout', 'locale', 'category', 'maxPrice', 'query', 'specPreferences'] as value (value)}
							{@const key = value as keyof ShopperPlan}
							{#if JSON.stringify(activePlan[key]) !== JSON.stringify(defaultPlan[key])}
								<button
									class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
					<div
						class="assistant-reply my-[0.55rem] border border-dashed border-[var(--seam)] px-3 py-[0.6rem] wrap-anywhere"
						aria-label={a.trace}
					>
						<p class="mx-0 my-1">
							{liveModel
								? (language === 'th' ? 'โมเดลสด' : 'Live model') + ` · ${liveModel}`
								: a.offline}
						</p>
						{#if liveFallback}<p class="mx-0 my-1">
								{language === 'th'
									? 'ใช้การตอบแบบออฟไลน์แทน'
									: 'Live model unavailable. Used offline mode.'}
							</p>{/if}
						{#if dev}
							<button
								class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
								type="button"
								onclick={toggleLive}
								aria-pressed={liveEnabled}
							>
								{liveEnabled
									? language === 'th'
										? 'บังคับโหมดออฟไลน์'
										: 'Force offline'
									: language === 'th'
										? 'ลองใช้โมเดลสด'
										: 'Try live model'}
							</button>
						{/if}
						{#if turn?.guarded}<p class="mx-0 my-1">{a.guard}</p>{/if}
						{#if turn?.dropped.length}<p class="mx-0 my-1">{a.rejected}</p>
							<ul>
								{#each turn.dropped as drop (drop)}<li>{drop}</li>{/each}
							</ul>{/if}
						{#if harness.last}<p class="mx-0 my-1">
								{language === 'th' ? 'สาเหตุออฟไลน์' : 'Fallback reason'}: {harness.last.trace
									.fallbackReason ?? '—'}
							</p>
							<p class="mx-0 my-1">
								{language === 'th' ? 'ตัวตรวจคำตอบ' : 'Fact guard'}: {harness.last.trace.guard}
							</p>{/if}
						<Accuracy />
						{#if !changes.length}<p class="mx-0 my-1">{a.noChange}</p>{/if}
						{#if dev}<button
								class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
				<CompareShelves plan={activePlan} locale={language} {eligibleProducts} onDeal={openDeal} />
			{/if}
			{#if quote}
				<section class="quote my-4 border-y border-[var(--seam)] py-[0.7rem]" lang={quote.locale}>
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
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
		{/if}
		{#if cookerSearch && products.length > 0}
			<SearchShopPreview {products} {language} {theme} />
		{/if}
		{#snippet productShelf()}
			<section id="products" aria-labelledby="products-heading" tabindex="-1">
				<div
					class="results-header mb-3 flex items-baseline justify-between gap-4 border-b-2 border-[var(--ink)] pb-[0.4rem] group-[.event-demo]/harness:mb-0 group-[.event-demo]/harness:border-0 group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:py-[0.3rem]"
				>
					<h2
						class="m-0 text-[1.375rem] group-[.event-demo]/harness:text-[length:var(--small)] group-[.event-demo]/harness:text-[var(--muted)]"
						id="products-heading"
					>
						{cookerSearch && sort !== 'default' ? t[sort] : t.products}
					</h2>
					{#if eventDemo}
						<button
							class="assistant-link ms-auto inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border-0 bg-transparent px-[0.7rem] py-[0.4rem] text-[length:var(--small)] text-[var(--ink)] underline hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
							onclick={() => (assistantOpen = !assistantOpen)}
							disabled={!interactive}
							aria-expanded={assistantOpen}
						>
							{language === 'th' ? 'ผู้ช่วยช้อปปิ้ง' : 'Shopping assistant'}
						</button>
						{#if !cookerSearch && !skinSearch}
							<a
								class="assistant-link ms-auto inline-flex min-h-[var(--tap)] cursor-pointer items-center border-0 bg-transparent text-[length:var(--small)] text-[var(--ink)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
								href={resolve('/?view=receipt#assistant')}
							>
								{language === 'th' ? 'มุมมองใบเสร็จ' : 'Receipt view'}
							</a>
						{/if}
					{/if}
					<p class="m-0 text-[length:var(--small)] text-[var(--muted)]" aria-live="polite">
						<span class="visually-hidden absolute size-px overflow-hidden [clip-path:inset(50%)]">
							{t.products}
						</span>
						<span class="figure" data-fact="resultCount" data-raw={products.length}>
							{formatNumber(products.length)}
						</span>
					</p>
				</div>
				{#if !eventDemo || adapted}<FactsReceipt root={proofRoot} locale={language} />{/if}
				<div bind:this={proofRoot}>
					{#if products.length === 0}
						<div
							class="empty border border-dashed border-[var(--ink)] p-4 group-[.event-demo]/harness:m-2"
						>
							<h3 class="m-0 text-[length:var(--size)]/[1.4] font-[650]">{t.empty}</h3>
							<p class="mx-0 mt-1 mb-[0.8rem]">{t.emptyHint}</p>
							<button
								type="button"
								class="primary inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--accent)] bg-[var(--accent)] px-[0.7rem] py-[0.4rem] [font-weight:650] text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
								onclick={reset}
							>
								{t.reset}
							</button>
						</div>
					{:else if adapted && plan.layout === 'table'}
						<ShelfTable
							products={products.flatMap(
								(product) => canonical.find(({ id }) => id === product.catalogId) ?? []
							)}
							locale={language}
							onDeal={openDeal}
							highlightedSpecs={plan.highlightedSpecs}
						/>
						{#if sort === 'default' && ranked[0]?.bars.length}
							<details class="rank relative z-[1] justify-self-start">
								<summary class="cursor-pointer content-center [min-block-size:var(--tap)]">
									{a.rank}
								</summary>
								<ul>
									{#each ranked[0].bars as reason (reason.label.en)}<li>
											{reason.label[language]}
										</li>{/each}
								</ul>
							</details>
						{/if}
					{:else if adapted}
						<ul
							class={[
								'adaptive-grid grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4 p-0 [&.adaptive-list]:grid-cols-[1fr]'
							]}
							class:adaptive-list={plan.layout === 'list'}
						>
							{#each products as product (product.id)}
								{@const canonicalProduct = canonical.find((item) => item.id === product.catalogId)}
								{#if canonicalProduct}<li class="min-w-0">
										<AdaptiveCard
											product={canonicalProduct}
											plan={toHarness(activePlan)}
											photos={eventDemo}
											clock={opening !== undefined && referenceTime !== undefined
												? { openedAt: opening, now: referenceTime }
												: undefined}
											onDeal={openDeal}
											reasons={sort === 'default' && !plan.simplified && products.length > 1
												? (ranked.find((row) => row.product.id === product.catalogId)?.bars ?? [])
												: []}
										/>
									</li>{/if}
							{/each}
						</ul>
					{:else}
						<ul
							class={[
								'product-grid m-0 grid list-none grid-cols-3 gap-3 p-0 group-[.event-demo]/harness:grid-cols-4 group-[.event-demo]/harness:gap-2 group-[.event-demo]/harness:px-2 [&.list-layout]:grid-cols-1 [@media(520px<width<=760px)]:grid-cols-2 [@media(max-width:520px)]:grid-cols-1 group-[.event-demo]/harness:[@media(max-width:710px)]:grid-cols-2'
							]}
							class:list-layout={adapted && plan.layout === 'list'}
						>
							{#each products as product (product.id)}
								<li
									class="product relative grid min-w-0 grid-cols-1 grid-rows-[7.5rem_1fr] rounded-[var(--radius)] border border-[var(--seam)] bg-[var(--surface)] wrap-anywhere group-[.event-demo]/harness:grid-cols-1 group-[.event-demo]/harness:grid-rows-[auto_1fr] has-[.product-link:focus-visible]:outline-2 has-[.product-link:focus-visible]:outline-offset-2 has-[.product-link:focus-visible]:outline-[var(--accent)] [@media(max-width:520px)]:grid-cols-[minmax(5rem,25%)_minmax(0,1fr)] [@media(max-width:520px)]:grid-rows-[auto] [@media(max-width:520px)]:group-data-[theme=large]/harness:grid-cols-[minmax(4rem,20%)_minmax(0,1fr)]"
									data-product={product.catalogId}
								>
									{#if eventDemo}
										<div
											class="art demo-photo relative grid aspect-square place-items-center text-[var(--accent)]"
											data-category={product.category}
											data-model={product.id}
											data-cooker-photo={product.catalogId}
											aria-hidden={product.id === 'cooker-1' ? undefined : true}
										>
											{#if product.id === 'cooker-1'}<CookerPhotoCaption
													locale={language}
													compact
												/>{/if}
										</div>
									{:else}
										<div
											class="art grid place-items-center bg-[var(--tile,#e9e6dc)] text-[var(--accent)]"
										>
											<CategoryGlyph category={product.category} />
										</div>
									{/if}
									<div
										class={[
											'card-body flex min-w-0 flex-col p-[0.8rem] group-data-[density=compact]/harness:gap-[0.3rem] group-data-[density=compact]/harness:p-2 group-data-[density=spacious]/harness:gap-[0.65rem] group-data-[density=spacious]/harness:p-4 group-[.event-demo]/harness:gap-1 group-[.event-demo]/harness:px-2 group-[.event-demo]/harness:pt-[0.45rem] group-[.event-demo]/harness:pb-[0.6rem] [&_.shop]:mt-[0.2rem] [&_.shop]:text-[length:var(--small)] [&_.shop]:text-[var(--muted)] group-[.event-demo]/harness:[&_.shop]:order-3'
										]}
									>
										<h3
											class="m-0 mb-[0.45rem] text-[length:var(--size)]/[1.4] font-[650] group-[.event-demo]/harness:m-0 group-[.event-demo]/harness:min-h-[2.7em] group-[.event-demo]/harness:text-[length:max(0.9375rem,var(--small))]/[1.35] group-[.event-demo]/harness:font-normal"
										>
											<a
												class="product-link after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
												href={resolve(
													`/product/[id]?lang=${language}&theme=${theme}${originQuery}`,
													{
														id: product.id
													}
												)}
											>
												<FactValue productId={product.catalogId} field="name" locale={language} />
											</a>
										</h3>
										<div
											class={[
												'price mt-auto flex flex-wrap items-baseline gap-x-[0.6rem] gap-y-1 group-[.event-demo]/harness:m-0 group-[.event-demo]/harness:gap-x-[0.4rem] group-[.event-demo]/harness:gap-y-[0.15rem] [&_s]:text-[length:var(--small)] [&_s]:text-[var(--void)] group-[.event-demo]/harness:[&_s]:text-[var(--muted)] [&_strong]:text-[length:max(1.45rem,var(--size))] group-[.event-demo]/harness:[&_strong]:text-[length:max(1.1rem,var(--size))] group-[.event-demo]/harness:[&_strong]:text-[var(--ink)]'
											]}
										>
											<span
												class="visually-hidden absolute size-px overflow-hidden [clip-path:inset(50%)]"
											>
												{t.price}
											</span>
											<FactValue
												tag="strong"
												class="figure"
												productId={product.catalogId}
												field="price"
												locale={language}
											/>
											{#if product.originalPrice !== null}
												<span
													class="visually-hidden absolute size-px overflow-hidden [clip-path:inset(50%)]"
												>
													{t.was}
												</span>
												<FactValue
													tag="s"
													class="figure"
													productId={product.catalogId}
													field="originalPrice"
													locale={language}
												/>
											{/if}
										</div>
										<div
											class={[
												'shipping mt-1 mb-[0.45rem] flex items-baseline gap-[0.4rem] border-y border-dashed border-[var(--seam)] py-[0.32rem] text-[length:var(--small)] text-[var(--muted)] group-[.event-demo]/harness:order-2 group-[.event-demo]/harness:m-0 group-[.event-demo]/harness:items-center group-[.event-demo]/harness:[justify-content:start] group-[.event-demo]/harness:gap-[0.35rem] group-[.event-demo]/harness:border-0 group-[.event-demo]/harness:py-0 [&_.shipping-shop]:min-w-0 [&_.shipping-shop]:flex-1 [&_.shipping-shop]:truncate [&_.shipping-shop]:border-s [&_.shipping-shop]:border-[var(--seam)] [&_.shipping-shop]:ps-[0.35rem]'
											]}
										>
											<span
												class={[
													'[&.visually-hidden]:absolute [&.visually-hidden]:size-px [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)]'
												]}
												class:visually-hidden={eventDemo}
											>
												{t.shipping}
											</span>
											<span
												class="leader flex-1 border-b border-dotted border-[var(--muted)] group-[.event-demo]/harness:hidden"
												aria-hidden="true"
											></span>
											<FactValue
												class="figure"
												productId={product.catalogId}
												field="shipping"
												locale={language}
											/>
											{#if eventDemo}<FactValue
													class="shipping-shop"
													productId={product.catalogId}
													field="shop"
													locale={language}
												/>{/if}
										</div>
										<div
											class="metadata flex flex-wrap justify-between gap-x-[0.45rem] gap-y-[0.2rem] text-[length:var(--small)] text-[var(--muted)] group-[.event-demo]/harness:order-1 group-[.event-demo]/harness:items-center group-[.event-demo]/harness:[justify-content:start]"
										>
											<span
												class="inline-flex items-center gap-1 group-[.event-demo]/harness:border group-[.event-demo]/harness:border-[var(--seam)] group-[.event-demo]/harness:px-[0.2rem]"
											>
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
												<span
													class="visually-hidden absolute size-px overflow-hidden [clip-path:inset(50%)]"
												>
													{t.rating}
												</span>
												<FactValue
													class="figure"
													productId={product.catalogId}
													field="rating"
													locale={language}
												/>
											</span>
											<span class="inline-flex items-center gap-1">
												{t.sold}
												<FactValue
													class="figure"
													productId={product.catalogId}
													field="sold"
													locale={language}
												/>
											</span>
										</div>
										{#if !eventDemo}<FactValue
												tag="p"
												class="shop"
												productId={product.catalogId}
												field="shop"
												locale={language}
											/>{/if}
										{#if true}
											{@const reasons =
												ranked.find(({ product: item }) => item.id === product.catalogId)?.bars ??
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
												class="best-price relative z-[1] box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] justify-self-start rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
												type="button"
												onclick={() => openDeal(product.catalogId)}
											>
												{a.deal}
											</button>
											{#if adapted && sort === 'default' && !plan.simplified && reasons.length && products.length > 1}
												<details class="rank relative z-[1] justify-self-start">
													<summary
														class="cursor-pointer content-center [min-block-size:var(--tap)]"
													>
														{a.rank}
													</summary>
													<ul>
														{#each reasons as reason (reason.label.en)}
															<li>
																{reason.label[language]}<span
																	class="rank-bar my-[6px] block h-[6px] bg-current"
																	class:w-[25%]={reason.width === 1}
																	class:w-[50%]={reason.width === 2}
																	class:w-[75%]={reason.width === 3}
																	class:w-full={reason.width === 4}
																></span>
															</li>
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
		{/snippet}
		{#each adapted ? pageSections(toHarness(activePlan)) : ['products'] as section (section)}
			{#if section === 'products'}
				{@render productShelf()}
			{:else if section === 'best-deal' && topDeal && !quote}
				<DealSlip receipt={topDeal} locale={language} />
			{:else if section === 'share'}
				<div
					class="shopper-actions my-[0.55rem] flex flex-wrap items-center gap-[0.4rem]"
					data-section={section}
				>
					<button
						class="box-border inline-flex min-h-[var(--tap)] min-w-0 cursor-pointer items-center justify-center gap-[0.35rem] rounded-[var(--radius)] border border-[var(--ink)] bg-[var(--surface)] px-[0.7rem] py-[0.4rem] text-[var(--ink)] hover:bg-[var(--paper)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
						type="button"
						onclick={shareLook}
					>
						{a.share}
					</button>
					{#if shareCopied}<span role="status">{a.shared}</span>{/if}
				</div>
			{:else if products.length && ['compare', 'top-picks', 'reviews', 'what-matters'].includes(section)}
				<section
					class="assistant-reply my-[0.55rem] border border-dashed border-[var(--seam)] px-3 py-[0.6rem] wrap-anywhere"
					data-section={section}
				>
					{#if section === 'top-picks'}
						<h2 class="m-0 text-[1.375rem]">
							{language === 'th' ? 'สินค้าที่เหมาะกับคุณ' : 'Top picks'}
						</h2>
						<ul
							class={[
								'adaptive-grid grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,17rem),1fr))] gap-4 p-0 [&.adaptive-list]:grid-cols-[1fr]'
							]}
							class:adaptive-list={plan.layout === 'list'}
						>
							{#each products.slice(0, 3) as product (product.id)}
								{@const canonicalProduct = canonical.find((item) => item.id === product.catalogId)}
								{#if canonicalProduct}<li class="min-w-0">
										<AdaptiveCard
											product={canonicalProduct}
											plan={toHarness(activePlan)}
											photos={eventDemo}
											clock={opening !== undefined && referenceTime !== undefined
												? { openedAt: opening, now: referenceTime }
												: undefined}
											onDeal={openDeal}
											reasons={sort === 'default' && !plan.simplified && products.length > 1
												? (ranked.find((row) => row.product.id === product.catalogId)?.bars ?? [])
												: []}
										/>
									</li>{/if}
							{/each}
						</ul>
					{:else if section === 'compare'}
						<h2 class="m-0 text-[1.375rem]">{language === 'th' ? 'เปรียบเทียบ' : 'Compare'}</h2>
						<ShelfTable
							products={products
								.slice(0, 3)
								.flatMap((p) => canonical.find((c) => c.id === p.catalogId) ?? [])}
							locale={language}
							onDeal={openDeal}
							highlightedSpecs={plan.highlightedSpecs}
						/>
					{:else if section === 'reviews'}
						<h2 class="m-0 text-[1.375rem]">
							{language === 'th' ? 'รีวิวจากผู้ซื้อ' : 'Shopper reviews'}
						</h2>
						{#each products.slice(0, 3) as product (product.id)}
							<FactValue tag="h3" productId={product.catalogId} field="name" locale={language} />
							<FactValue tag="p" productId={product.catalogId} field="review.0" locale={language} />
						{/each}
					{:else if section === 'what-matters'}
						<h2 class="m-0 text-[1.375rem]">{a.guide}</h2>
						<p class="mx-0 my-1">
							{[
								...new Set(
									[
										...Object.keys(activePlan.specPreferences),
										...Object.keys(activePlan.priorities)
									].map((key) => termName(key, products[0]?.catalogId))
								)
							].join(' · ')}
						</p>
					{/if}
				</section>
			{/if}
		{/each}
		<footer
			class="py-5 text-[length:var(--small)] text-[var(--muted)] group-[.event-demo]/harness:px-2"
		>
			{eventDemo
				? language === 'th'
					? 'DynamicShopper · ภาพประกอบสินค้าจำลอง'
					: 'DynamicShopper · Illustrative product images'
				: t.simulated}
		</footer>
	</main>
</div>
