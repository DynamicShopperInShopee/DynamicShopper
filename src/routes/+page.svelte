<script lang="ts">
	import '../lib/assets/products/cooker-photos.css';
	import { resolve } from '$app/paths';
	import { afterNavigate, beforeNavigate, goto, snapshot } from '$app/navigation';
	import { getStoreSession, type ShelfState } from '#lib/storefront/store.svelte.ts';
	import { carrySearchToListing, readSearchSelection, searchLimit } from './search-navigation';
	import type { ShelfChange } from '../lib/storefront/store.svelte';
	import { readInterviewVisit, saveInterviewVisit } from './interview-navigation';
	import InterviewEntry from '../lib/storefront/InterviewEntry.svelte';
	import { reconcilePlanPatch } from '../lib/personalization/locked-plan';
	import { interviewProposal, type Answers } from '../lib/personalization/interview';
	import { page } from '$app/state';
	import { dev } from '$app/env';
	import { onMount, tick, untrack } from 'svelte';
	import { describePlanChanges } from '#lib/storefront/describePlanChanges.ts';
	import ShareLook from '#lib/storefront/ShareLook.svelte';
	import { parseSharedLook } from '#lib/storefront/browserState.ts';
	import { isValidLook, lookFields, validateLook } from '#lib/storefront/sharedLook.ts';
	import '../lib/assets/fonts/plex.css';
	import CookerSearchSort from './CookerSearchSort.svelte';
	import SearchQuickFilters from './SearchQuickFilters.svelte';
	import CookerPhotoCaption from '../lib/storefront/CookerPhotoCaption.svelte';
	import SearchShopPreview from './SearchShopPreview.svelte';
	import '../lib/assets/products/shelf-photos.css';
	import { categories, catalog, type Category, type Language } from '../lib/store-catalog';
	import { formatNumber, searchProducts, type Sort } from '../lib/store-search';
	import {
		formatBaht,
		getProduct,
		products as canonical,
		specs,
		type Locale
	} from '../lib/catalog/index.ts';
	import { quoteBasket } from '#lib/storefront/quoteBasket.ts';
	import { optimizeDeal, type DealReceipt } from '../lib/pricing/index.ts';
	import {
		defaultPlan,
		interpretOffline,
		personaPlan,
		rankProducts,
		validateProposal,
		type ShopperPlan,
		type Turn
	} from '../lib/personalization';
	import CartControls from '../lib/storefront/CartControls.svelte';
	import AddToCart from '../lib/storefront/AddToCart.svelte';
	import type { CartItem } from '../lib/storefront/cart';
	import FactValue from '../lib/storefront/FactValue.svelte';
	import FactsReceipt from '../lib/storefront/FactsReceipt.svelte';
	import DealSlip from '../lib/storefront/DealSlip.svelte';
	import { eligibleShelfProducts } from '../lib/storefront/compare';
	import CompareShelves from '../lib/storefront/CompareShelves.svelte';
	import CriteriaOverview from '../lib/storefront/CriteriaOverview.svelte';
	import ShoppingTasks from '../lib/storefront/ShoppingTasks.svelte';
	import AdaptiveProductCard from '../lib/storefront/AdaptiveProductCard.svelte';
	import Sections from '#lib/storefront/Sections.svelte';
	import ShelfTable from '../lib/storefront/ShelfTable.svelte';
	import ShoppingAssistant from '../lib/storefront/ShoppingAssistant.svelte';
	import { fillPresentationGaps, requestLivePreview } from '../lib/storefront/live-preview';
	import { projectLiveHints } from '../lib/personalization/live';
	import { assistantCopy, rankingTerms, storefrontCopy } from '../lib/storefront/copy';
	import Xray from '../lib/storefront/Xray.svelte';
	import XrayDrawer from '../lib/storefront/XrayDrawer.svelte';

	type Theme = 'standard' | 'minimal' | 'vibrant' | 'large';
	const themes = ['standard', 'minimal', 'vibrant', 'large'] as const;
	const sorts = ['default', 'price-low', 'price-high', 'top-rated', 'top-sales'] as const;
	const cookerSorts = ['default', 'top-sales', 'price-low', 'price-high', 'top-rated'] as const;
	const categoryKeys = Object.keys(categories) as Category[];

	let interactive = $state(false);
	onMount(() => {
		interactive = true;
		return () => {
			interactive = false;
		};
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
	let capacity = $state<number>();
	let filtersOpen = $state(false);
	let filterDialog = $state<HTMLDialogElement>();
	let adapted = $state(false);
	const sharedLook = $derived(page.url.searchParams.get('look') ?? '');
	const validLook = $derived(isValidLook(sharedLook));
	const eventDemo = $derived(
		!adapted && page.url.searchParams.get('view') !== 'receipt' && !validLook
	);
	const originQuery = $derived(
		eventDemo ? '' : validLook ? '&view=receipt&look=' + sharedLook : '&view=receipt'
	);
	let proofRoot = $state<HTMLElement>();
	let plan = $state<ShopperPlan>(structuredClone(defaultPlan));
	const session = getStoreSession();
	let undoStack = $state<ShelfState[]>([]);
	let interviewAnswers = $state<Answers | null>(null);
	let interviewDirectOnly = $state(false);
	let assistant = $state<{ focus: () => void }>();
	let locks = $state<(keyof ShopperPlan)[]>([]);
	let compareOpen = $state(false);
	let personasOpen = $state(false);
	let personaTrigger = $state<HTMLButtonElement>();
	let traceOpen = $state(false);
	let traceTrigger = $state<HTMLButtonElement>();
	let traceMerge = $state<'applied' | 'unchanged'>();
	let poisonArmed = $state(false);
	let forceOffline = $state(false);
	let liveEnabled = $state(false);
	let pendingPhase = $state<'cart' | 'model'>();
	let requestGeneration = 0;
	let liveFallback = $state(false);
	let liveModel = $state<string>();
	let usedLocalSettings = $state(false);
	let liveRequest: AbortController | undefined;
	let pendingLocalTurn: Turn | undefined;

	function cancelPending() {
		requestGeneration += 1;
		liveRequest?.abort();
		liveRequest = undefined;
		pendingLocalTurn = undefined;
		pendingPhase = undefined;
	}
	function toggleLive() {
		liveEnabled = !liveEnabled;
		if (!liveEnabled) finishPendingOffline();
	}
	function setForceOffline(enabled: boolean) {
		forceOffline = enabled;
		if (forceOffline) finishPendingOffline();
	}
	function finishPendingOffline() {
		const fallback = pendingLocalTurn;
		if (fallback) {
			cancelPending();
			applyTurn(fallback);
		}
	}
	function closeTrace() {
		traceOpen = false;
	}
	function toggleTrace() {
		traceOpen = !traceOpen;
	}
	function handleTraceKey(event: KeyboardEvent) {
		const modal = document.querySelector('dialog[open], :popover-open');
		if (eventDemo || event.defaultPrevented || (modal && modal.id !== 'store-xray')) return;
		if (event.key === 'Escape' && traceOpen) {
			event.preventDefault();
			closeTrace();
			return;
		}
		if (
			event.key.toLowerCase() !== 'x' ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			event.isComposing ||
			event.repeat
		)
			return;
		const target = event.target;
		if (
			target instanceof HTMLElement &&
			(target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]'))
		)
			return;
		event.preventDefault();
		toggleTrace();
	}
	let turn = $state<Turn>();
	const trace = $derived(
		turn
			? {
					backend: liveModel ? { kind: 'model', model: liveModel } : { kind: 'offline' },
					guard: turn.guarded ? 'replaced' : 'passed',
					merge: traceMerge
				}
			: undefined
	);
	let changes = $state<ShelfChange[]>([]);
	let focusedProduct = $state<string>();
	let quoteInput = $state<{ basket: readonly CartItem[]; locale: Locale }>();
	const quote = $derived(
		quoteInput
			? quoteBasket(quoteInput.basket, quoteInput.locale, session.clock.context)
			: undefined
	);
	let closeQuoteButton = $state<HTMLButtonElement>();
	let quoteTrigger: HTMLElement | undefined;

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
	const compareParams = $derived(
		new URLSearchParams({
			q: activePlan.query,
			category: activePlan.category ?? '',
			lang: language
		}).toString()
	);
	const eligibleProducts = $derived(eligibleShelfProducts(freeShipping, capacity));
	const ranked = $derived(adapted ? rankProducts(eligibleProducts, activePlan) : []);
	const catalogById = new Map(catalog.map((product) => [product.catalogId, product]));

	function quantityInCart(productId: string) {
		return session.cart.find((item) => item.productId === productId)?.quantity ?? 1;
	}
	const a = $derived(assistantCopy[language]);
	const personas = ['standard', 'tech', 'visual', 'mom'] as const;

	let restoredFields = $state<(keyof ShopperPlan)[]>([]);
	let cartRestored = $state(false);
	let sharedLookOpened = $state(false);
	let storeReady = $state(false);

	function shelfState(): ShelfState {
		return {
			plan: $state.snapshot(activePlan),
			adapted,
			sort,
			freeShipping,
			capacity,
			locks: [...locks],
			interviewAnswers: $state.snapshot(interviewAnswers),
			interviewDirectOnly
		};
	}
	function remember() {
		undoStack = [...undoStack.slice(-19), shelfState()];
	}
	beforeNavigate(({ from, to, willUnload }) => {
		if (from?.url.pathname !== to?.url.pathname || from?.url.search !== to?.url.search)
			cancelPending();
		if (willUnload || !to || to.route.id === from?.route.id) return;
		session.visit = {
			...shelfState(),
			search: page.url.search,
			undoStack: $state.snapshot(undoStack),
			turn: $state.snapshot(turn),
			liveModel,
			liveFallback,
			changes: [...changes],
			focusedProduct,
			draftQuery
		};
	});
	function register(key: keyof ShopperPlan) {
		cancelPending();
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
	function changePlan(
		patch: Partial<ShopperPlan>,
		respectLocks: boolean,
		requestedCategory?: ShopperPlan['category']
	) {
		cancelPending();
		const previous = $state.snapshot(activePlan);
		const accepted = reconcilePlanPatch(
			previous,
			patch,
			respectLocks ? locks : [],
			requestedCategory
		);
		const entries = Object.entries(accepted).filter(
			([key, value]) => JSON.stringify(previous[key as keyof ShopperPlan]) !== JSON.stringify(value)
		);
		changes = entries.map(([key]) => key as keyof ShopperPlan);
		if (!changes.length) return;
		remember();
		writePlan({ ...previous, ...Object.fromEntries(entries) });
		if (capacity !== undefined && accepted.category && accepted.category !== 'rice-cooker') {
			capacity = undefined;
			changes = [...changes, 'capacityRemoved'];
		}
		if (changes.includes('category') && changes.includes('query') && !query) {
			locks = locks.filter((field) => field !== 'query');
		}
		adapted = true;
	}
	function undo() {
		cancelPending();
		const previous = undoStack.at(-1);
		if (!previous) return;
		undoStack = undoStack.slice(0, -1);
		restoreCheckpoint(previous);
		changes = [];
	}
	function restoreCheckpoint(previous: ShelfState) {
		writePlan(previous.plan);
		adapted = previous.adapted;
		sort = previous.sort;
		freeShipping = draftShipping = previous.freeShipping;
		capacity = previous.capacity;
		locks = previous.locks;
		interviewAnswers = previous.interviewAnswers;
		interviewDirectOnly = previous.interviewDirectOnly;
	}
	function restoreDefaults(keepReply = false) {
		session.conversation.clear();
		usedLocalSettings = false;
		quoteInput = undefined;
		if (!keepReply) {
			turn = undefined;
			liveModel = undefined;
			liveFallback = false;
		}
		cancelPending();
		const hasPlanChanges = (Object.keys(defaultPlan) as (keyof ShopperPlan)[]).some(
			(key) => JSON.stringify(activePlan[key]) !== JSON.stringify(defaultPlan[key])
		);
		if (hasPlanChanges || adapted || sort !== 'default' || freeShipping || capacity !== undefined)
			remember();
		writePlan(structuredClone(defaultPlan));
		locks = [];
		interviewAnswers = null;
		interviewDirectOnly = false;
		adapted = false;
		sort = 'default';
		freeShipping = draftShipping = false;
		capacity = undefined;
		changes = [];
	}
	async function applyInterviewAnswers(answers: Answers, directOnly: boolean) {
		const result = interviewProposal(answers, activePlan, {
			directOnly,
			lockedFields: locks
		});
		const previous = $state.snapshot(activePlan);
		const fields = Object.entries(result.patch).filter(
			([key, value]) => JSON.stringify(previous[key as keyof ShopperPlan]) !== JSON.stringify(value)
		);
		// No-op answers leave the current surface and Undo history unchanged.
		if (!fields.length) {
			if (interviewAnswers !== null || Object.keys(result.answers).length) {
				interviewAnswers = result.answers;
			}
			interviewDirectOnly = directOnly;
			return;
		}
		cancelPending();
		session.restoreBrowser();
		storeReady = true;
		remember();
		for (const field of Object.keys(result.patch) as (keyof ShopperPlan)[]) {
			if (result.sources[field] === 'answer') register(field);
		}
		writePlan({ ...previous, ...result.patch });
		changes = fields.map(([key]) => key as keyof ShopperPlan);
		interviewAnswers = result.answers;
		interviewDirectOnly = directOnly;
		adapted = true;
		turn = undefined;
		await tick();
		const shelf = document.getElementById('products');
		shelf?.scrollIntoView({ block: 'start', behavior: 'instant' });
		shelf?.focus({ preventScroll: true });
	}
	async function focusAssistant() {
		await tick();
		assistant?.focus();
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
	function closePersonasOnEscape(event: KeyboardEvent) {
		if (event.key !== 'Escape' || !personasOpen) return;
		personasOpen = false;
		personaTrigger?.focus();
	}
	function listingHref(id: string) {
		return resolve(`/product/[id]?lang=${language}&theme=${theme}${originQuery}`, { id });
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
	function cardSpecs(productId: string) {
		const product = canonical.find(({ id }) => id === productId);
		if (!product) return [];
		const definitions = specs[product.category].filter(
			({ key }) => product.specs[key] !== undefined
		);
		return [
			...activePlan.highlightedSpecs.flatMap((key) =>
				definitions.filter((spec) => spec.key === key)
			),
			...definitions.filter(({ key }) => !activePlan.highlightedSpecs.includes(key))
		];
	}
	const priorityLabels = $derived([
		...Object.entries(activePlan.priorities).flatMap(([key, weight]) =>
			weight && rankingTerms[key] ? [{ en: rankingTerms[key][0], th: rankingTerms[key][1] }] : []
		),
		...Object.entries(activePlan.specPreferences).flatMap(([key, direction]) => {
			const definition = Object.values(specs)
				.flat()
				.find((spec) => spec.key === key);
			return definition && direction
				? [
						{
							en: `${direction === 'higher' ? 'Higher' : 'Lower'} ${definition.label.en}`,
							th: `${definition.label.th}${direction === 'higher' ? 'สูงขึ้น' : 'ลดลง'}`
						}
					]
				: [];
		})
	]);
	function changeName(key: ShelfChange) {
		return key in a ? a[key as keyof typeof a] : a.appearance;
	}
	function openDeal(productId: string, locale: Locale = language) {
		void openBasket([productId], locale);
	}
	function basketForProducts(productIds: readonly string[]): CartItem[] {
		return productIds.map((productId) => ({
			productId,
			quantity: quantityInCart(productId)
		}));
	}
	async function openBasket(productIds?: readonly string[], locale: Locale = language) {
		cancelPending();
		const generation = requestGeneration;
		await session.cartSettled();
		if (!interactive || eventDemo || generation !== requestGeneration) return;
		const basket = productIds ? basketForProducts(productIds) : session.cart;
		if (basket.length && showBasketDeal(basket, locale) && productIds)
			focusedProduct = productIds[0];
	}
	const calculateQuote = (basket: readonly CartItem[], locale: Locale) =>
		quoteBasket(basket, locale, session.clock.context);
	function showBasketDeal(basket: readonly CartItem[], locale: Locale = language) {
		if (!interactive || eventDemo) return false;
		cancelPending();
		const previous = quoteInput;
		quoteInput = { basket: basket.map((item) => ({ ...item })), locale };
		if (!quote) {
			quoteInput = previous;
			return false;
		}
		quoteTrigger =
			document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
		void tick().then(() => closeQuoteButton?.focus());
		return true;
	}
	function closeDeal() {
		cancelPending();
		quoteInput = undefined;
		quoteTrigger?.focus();
	}
	function applyTurn(next: Turn, requestedCategory?: ShopperPlan['category']) {
		const previous = $state.snapshot(activePlan);
		turn = next;
		const replyLocale = /\p{Script=Thai}/u.test(next.reply) ? 'th' : 'en';
		let deal: ReturnType<typeof calculateQuote>;
		changes = [];
		switch (next.intent) {
			case 'change':
				changePlan(next.patch, true, requestedCategory);
				break;
			case 'undo':
				undo();
				break;
			case 'reset':
				restoreDefaults(true);
				break;
			case 'deal':
				if (next.productIds.length) {
					deal = calculateQuote(basketForProducts(next.productIds), replyLocale);
					if (deal) focusedProduct = next.productIds[0];
				}
				break;
		}
		const turnChanges = describePlanChanges(previous, activePlan, replyLocale);
		if (changes.includes('capacityRemoved'))
			turnChanges.push(assistantCopy[replyLocale].capacityRemoved);
		traceMerge = turnChanges.length ? 'applied' : 'unchanged';
		session.conversation.reply(next, {
			locale: replyLocale,
			offline: !liveModel,
			usedLocalSettings,
			changes: turnChanges,
			deal
		});
	}

	async function send(message: string): Promise<void | 'superseded'> {
		if (pendingPhase || !message.trim()) return 'superseded';
		cancelPending();
		const generation = requestGeneration;
		pendingPhase = 'cart';
		await session.cartSettled();
		if (!interactive || eventDemo || generation !== requestGeneration) return 'superseded';
		pendingPhase = undefined;
		session.conversation.shopper(message, /\p{Script=Thai}/u.test(message) ? 'th' : language);
		liveModel = undefined;
		usedLocalSettings = false;
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
			forceOffline ||
			!liveEnabled ||
			(local.intent !== 'chat' && local.intent !== 'change')
		) {
			applyTurn(local, local.patch.category);
			return;
		}
		const hints = projectLiveHints(message);
		if (!hints.length) {
			applyTurn(local, local.patch.category);
			return;
		}
		const request = new AbortController();
		liveRequest = request;
		pendingLocalTurn = local;
		pendingPhase = 'model';
		turn = undefined;
		changes = [];
		void requestLivePreview(resolve('/api/local-assistant'), hints, request.signal).then(
			(result) => {
				if (liveRequest !== request) return;
				liveRequest = undefined;
				pendingLocalTurn = undefined;
				pendingPhase = undefined;
				if (!result) {
					liveFallback = true;
					applyTurn(local, local.patch.category);
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
				if (Object.keys(result.patch).length) liveModel = result.model;
				if (!Object.keys(additions).length) {
					usedLocalSettings = Boolean(liveModel);
					applyTurn({ ...local, dropped }, local.patch.category);
					return;
				}
				applyTurn(
					{ ...proposed, patch: { ...local.patch, ...additions }, dropped },
					local.patch.category
				);
			}
		);
	}

	onMount(() => () => cancelPending());
	function restoreStore() {
		session.restoreBrowser();
		storeReady = true;
		const saved = session.visit;
		if (saved && saved.search === page.url.search) {
			writePlan(saved.plan);
			({
				adapted,
				sort,
				freeShipping,
				capacity,
				locks,
				undoStack,
				interviewAnswers,
				interviewDirectOnly,
				turn,
				liveModel,
				liveFallback,
				changes,
				focusedProduct,
				draftQuery
			} = saved);
			draftShipping = freeShipping;
			return;
		}
		const persisted = session.savedPlan;
		if (persisted) {
			restoredFields = (Object.keys(defaultPlan) as (keyof ShopperPlan)[]).filter(
				(key) => JSON.stringify(persisted[key]) !== JSON.stringify(defaultPlan[key])
			);
			if (restoredFields.length) {
				writePlan(persisted);
				adapted = restoredFields.some(
					(key) => !['query', 'category', 'maxPrice', 'locale', 'theme'].includes(key)
				);
			}
		}
		cartRestored = session.cart.length > 0;
		openSharedLook();
	}
	afterNavigate(({ from, to, type }) => {
		if (type !== 'popstate' && from?.route.id === '/product/[id]')
			restoreSearch(page.state.storeSearch);
		if (eventDemo) return;
		if (page.url.hash === '#xray') traceOpen = true;
		if (page.url.hash === '#criteria-overview')
			void tick().then(() => document.getElementById('criteria-overview')?.focus());
		if (['#assistant', '#shopper-assistant'].includes(page.url.hash)) void focusAssistant();
		const sameStore =
			from?.route.id === '/' && to?.route.id === '/' && from.url.search !== to.url.search;
		const hasCurrentControls =
			undoStack.length ||
			locks.length ||
			draftQuery !== query ||
			sort !== 'default' ||
			freeShipping ||
			capacity !== undefined;
		if (!storeReady && sameStore && hasCurrentControls) {
			session.restoreBrowser();
			cartRestored = session.cart.length > 0;
			storeReady = true;
		}
		if (!storeReady) restoreStore();
		else if (sameStore) openSharedLook();
		if (from?.route.id === '/product/[id]') {
			const pending = session.listing.takeTurn();
			if (pending) {
				liveModel = undefined;
				liveFallback = false;
				applyTurn(pending);
			}
		}
	});
	$effect(() => {
		if (!storeReady) return;
		const current = $state.snapshot(activePlan);
		untrack(() => session.savePlan(current));
	});
	function openSharedLook() {
		sharedLookOpened = false;
		const look = page.url.searchParams.get('look');
		if (!look) return;
		const patch = parseSharedLook(look, lookFields, validateLook);
		if (patch) {
			changePlan(patch, false);
			sharedLookOpened = changes.length > 0;
			return;
		}
		if (look.length > 40) return;
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
		sharedLookOpened = changes.length > 0;
	}

	const t = $derived(storefrontCopy[language]);
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
		if (interviewAnswers !== null) {
			return saveInterviewVisit({
				current: shelfState(),
				undo: $state.snapshot(undoStack),
				changes: [...changes],
				draftQuery,
				search: validLook
					? '?look=' + encodeURIComponent(sharedLook)
					: page.url.searchParams.get('view') === 'receipt'
						? '?view=receipt'
						: '',
				scrollY: Math.max(0, Math.round(window.scrollY))
			});
		}
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
		const visit = readInterviewVisit(input);
		const selection = readSearchSelection(input);
		if (visit) {
			session.restoreBrowser();
			storeReady = true;
			restoreCheckpoint(visit.current);
			undoStack = visit.undo;
			changes = visit.changes;
			draftQuery = visit.draftQuery;
		} else if (eventDemo && selection) {
			({ category, language, sort, query, draftQuery, maxPrice, freeShipping, capacity } =
				selection);
			draftPrice = maxPrice;
			draftShipping = freeShipping;
		} else return;
		const offset = visit?.scrollY ?? selection?.scrollY;
		if (offset !== undefined) {
			void tick().then(async () => {
				await document.fonts.ready;
				await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
				if (page.route.id !== '/') return;
				const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
				window.scrollTo({ top: Math.min(offset, maxScroll), behavior: 'instant' });
			});
		}
	}
	snapshot({ id: 'event-store-search', capture: captureSearch, restore: restoreSearch });
	carrySearchToListing(captureSearch);
	const selectedCapacityProduct = $derived(
		capacity === undefined ? undefined : eligibleShelfProducts(false, capacity)[0]
	);
	const hasFilters = $derived(maxPrice !== undefined || freeShipping || !!selectedCapacityProduct);
	const products = $derived.by(() => {
		const matched = searchProducts({ query, category, sort, maxPrice, freeShipping }).filter(
			(item) =>
				capacity === undefined ||
				(item.category === 'cooker' && getProduct(item.catalogId)?.specs.capacity === capacity)
		);
		if (!adapted || eventDemo) return matched;
		if (sort !== 'default') {
			const visible = new Set(
				rankProducts(eligibleProducts, { ...activePlan, simplified: false }).map(
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
		const context = session.clock.context;
		if (eventDemo || !adapted || !plan.sections.includes('best-deal') || !top || !context)
			return null;
		return optimizeDeal(
			[{ productId: top.catalogId, quantity: quantityInCart(top.catalogId) }],
			context
		);
	});
	const cardVouchers = $derived.by(() => {
		const context = session.clock.context;
		if (eventDemo || !activePlan.details.includes('vouchers') || !context)
			return new Map<string, DealReceipt['appliedVouchers']>();
		return new Map(
			products.map((product) => [
				product.catalogId,
				optimizeDeal(
					[{ productId: product.catalogId, quantity: quantityInCart(product.catalogId) }],
					context
				)?.appliedVouchers ?? []
			])
		);
	});

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		const nextQuery = draftQuery.trim();
		if (nextQuery !== query || capacity !== undefined) remember();
		register('query');
		query = nextQuery;
		capacity = undefined;
	}

	function applyFilters(event: SubmitEvent) {
		event.preventDefault();
		cancelPending();
		if (draftPrice !== maxPrice || draftShipping !== freeShipping) remember();
		if (draftPrice !== undefined) register('maxPrice');
		else locks = locks.filter((key) => key !== 'maxPrice');
		maxPrice = draftPrice;
		freeShipping = draftShipping;
		if (eventDemo) filterDialog?.close();
	}

	function clearFilters() {
		cancelPending();
		capacity = undefined;
		locks = locks.filter((key) => key !== 'maxPrice');
		draftPrice = undefined;
		maxPrice = undefined;
		draftShipping = false;
		freeShipping = false;
	}

	function selectCapacity(value: number | undefined) {
		if (value === capacity) return;
		remember();
		cancelPending();
		capacity = value;
	}

	function updateCriteria(patch: Partial<ShopperPlan>) {
		const fields = Object.keys(patch) as (keyof ShopperPlan)[];
		if (!fields.some((key) => JSON.stringify(activePlan[key]) !== JSON.stringify(patch[key])))
			return;
		changePlan(patch, false, patch.category);
		for (const field of fields) register(field);
	}

	function updateShipping(value: boolean) {
		if (freeShipping === value) return;
		remember();
		cancelPending();
		freeShipping = draftShipping = value;
	}
	function chooseCategory(value: Category | 'all', clearSearch = false) {
		const removeQuery =
			!!query && (clearSearch || !searchProducts({ category: value, query }).length);
		const removeCapacity = capacity !== undefined && value !== 'cooker';
		if (value !== category || removeQuery || removeCapacity) remember();
		register('category');
		category = value;
		if (removeCapacity) capacity = undefined;
		if (removeQuery) {
			query = draftQuery = '';
			locks = locks.filter((key) => key !== 'query');
		}
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

{#snippet languageSwitch()}
	<button
		class={[
			'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
		]}
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
{/snippet}

{#snippet harnessLink()}
	<a
		class={[
			'assistant-link [&.assistant-link]:ms-[auto] [&.assistant-link]:inline-flex [&.assistant-link]:min-h-[var(--tap)] [&.assistant-link]:items-center [&.assistant-link]:text-[length:var(--small)] [&.assistant-link]:text-[var(--ink)] [&.assistant-link]:underline [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]'
		]}
		href={resolve('/harness#assistant')}
		onclick={(event) => {
			if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
				return;
			event.preventDefault();
			void goto(resolve('/harness#assistant'), { state: { storeSearch: captureSearch() } });
		}}
	>
		{language === 'th' ? 'ทดลองผู้ช่วยปรับหน้าร้าน' : 'Explore the agent harness'}
	</a>
{/snippet}

{#snippet sectionDeal()}
	{#if topDeal}<DealSlip receipt={topDeal} locale={language} />{/if}
{/snippet}
{#snippet sharedStore()}
	<ShareLook
		locale={language}
		storefrontUrl={page.url.href}
		plan={activePlan}
		presentationFields={lookFields}
	/>
{/snippet}
{#snippet rankingExplanation(productId: string)}
	{@const reasons = ranked.find(({ product }) => product.id === productId)?.terms ?? []}
	{#if adapted && sort === 'default' && !plan.simplified && reasons.length && products.length > 1}
		<details class={['rank [&.rank]:relative [&.rank]:z-[1] [&.rank]:justify-self-start']}>
			<summary
				class={[
					'[.rank_&]:[&:is(summary)]:cursor-pointer [.rank_&]:[&:is(summary)]:content-center [.rank_&]:[&:is(summary)]:[min-block-size:var(--tap)]'
				]}
			>
				{a.rank}
			</summary>
			<ul class={['[.rank_&]:[&:is(ul)]:list-none [.rank_&]:[&:is(ul)]:p-[0]']}>
				{#each reasons.slice(0, 3) as reason (reason.key)}
					<li
						class={[
							'[.rank_&]:[&:is(li)]:grid [.rank_&]:[&:is(li)]:grid-cols-[1fr_35%] [.rank_&]:[&:is(li)]:items-center [.rank_&]:[&:is(li)]:gap-[0.5rem]'
						]}
					>
						<span
							class={[
								'[.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
							]}
						>
							{termName(reason.key, productId)}
						</span><span
							class={[
								'rank-track [&.rank-track]:block [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
							]}
							aria-hidden="true"
						>
							<span
								class={[
									'[&[data-rank-bar]]:block [&[data-rank-bar]]:h-[0.375rem] [&[data-rank-bar]]:bg-[currentColor] [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
								]}
								data-rank-bar
								style:width={`${reasons[0].contribution > 0 ? (reason.contribution / reasons[0].contribution) * 100 : 0}%`}
							></span>
						</span>
					</li>
				{/each}
			</ul>
		</details>
	{/if}
{/snippet}
{#snippet shelf(ids: readonly string[], shelfLayout: 'grid' | 'list' | 'table' | 'large-print')}
	{@const shelfProducts = ids.flatMap(
		(id) => products.find((product) => product.catalogId === id) ?? []
	)}
	{#if shelfLayout === 'table'}
		<ShelfTable
			products={shelfProducts.flatMap(
				(product) => canonical.find(({ id }) => id === product.catalogId) ?? []
			)}
			locale={language}
			onDeal={openDeal}
			onAdd={session.addProduct}
			{listingHref}
			reasons={rankingExplanation}
			highlightedSpecs={plan.highlightedSpecs}
			interviewDetails={interviewAnswers ? plan.details : []}
		/>
	{:else}
		<ul
			class={[
				'product-grid m-[0] grid list-none grid-cols-[repeat(3,_minmax(0,_1fr))] gap-[0.75rem] p-[0] [&.list-layout]:grid-cols-[minmax(0,_1fr)] group-[.event-demo]/store:[&.product-grid]:grid-cols-[repeat(4,_minmax(0,_1fr))] group-[.event-demo]/store:[&.product-grid]:gap-[0.5rem] group-[.event-demo]/store:[&.product-grid]:px-[0.5rem] [.rank_&]:[&:is(ul)]:list-none [.rank_&]:[&:is(ul)]:p-[0] [@media(max-width:520px)]:[&.product-grid]:grid-cols-[minmax(0,_1fr)] [@media(max-width:710px)]:group-[.event-demo]/store:[&.product-grid]:grid-cols-[repeat(2,_minmax(0,_1fr))] [@media(max-width:760px)]:[&.product-grid]:grid-cols-[repeat(2,_minmax(0,_1fr))]'
			]}
			class:list-layout={shelfLayout === 'list' || theme === 'large'}
		>
			{#each shelfProducts as product (product.id)}
				{#if eventDemo}
					<li
						class={[
							"product [&.product]:relative [&.product]:grid [&.product]:min-w-[0] [&.product]:grid-cols-[minmax(0,_1fr)] [&.product]:grid-rows-[7.5rem_1fr] [&.product]:rounded-[var(--radius)] [&.product]:bg-[var(--surface)] [&.product]:[overflow-wrap:anywhere] [&.product]:[border:1px_solid_var(--seam)] group-[.event-demo]/store:[&.product]:grid-cols-[minmax(0,_1fr)] group-[.event-demo]/store:[&.product]:grid-rows-[auto_1fr] [&.product:has(.product-link:focus-visible)]:[outline:2px_solid_var(--accent)] [&.product:has(.product-link:focus-visible)]:[outline-offset:2px] [.rank_&]:[&:is(li)]:grid [.rank_&]:[&:is(li)]:grid-cols-[1fr_35%] [.rank_&]:[&:is(li)]:items-center [.rank_&]:[&:is(li)]:gap-[0.5rem] [@media(max-width:520px)]:[&.product]:grid-cols-[minmax(5rem,_25%)_minmax(0,_1fr)] [@media(max-width:520px)]:[&.product]:grid-rows-[auto] [@media(max-width:520px)]:group-[[data-theme='large']]/store:[&.product]:grid-cols-[minmax(4rem,_20%)_minmax(0,_1fr)]"
						]}
						data-product={product.catalogId}
						data-product-card={product.catalogId}
					>
						<div
							class={[
								'art demo-photo [&.art]:grid [&.art]:place-items-center [&.art]:text-[var(--accent)] group-[.event-demo]/store:[&.art]:relative group-[.event-demo]/store:[&.art]:[aspect-ratio:1] [&.art:not(.demo-photo)]:bg-[#e9e6dc]'
							]}
							data-category={product.category}
							data-model={product.id}
							data-cooker-photo={product.catalogId}
							aria-hidden={product.id === 'cooker-1' || product.id === 'cooker-2'
								? undefined
								: true}
						>
							{#if product.id === 'cooker-1' || product.id === 'cooker-2'}<CookerPhotoCaption
									productId={product.id === 'cooker-2' ? 'cooker-digital' : 'cooker-one-button'}
									locale={language}
									compact
								/>{/if}
						</div>
						<div
							class={[
								"card-body [&.card-body]:flex [&.card-body]:min-w-[0] [&.card-body]:flex-col [&.card-body]:p-[0.8rem] group-[.event-demo]/store:[&.card-body]:gap-[0.25rem] group-[.event-demo]/store:[&.card-body]:p-[0.45rem_0.5rem_0.6rem] group-[[data-density='compact']]/store:[&.card-body]:gap-[0.3rem] group-[[data-density='compact']]/store:[&.card-body]:p-[0.5rem] group-[[data-density='spacious']]/store:[&.card-body]:gap-[0.65rem] group-[[data-density='spacious']]/store:[&.card-body]:p-[1rem] [&.card-body]:[&_.shop]:mt-[0.2rem] [&.card-body]:[&_.shop]:text-[length:var(--small)] [&.card-body]:[&_.shop]:text-[var(--muted)] group-[.event-demo]/store:[&.card-body]:[&_.shop]:[order:3]"
							]}
						>
							<h3
								class={[
									'[&:is(h3)]:m-[0] [&:is(h3)]:text-[length:var(--size)] [&:is(h3)]:leading-[1.4] [&:is(h3)]:font-[650] [.card-body_&]:[&:is(h3)]:mb-[0.45rem] [.event-demo_.card-body_&]:[&:is(h3)]:m-[0] [.event-demo_.card-body_&]:[&:is(h3)]:min-h-[2.7em] [.event-demo_.card-body_&]:[&:is(h3)]:text-[max(0.9375rem,_var(--small))] [.event-demo_.card-body_&]:[&:is(h3)]:leading-[1.35] [.event-demo_.card-body_&]:[&:is(h3)]:font-[400]'
								]}
							>
								<a
									class={[
										"product-link [&.product-link::after]:absolute [&.product-link::after]:inset-[0] [&.product-link::after]:[content:''] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]"
									]}
									href={resolve(`/product/[id]?lang=${language}&theme=${theme}${originQuery}`, {
										id: product.id
									})}
								>
									<FactValue productId={product.catalogId} field="name" locale={language} />
								</a>
							</h3>
							<div
								class={[
									'price [&.price]:mt-[auto] [&.price]:flex [&.price]:flex-wrap [&.price]:items-baseline [&.price]:gap-[0.25rem_0.6rem] group-[.event-demo]/store:[&.price]:m-[0] group-[.event-demo]/store:[&.price]:gap-[0.15rem_0.4rem] [&.price]:[&_s]:text-[length:var(--small)] [&.price]:[&_s]:text-[var(--void)] group-[.event-demo]/store:[&.price]:[&_s]:text-[var(--muted)] [&.price]:[&_strong]:text-[max(1.45rem,_var(--size))] group-[.event-demo]/store:[&.price]:[&_strong]:text-[max(1.1rem,_var(--size))] group-[.event-demo]/store:[&.price]:[&_strong]:text-[var(--accent)]'
								]}
							>
								<span
									class={[
										'visually-hidden [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)] [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
									]}
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
										class={[
											'visually-hidden [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)] [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
										]}
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
									'shipping [&.shipping]:[margin-block:0.25rem_0.45rem] [&.shipping]:flex [&.shipping]:items-baseline [&.shipping]:gap-[0.4rem] [&.shipping]:py-[0.32rem] [&.shipping]:text-[length:var(--small)] [&.shipping]:text-[var(--muted)] [&.shipping]:[border-block:1px_dashed_var(--seam)] group-[.event-demo]/store:[&.shipping]:[order:2] group-[.event-demo]/store:[&.shipping]:m-[0] group-[.event-demo]/store:[&.shipping]:items-center group-[.event-demo]/store:[&.shipping]:justify-start group-[.event-demo]/store:[&.shipping]:gap-[0.35rem] group-[.event-demo]/store:[&.shipping]:py-[0] group-[.event-demo]/store:[&.shipping]:[border:0] [&.shipping]:[&_.shipping-shop]:min-w-[0] [&.shipping]:[&_.shipping-shop]:[flex:1] [&.shipping]:[&_.shipping-shop]:overflow-hidden [&.shipping]:[&_.shipping-shop]:ps-[0.35rem] [&.shipping]:[&_.shipping-shop]:text-ellipsis [&.shipping]:[&_.shipping-shop]:whitespace-nowrap [&.shipping]:[&_.shipping-shop]:[border-inline-start:1px_solid_var(--seam)]'
								]}
							>
								<svg
									aria-hidden="true"
									viewBox="0 0 24 24"
									width="16"
									height="16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.7"
								>
									<path d="M2 6h12v11H2zM14 10h4l4 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle
										cx="18"
										cy="18"
										r="2"
									/>
								</svg>
								<span
									class={[
										'visually-hidden [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)] [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
									]}
								>
									{t.shipping}
								</span>
								<span
									class={[
										'leader [&.leader]:[flex:1] [&.leader]:[border-bottom:1px_dotted_var(--muted)] group-[.event-demo]/store:[&.leader]:hidden [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
									]}
									aria-hidden="true"
								></span>
								<FactValue
									class="figure"
									productId={product.catalogId}
									field="shipping"
									locale={language}
								/>
								<FactValue
									class="shipping-shop"
									productId={product.catalogId}
									field="shop"
									locale={language}
								/>
							</div>
							<div
								class={[
									'metadata [&.metadata]:flex [&.metadata]:flex-wrap [&.metadata]:justify-between [&.metadata]:gap-[0.2rem_0.45rem] [&.metadata]:text-[length:var(--small)] [&.metadata]:text-[var(--muted)] group-[.event-demo]/store:[&.metadata]:[order:1] group-[.event-demo]/store:[&.metadata]:items-center group-[.event-demo]/store:[&.metadata]:justify-start'
								]}
							>
								<span
									class={[
										'[.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
									]}
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
										class={[
											'visually-hidden [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)] [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
										]}
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
								<span
									class={[
										'[.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
									]}
								>
									{t.sold}
									<FactValue
										class="figure"
										productId={product.catalogId}
										field="sold"
										locale={language}
									/>
								</span>
							</div>
						</div>
					</li>
				{:else}
					<AdaptiveProductCard
						{product}
						plan={activePlan}
						photos={Boolean(interviewAnswers)}
						columns={activePlan.details.includes('specs') ? cardSpecs(product.catalogId) : []}
						vouchers={cardVouchers.get(product.catalogId) ?? []}
						href={listingHref(product.id)}
					>
						<div
							class={[
								'card-actions [&.card-actions]:relative [&.card-actions]:z-[1] [&.card-actions]:mt-[0.65rem] [&.card-actions]:flex [&.card-actions]:flex-wrap [&.card-actions]:items-start [&.card-actions]:gap-[0.5rem] [&.card-actions]:self-start'
							]}
						>
							<AddToCart
								productId={product.catalogId}
								locale={language}
								onAdd={session.addProduct}
							/>
							<button
								class={[
									'best-price [&.best-price]:relative [&.best-price]:z-[1] [&.best-price]:justify-self-start [&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
								]}
								type="button"
								onclick={() => openDeal(product.catalogId)}
							>
								{a.deal}
							</button>
						</div>
						{@render rankingExplanation(product.catalogId)}
					</AdaptiveProductCard>
				{/if}
			{/each}
		</ul>
	{/if}
{/snippet}
<svelte:head>
	<title>DynamicShopper</title>
	<meta
		name="description"
		content="Browse the DynamicShopper simulated catalog in Thai or English."
	/>
</svelte:head>

<svelte:window onkeydown={handleTraceKey} />

<div
	class={[
		"store group/store min-h-screen bg-[var(--paper)] text-[var(--ink)] [font:var(--size)/1.5_'IBM_Plex_Sans_Thai','Noto_Sans_Thai',system-ui,sans-serif] [&.event-demo]:[overflow-anchor:none] [&.store]:[&_.figure]:[font-family:'IBM_Plex_Mono',_'IBM_Plex_Sans_Thai',_ui-monospace,_monospace] [&.store]:[&_.figure]:tabular-nums"
	]}
	class:event-demo={eventDemo}
	class:trace-open={traceOpen && !eventDemo}
	data-theme={theme}
	data-density={adapted ? plan.density : 'comfortable'}
	lang={language}
>
	<a
		class={[
			'skip [&.skip]:absolute [&.skip]:h-[1px] [&.skip]:w-[1px] [&.skip]:overflow-hidden [&.skip]:[clip-path:inset(50%)] [&.skip:focus]:inset-[0.5rem_auto_auto_0.5rem] [&.skip:focus]:z-[1] [&.skip:focus]:h-[auto] [&.skip:focus]:w-[auto] [&.skip:focus]:bg-[var(--surface)] [&.skip:focus]:p-[0.5rem] [&.skip:focus]:text-[var(--ink)] [&.skip:focus]:[clip-path:none] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]'
		]}
		href="#products"
	>
		{t.skip}
	</a>
	{#if !eventDemo}
		<header
			class={[
				'masthead [&.masthead]:bg-[var(--surface)] [&.masthead]:[border-bottom:1px_solid_var(--seam)]'
			]}
		>
			<div
				class={[
					'wrap masthead-inner [&.masthead-inner]:flex [&.masthead-inner]:flex-wrap [&.masthead-inner]:items-center [&.masthead-inner]:justify-between [&.masthead-inner]:gap-[0.65rem] [&.masthead-inner]:py-[0.6rem] [&.wrap]:mx-[auto] [&.wrap]:w-[min(100%_-_2.5rem,_70rem)] [@media(max-width:520px)]:[&.masthead-inner]:gap-[0.3rem_0.5rem] [@media(max-width:520px)]:[&.masthead-inner]:py-[0.35rem] [@media(max-width:520px)]:[&.wrap]:w-[calc(100%_-_1.5rem)]'
				]}
			>
				<a
					class={[
						'brand [&.brand]:inline-flex [&.brand]:min-h-[var(--tap)] [&.brand]:items-center [&.brand]:gap-[0.45rem] [&.brand]:font-[750] [&.brand]:tracking-[-0.035em] [&.brand]:text-[var(--ink)] [&.brand]:no-underline [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]'
					]}
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
					class={[
						'settings [&.settings]:flex [&.settings]:flex-wrap [&.settings]:items-center [&.settings]:gap-[0.65rem] [@media(max-width:520px)]:[&.settings]:gap-[0.3rem_0.5rem]'
					]}
				>
					<a
						class={[
							'compare-link [&.compare-link]:inline-flex [&.compare-link]:min-h-[var(--tap,_44px)] [&.compare-link]:items-center [&.compare-link]:underline [&.compare-link]:[text-underline-offset:0.15em] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]'
						]}
						data-offline-ready={session.offlineReady}
						href={resolve(`/compare?${compareParams}`)}
					>
						{a.compare}
					</a>
					<select
						class={[
							'[&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [&:is(select)]:box-border [&:is(select)]:min-h-[var(--tap)] [&:is(select)]:min-w-[0] [&:is(select)]:rounded-[var(--radius)] [&:is(select)]:bg-[var(--surface)] [&:is(select)]:p-[0.4rem_0.7rem] [&:is(select)]:text-[var(--ink)] [&:is(select)]:[border:1px_solid_var(--ink)] [&:is(select)]:[font:inherit] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)] [@media(max-width:520px)]:[.sort_&]:[&:is(select)]:max-w-[12.25rem]'
						]}
						aria-label={t.theme}
						bind:value={theme}
						onchange={() => register('theme')}
					>
						{#each themes as option (option)}
							<option value={option}>{t[option]}</option>
						{/each}
					</select>
					{@render languageSwitch()}
					<CartControls locale={language} onBestPrice={() => openBasket()} />
					<button
						class={[
							"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:border-[var(--accent)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:underline [.shopper-toolbar_&]:[&[aria-expanded='true']]:[text-underline-offset:0.2em] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
						]}
						type="button"
						bind:this={traceTrigger}
						disabled={!interactive}
						aria-expanded={traceOpen}
						aria-controls={traceOpen ? 'store-xray' : undefined}
						aria-keyshortcuts="X"
						onclick={toggleTrace}
					>
						{a.trace}
					</button>
				</div>
			</div>
		</header>
	{/if}

	<main
		class={[
			'wrap [&.wrap]:mx-[auto] [&.wrap]:w-[min(100%_-_2.5rem,_70rem)] [&:is(main)]:pt-[clamp(1.15rem,_4vw,_3rem)] group-[.event-demo]/store:[&:is(main)]:w-[min(100%,_64rem)] group-[.event-demo]/store:[&:is(main)]:pt-[0] [@media(max-width:520px)]:[&.wrap]:w-[calc(100%_-_1.5rem)]'
		]}
	>
		<h1
			class={[
				'[&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)] [&:is(h1)]:m-[0] [&:is(h1)]:text-[clamp(1.85rem,_5vw,_3.25rem)] [&:is(h1)]:leading-[1.23] [&:is(h1)]:tracking-[-0.035em]'
			]}
			class:visually-hidden={eventDemo}
		>
			{t.title}
		</h1>
		{#if eventDemo}
			<header
				class={[
					'marketplace-brand [&.marketplace-brand]:flex [&.marketplace-brand]:items-center [&.marketplace-brand]:justify-between [&.marketplace-brand]:bg-[var(--marketplace-orange)] [&.marketplace-brand]:p-[0.75rem_1rem_0.2rem] [&.marketplace-brand]:text-[white]'
				]}
				aria-label="DynamicShopper"
			>
				<a
					href={resolve('/')}
					class={[
						'marketplace-identity [&.marketplace-identity]:inline-flex [&.marketplace-identity]:min-h-[44px] [&.marketplace-identity]:items-center [&.marketplace-identity]:gap-[0.55rem] [&.marketplace-identity]:text-[1.25rem] [&.marketplace-identity]:font-[750] [&.marketplace-identity]:tracking-[-0.035em] [&.marketplace-identity]:text-[inherit] [&.marketplace-identity]:no-underline [&.marketplace-identity:focus-visible]:[outline-color:white] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]'
					]}
				>
					<svg
						width="28"
						height="30"
						viewBox="0 0 28 30"
						fill="none"
						stroke="currentColor"
						stroke-width="1.7"
						aria-hidden="true"
					>
						<path d="M5 9h18l2 18H3L5 9Z" /><path d="M9 12V8a5 5 0 0 1 10 0v4" />
					</svg>
					<span
						class={[
							'[.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
						]}
					>
						DynamicShopper
					</span>
				</a>
				{@render languageSwitch()}
			</header>
		{/if}

		<form
			class={[
				'search [&.search]:[margin-block:0.85rem_1.1rem] [&.search]:flex [&.search]:flex-nowrap [&.search]:items-center [&.search]:gap-[0.65rem] group-[.event-demo]/store:[&.search]:sticky group-[.event-demo]/store:[&.search]:top-[0] group-[.event-demo]/store:[&.search]:z-[3] group-[.event-demo]/store:[&.search]:m-[0] group-[.event-demo]/store:[&.search]:gap-[0.375rem] group-[.event-demo]/store:[&.search]:bg-[var(--marketplace-orange)] group-[.event-demo]/store:[&.search]:p-[0.375rem_0.5rem] [@media(max-width:699px)]:group-[.event-demo]/store:[&.search.cooker-search]:grid [@media(max-width:699px)]:group-[.event-demo]/store:[&.search.cooker-search]:grid-cols-[var(--tap)_minmax(0,_1fr)_var(--tap)] [@media(max-width:699px)]:group-[.event-demo]/store:[&.search.cooker-search]:gap-[0.125rem] [@media(max-width:699px)]:group-[.event-demo]/store:[&.search.cooker-search]:px-[0.125rem]'
			]}
			class:cooker-search={cookerSearch}
			role="search"
			onsubmit={submitSearch}
		>
			{#if eventDemo}
				<button
					type="button"
					class={[
						'search-back group-[.event-demo]/store:[&.search-back]:[flex:0_0_44px] group-[.event-demo]/store:[&.search-back]:p-[0] group-[.event-demo]/store:[&.search-back]:text-[var(--accent)] group-[.event-demo]/store:[&.search-back]:[border:0] [&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)] [@media(max-width:699px)]:[.cooker-search_&]:[&.search-back]:[grid-area:1_/_1]'
					]}
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
				class={[
					'visually-hidden [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)]'
				]}
				for="search"
			>
				{t.search}
			</label>
			<input
				class={[
					'[&::placeholder]:text-[var(--muted)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [&:is(input)]:box-border [&:is(input)]:min-h-[var(--tap)] [&:is(input)]:min-w-[0] [&:is(input)]:rounded-[var(--radius)] [&:is(input)]:bg-[var(--surface)] [&:is(input)]:p-[0.4rem_0.7rem] [&:is(input)]:text-[var(--ink)] [&:is(input)]:[border:1px_solid_var(--ink)] [&:is(input)]:[font:inherit] [.budget_&]:[&:is(input)]:w-[min(100%,_12rem)] [.event-demo_.search_&]:[&:is(input)]:rounded-[0.375rem] [.event-demo_.search_&]:[&:is(input)]:border-[white] [.event-demo_.search_&]:[&:is(input)]:bg-[white] [.event-demo_.search_&]:[&:is(input)]:pe-[2.75rem] [.search_&]:[&:is(input)]:[flex:1] [.shipping-option_&]:[&:is(input)]:h-[1.15rem] [.shipping-option_&]:[&:is(input)]:min-h-[0] [.shipping-option_&]:[&:is(input)]:w-[1.15rem] [.shipping-option_&]:[&:is(input)]:[accent-color:var(--accent)] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:w-[100%] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:[padding-inline:var(--tap)_0.5rem] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:[grid-area:1_/_2]'
				]}
				id="search"
				disabled={!interactive}
				maxlength={eventDemo ? searchLimit : undefined}
				type="search"
				placeholder={category !== 'all' ? categories[category][language] : t.searchHint}
				bind:value={draftQuery}
			/>
			{#if eventDemo}
				<button
					type="submit"
					class={[
						'search-icon group-[.event-demo]/store:[&.search-icon]:z-[1] group-[.event-demo]/store:[&.search-icon]:ms-[-3.125rem] group-[.event-demo]/store:[&.search-icon]:w-[44px] group-[.event-demo]/store:[&.search-icon]:[flex:none] group-[.event-demo]/store:[&.search-icon]:bg-[transparent] group-[.event-demo]/store:[&.search-icon]:text-[var(--ink)] group-[.event-demo]/store:[&.search-icon]:[border:0] [&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&.search-icon]:m-[0] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&.search-icon]:w-[var(--tap)] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&.search-icon]:justify-self-start [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&.search-icon]:[grid-area:1_/_2]'
					]}
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
						bind:sort
						options={cookerSorts.map((value) => ({ value, label: t[value] }))}
					/>
				{:else}
					<button
						class={[
							'filter-trigger group-[.event-demo]/store:[&.filter-trigger]:gap-[0.2rem] group-[.event-demo]/store:[&.filter-trigger]:bg-[white] group-[.event-demo]/store:[&.filter-trigger]:px-[0.4rem] group-[.event-demo]/store:[&.filter-trigger]:text-[var(--accent)] group-[.event-demo]/store:[&.filter-trigger]:[border:0] [&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
						]}
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
					class={[
						'primary [&.primary]:border-[var(--accent)] [&.primary]:bg-[var(--accent)] [&.primary]:font-[650] [&.primary]:text-[white] [&.primary:hover]:bg-[var(--accent)] [&.primary:hover]:underline [&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
					]}
					type="submit"
				>
					{t.submit}
				</button>
			{/if}
		</form>

		{#snippet interviewEntry()}
			<InterviewEntry
				plan={activePlan}
				lockedFields={locks}
				answers={interviewAnswers}
				directOnly={interviewDirectOnly}
				applied={interviewAnswers !== null && adapted}
				disabled={!interactive}
				compact={eventDemo}
				onapply={applyInterviewAnswers}
				onchat={focusAssistant}
				onundo={undoStack.length ? undo : undefined}
			/>
		{/snippet}
		{#if !adapted || !interviewAnswers}{@render interviewEntry()}{/if}
		{#snippet shoppingTasks()}
			<ShoppingTasks
				locale={language}
				ids={products.map((product) => product.catalogId)}
				disabled={!interactive}
				publicEntry={eventDemo}
				strip={cookerSearch || skinSearch}
			/>
		{/snippet}
		{#if !cookerSearch && !skinSearch}{@render shoppingTasks()}{/if}

		{#if skinSearch && products.length > 0}
			<SearchShopPreview {products} {language} {theme} />
		{/if}
		{#if eventDemo && !cookerSearch}
			<div
				class={[
					'sort-tabs [&.sort-tabs]:grid [&.sort-tabs]:grid-cols-[repeat(4,_minmax(0,_1fr))] [&.sort-tabs]:[border-bottom:1px_solid_var(--seam)] group-[.event-demo]/store:[&.sort-tabs]:bg-[var(--surface)]'
				]}
				role="group"
				aria-label={t.sort}
			>
				<button
					class={[
						"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.categories_&]:[&[aria-pressed='true']]:font-[700] [.categories_&]:[&[aria-pressed='true']]:text-[var(--ink)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.event-demo_.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.event-demo_.categories_&]:[&[aria-pressed='true']]:text-[var(--accent)] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [.sort-tabs_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.sort-tabs_&]:[&[aria-pressed='true']]:text-[var(--accent)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
					]}
					type="button"
					aria-pressed={sort === 'default'}
					onclick={() => (sort = 'default')}
				>
					{language === 'th' ? 'เกี่ยวข้อง' : 'Relevance'}
				</button>
				<button
					class={[
						"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.categories_&]:[&[aria-pressed='true']]:font-[700] [.categories_&]:[&[aria-pressed='true']]:text-[var(--ink)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.event-demo_.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.event-demo_.categories_&]:[&[aria-pressed='true']]:text-[var(--accent)] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [.sort-tabs_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.sort-tabs_&]:[&[aria-pressed='true']]:text-[var(--accent)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
					]}
					type="button"
					aria-pressed={sort === 'top-rated'}
					onclick={() => (sort = 'top-rated')}
				>
					{t['top-rated']}
				</button>
				<button
					class={[
						"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.categories_&]:[&[aria-pressed='true']]:font-[700] [.categories_&]:[&[aria-pressed='true']]:text-[var(--ink)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.event-demo_.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.event-demo_.categories_&]:[&[aria-pressed='true']]:text-[var(--accent)] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [.sort-tabs_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.sort-tabs_&]:[&[aria-pressed='true']]:text-[var(--accent)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
					]}
					type="button"
					aria-pressed={sort === 'top-sales'}
					onclick={() => (sort = 'top-sales')}
				>
					{t['top-sales']}
				</button>
				<button
					class={[
						'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&.active]:border-[var(--accent)] [.sort-tabs_&]:[&.active]:text-[var(--accent)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
					]}
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
					<span
						id="price-sort-direction"
						class={[
							'visually-hidden [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)] [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
						]}
					>
						{t[sort]}
					</span>
				{/if}
			</div>
		{/if}

		{#if cookerSearch || skinSearch}
			<SearchQuickFilters
				{shoppingTasks}
				{harnessLink}
				cooker={cookerSearch}
				{language}
				{category}
				bind:capacity={() => capacity, selectCapacity}
				{freeShipping}
				{openFilters}
				toggleShipping={() => {
					freeShipping = !freeShipping;
					draftShipping = freeShipping;
				}}
				changeCategory={(value) => chooseCategory(value, true)}
			/>
		{:else}
			<nav
				class={[
					'categories [&.categories]:flex [&.categories]:flex-wrap [&.categories]:gap-[0_0.55rem] [&.categories]:[border-bottom:1px_solid_var(--seam)] group-[.event-demo]/store:[&.categories]:sticky group-[.event-demo]/store:[&.categories]:top-[calc(var(--tap)_+_0.75rem)] group-[.event-demo]/store:[&.categories]:z-[2] group-[.event-demo]/store:[&.categories]:[scrollbar-width:none] group-[.event-demo]/store:[&.categories]:flex-nowrap group-[.event-demo]/store:[&.categories]:gap-[0.375rem] group-[.event-demo]/store:[&.categories]:overflow-x-auto group-[.event-demo]/store:[&.categories]:bg-[var(--surface)] group-[.event-demo]/store:[&.categories]:p-[0.375rem_0.5rem]'
				]}
				aria-label={t.categories}
			>
				{#if eventDemo}
					<button
						class={[
							"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.categories_&]:[&[aria-pressed='true']]:font-[700] [.categories_&]:[&[aria-pressed='true']]:text-[var(--ink)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.event-demo_.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.event-demo_.categories_&]:[&[aria-pressed='true']]:text-[var(--accent)] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [.sort-tabs_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.sort-tabs_&]:[&[aria-pressed='true']]:text-[var(--accent)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
						]}
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
					class={[
						"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.categories_&]:[&[aria-pressed='true']]:font-[700] [.categories_&]:[&[aria-pressed='true']]:text-[var(--ink)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.event-demo_.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.event-demo_.categories_&]:[&[aria-pressed='true']]:text-[var(--accent)] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [.sort-tabs_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.sort-tabs_&]:[&[aria-pressed='true']]:text-[var(--accent)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
					]}
					disabled={!interactive}
					aria-pressed={category === 'all'}
					onclick={() => chooseCategory('all')}
				>
					{t.all}
				</button>
				{#each categoryKeys as key (key)}
					<button
						class={[
							"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.categories_&]:[&[aria-pressed='true']]:font-[700] [.categories_&]:[&[aria-pressed='true']]:text-[var(--ink)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.event-demo_.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.event-demo_.categories_&]:[&[aria-pressed='true']]:text-[var(--accent)] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [.sort-tabs_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.sort-tabs_&]:[&[aria-pressed='true']]:text-[var(--accent)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
						]}
						disabled={!interactive}
						aria-pressed={category === key}
						onclick={() => chooseCategory(key)}
					>
						{categories[key][language]}
					</button>
				{/each}
			</nav>
		{/if}

		{#if !eventDemo}
			<div
				class={[
					'toolbar [&.toolbar]:my-[1rem] [&.toolbar]:flex [&.toolbar]:flex-wrap [&.toolbar]:items-center [&.toolbar]:justify-between [&.toolbar]:gap-[0.65rem] [@media(max-width:520px)]:[&.toolbar]:gap-[0.4rem]'
				]}
			>
				<label
					class={[
						'sort [&.sort]:flex [&.sort]:flex-wrap [&.sort]:items-center [&.sort]:gap-[0.65rem] [&.sort]:text-[length:var(--small)] [&.sort]:text-[var(--muted)] [@media(max-width:520px)]:[&.sort]:gap-[0.4rem]'
					]}
				>
					<span
						class={[
							'[.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
						]}
					>
						{t.sort}
					</span>
					<select
						class={[
							'[&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [&:is(select)]:box-border [&:is(select)]:min-h-[var(--tap)] [&:is(select)]:min-w-[0] [&:is(select)]:rounded-[var(--radius)] [&:is(select)]:bg-[var(--surface)] [&:is(select)]:p-[0.4rem_0.7rem] [&:is(select)]:text-[var(--ink)] [&:is(select)]:[border:1px_solid_var(--ink)] [&:is(select)]:[font:inherit] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)] [@media(max-width:520px)]:[.sort_&]:[&:is(select)]:max-w-[12.25rem]'
						]}
						bind:value={sort}
						onchange={cancelPending}
					>
						{#each sorts as option (option)}
							<option value={option}>{t[option]}</option>
						{/each}
					</select>
				</label>
				<button
					class={[
						"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:border-[var(--accent)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:underline [.shopper-toolbar_&]:[&[aria-expanded='true']]:[text-underline-offset:0.2em] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
					]}
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
			<label class={['budget [&.budget]:grid [&.budget]:gap-[0.3rem]']}>
				{t.maxPrice}
				<input
					class={[
						'[&::placeholder]:text-[var(--muted)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [&:is(input)]:box-border [&:is(input)]:min-h-[var(--tap)] [&:is(input)]:min-w-[0] [&:is(input)]:rounded-[var(--radius)] [&:is(input)]:bg-[var(--surface)] [&:is(input)]:p-[0.4rem_0.7rem] [&:is(input)]:text-[var(--ink)] [&:is(input)]:[border:1px_solid_var(--ink)] [&:is(input)]:[font:inherit] [.budget_&]:[&:is(input)]:w-[min(100%,_12rem)] [.event-demo_.search_&]:[&:is(input)]:rounded-[0.375rem] [.event-demo_.search_&]:[&:is(input)]:border-[white] [.event-demo_.search_&]:[&:is(input)]:bg-[white] [.event-demo_.search_&]:[&:is(input)]:pe-[2.75rem] [.search_&]:[&:is(input)]:[flex:1] [.shipping-option_&]:[&:is(input)]:h-[1.15rem] [.shipping-option_&]:[&:is(input)]:min-h-[0] [.shipping-option_&]:[&:is(input)]:w-[1.15rem] [.shipping-option_&]:[&:is(input)]:[accent-color:var(--accent)] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:w-[100%] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:[padding-inline:var(--tap)_0.5rem] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:[grid-area:1_/_2]'
					]}
					type="number"
					min="0"
					max={Number.MAX_SAFE_INTEGER}
					step="1"
					inputmode="numeric"
					bind:value={draftPrice}
				/>
			</label>
			<label
				class={[
					'shipping-option [&.shipping-option]:inline-flex [&.shipping-option]:min-h-[var(--tap)] [&.shipping-option]:cursor-pointer [&.shipping-option]:items-center [&.shipping-option]:gap-[0.45rem]'
				]}
			>
				<input
					class={[
						'[&::placeholder]:text-[var(--muted)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [&:is(input)]:box-border [&:is(input)]:min-h-[var(--tap)] [&:is(input)]:min-w-[0] [&:is(input)]:rounded-[var(--radius)] [&:is(input)]:bg-[var(--surface)] [&:is(input)]:p-[0.4rem_0.7rem] [&:is(input)]:text-[var(--ink)] [&:is(input)]:[border:1px_solid_var(--ink)] [&:is(input)]:[font:inherit] [.budget_&]:[&:is(input)]:w-[min(100%,_12rem)] [.event-demo_.search_&]:[&:is(input)]:rounded-[0.375rem] [.event-demo_.search_&]:[&:is(input)]:border-[white] [.event-demo_.search_&]:[&:is(input)]:bg-[white] [.event-demo_.search_&]:[&:is(input)]:pe-[2.75rem] [.search_&]:[&:is(input)]:[flex:1] [.shipping-option_&]:[&:is(input)]:h-[1.15rem] [.shipping-option_&]:[&:is(input)]:min-h-[0] [.shipping-option_&]:[&:is(input)]:w-[1.15rem] [.shipping-option_&]:[&:is(input)]:[accent-color:var(--accent)] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:w-[100%] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:[padding-inline:var(--tap)_0.5rem] [@media(max-width:699px)]:[.event-demo_.search.cooker-search_&]:[&:is(input)]:[grid-area:1_/_2]'
					]}
					type="checkbox"
					bind:checked={draftShipping}
				/>
				{t.freeOnly}
			</label>
			<div
				class={[
					'filter-actions [&.filter-actions]:flex [&.filter-actions]:flex-wrap [&.filter-actions]:items-center [&.filter-actions]:gap-[0.65rem] [.demo-filter_&]:[&.filter-actions]:mt-[auto] [.demo-filter_&]:[&.filter-actions]:flex-row-reverse'
				]}
			>
				<button
					class={[
						'primary [&.primary]:border-[var(--accent)] [&.primary]:bg-[var(--accent)] [&.primary]:font-[650] [&.primary]:text-[white] [&.primary:hover]:bg-[var(--accent)] [&.primary:hover]:underline [&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
					]}
					type="submit"
				>
					{t.apply}
				</button>
				<button
					class={[
						'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
					]}
					type="button"
					onclick={clearFilters}
				>
					{t.clear}
				</button>
			</div>
		{/snippet}

		{#if eventDemo}
			<dialog
				class={[
					'demo-filter [&.demo-filter]:m-[0_0_0_auto] [&.demo-filter]:box-border [&.demo-filter]:h-[100dvh] [&.demo-filter]:max-h-[none] [&.demo-filter]:w-[min(88%,_24rem)] [&.demo-filter]:max-w-[none] [&.demo-filter]:bg-[var(--surface)] [&.demo-filter]:p-[0] [&.demo-filter]:text-[var(--ink)] [&.demo-filter]:[border:0] [&.demo-filter::backdrop]:bg-[rgb(0_0_0_/_48%)] [&.demo-filter[open]]:flex [&.demo-filter[open]]:flex-col'
				]}
				bind:this={filterDialog}
				aria-labelledby="demo-filter-title"
			>
				<div
					class={[
						'drawer-heading [&.drawer-heading]:flex [&.drawer-heading]:items-center [&.drawer-heading]:justify-between [&.drawer-heading]:gap-[0.5rem] [&.drawer-heading]:bg-[var(--paper)] [&.drawer-heading]:p-[0.5rem_0.75rem]'
					]}
				>
					<h2
						class={[
							'[&:is(h2)]:m-[0] [&:is(h2)]:text-[1.375rem] [.drawer-heading_&]:[&:is(h2)]:text-[1rem] [.event-demo_.results-header_&]:[&:is(h2)]:text-[length:var(--small)] [.event-demo_.results-header_&]:[&:is(h2)]:text-[var(--muted)]'
						]}
						id="demo-filter-title"
					>
						{t.filters}
					</h2>
					<button
						class={[
							'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
						]}
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
					class={[
						'filters [&.filters]:mb-[1rem] [&.filters]:flex [&.filters]:flex-wrap [&.filters]:items-end [&.filters]:gap-[0.85rem_1.1rem] [&.filters]:rounded-[var(--radius)] [&.filters]:bg-[var(--surface)] [&.filters]:p-[0.85rem] [&.filters]:[border:1px_solid_var(--ink)] [&.filters[hidden]]:hidden [.demo-filter_&]:[&.filters]:m-[0] [.demo-filter_&]:[&.filters]:[flex:1] [.demo-filter_&]:[&.filters]:flex-col [.demo-filter_&]:[&.filters]:flex-nowrap [.demo-filter_&]:[&.filters]:items-stretch [.demo-filter_&]:[&.filters]:[border:0]'
					]}
					onsubmit={applyFilters}
				>
					{@render filterFields()}
				</form>
			</dialog>
		{:else}
			<form
				id="search-filters"
				class={[
					'filters [&.filters]:mb-[1rem] [&.filters]:flex [&.filters]:flex-wrap [&.filters]:items-end [&.filters]:gap-[0.85rem_1.1rem] [&.filters]:rounded-[var(--radius)] [&.filters]:bg-[var(--surface)] [&.filters]:p-[0.85rem] [&.filters]:[border:1px_solid_var(--ink)] [&.filters[hidden]]:hidden [.demo-filter_&]:[&.filters]:m-[0] [.demo-filter_&]:[&.filters]:[flex:1] [.demo-filter_&]:[&.filters]:flex-col [.demo-filter_&]:[&.filters]:flex-nowrap [.demo-filter_&]:[&.filters]:items-stretch [.demo-filter_&]:[&.filters]:[border:0]'
				]}
				hidden={!filtersOpen}
				onsubmit={applyFilters}
			>
				{@render filterFields()}
			</form>
		{/if}

		{#if !eventDemo}
			<CriteriaOverview
				plan={activePlan}
				onChange={updateCriteria}
				{freeShipping}
				{capacity}
				onShipping={updateShipping}
				onCapacity={selectCapacity}
			/>
		{/if}

		{#if hasFilters}
			<div
				class={[
					'chips [&.chips]:mb-[1rem] [&.chips]:flex [&.chips]:flex-wrap [&.chips]:items-center [&.chips]:gap-[0.65rem] group-[.event-demo]/store:[&.chips]:m-[0.375rem]'
				]}
			>
				{#if selectedCapacityProduct}
					<button
						class={[
							'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
						]}
						type="button"
						onclick={() => selectCapacity(undefined)}
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
						class={[
							'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
						]}
						type="button"
						onclick={() => {
							cancelPending();
							locks = locks.filter((key) => key !== 'maxPrice');
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
						class={[
							'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
						]}
						type="button"
						onclick={() => {
							cancelPending();
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
			<section
				class={[
					'shopper-tools [&.shopper-tools]:my-[1rem] [&.shopper-tools]:py-[0.7rem] [&.shopper-tools]:[border-block:1px_solid_var(--seam)]'
				]}
				aria-label={a.persona}
			>
				{#if restoredFields.length || cartRestored}
					<div
						class={[
							'assistant-reply [&.assistant-reply]:my-[0.55rem] [&.assistant-reply]:p-[0.6rem_0.75rem] [&.assistant-reply]:[overflow-wrap:anywhere] [&.assistant-reply]:[border:1px_dashed_var(--seam)]'
						]}
						role="status"
					>
						<strong>
							{language === 'th' ? 'กู้คืนหน้าร้านที่บันทึกไว้แล้ว' : 'Restored your saved store'}
						</strong>
						<p
							class={[
								'[&:is(p)]:m-[0] [.assistant-reply_&]:[&:is(p)]:my-[0.25rem] [.empty_&]:[&:is(p)]:[margin-block:0.25rem_0.8rem] [.results-header_&]:[&:is(p)]:text-[length:var(--small)] [.results-header_&]:[&:is(p)]:text-[var(--muted)]'
							]}
						>
							{[
								...new Set(restoredFields.map(changeName)),
								...(cartRestored ? [language === 'th' ? 'ตะกร้า' : 'Cart'] : [])
							].join(' · ')}
						</p>
					</div>
				{/if}
				{#if changes.length}
					<div
						class={[
							'assistant-reply [&.assistant-reply]:my-[0.55rem] [&.assistant-reply]:p-[0.6rem_0.75rem] [&.assistant-reply]:[overflow-wrap:anywhere] [&.assistant-reply]:[border:1px_dashed_var(--seam)]'
						]}
						role="status"
					>
						<strong>{a.changed}</strong>
						<p
							class={[
								'[&:is(p)]:m-[0] [.assistant-reply_&]:[&:is(p)]:my-[0.25rem] [.empty_&]:[&:is(p)]:[margin-block:0.25rem_0.8rem] [.results-header_&]:[&:is(p)]:text-[length:var(--small)] [.results-header_&]:[&:is(p)]:text-[var(--muted)]'
							]}
						>
							{[...new Set(changes.map(changeName))].join(' · ')}
						</p>
					</div>
				{/if}
				{#if sharedLookOpened}<p
						class={[
							'[&:is(p)]:m-[0] [.assistant-reply_&]:[&:is(p)]:my-[0.25rem] [.empty_&]:[&:is(p)]:[margin-block:0.25rem_0.8rem] [.results-header_&]:[&:is(p)]:text-[length:var(--small)] [.results-header_&]:[&:is(p)]:text-[var(--muted)]'
						]}
						role="status"
					>
						{language === 'th' ? 'เปิดหน้าร้านที่แชร์แล้ว' : 'Shared store opened'}
					</p>{/if}
				<ShoppingAssistant
					bind:this={assistant}
					locale={language}
					onSend={send}
					openOnMount={['#assistant', '#shopper-assistant'].includes(page.url.hash)}
					conversation={session.conversation}
					pending={Boolean(pendingPhase)}
					pendingLabel={pendingPhase === 'cart'
						? language === 'th'
							? 'กำลังบันทึกตะกร้า…'
							: 'Saving your cart…'
						: undefined}
					largePrint={theme === 'large'}
					{theme}
				/>
				<div
					class={[
						'shopper-toolbar [&.shopper-toolbar]:mt-[0.65rem] [&.shopper-toolbar]:flex [&.shopper-toolbar]:flex-wrap [&.shopper-toolbar]:justify-between [&.shopper-toolbar]:gap-x-[1rem] [&.shopper-toolbar]:gap-y-[0.15rem]'
					]}
				>
					<div
						class={[
							'shopper-actions shopper-views [&.shopper-actions]:my-[0.55rem] [&.shopper-actions]:flex [&.shopper-actions]:flex-wrap [&.shopper-actions]:items-center [&.shopper-actions]:gap-[0.4rem] [&.shopper-views]:content-start [&.shopper-views]:[min-inline-size:0] [.shopper-toolbar_&]:[&.shopper-actions]:my-[0]'
						]}
					>
						<button
							class={[
								"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:border-[var(--accent)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:underline [.shopper-toolbar_&]:[&[aria-expanded='true']]:[text-underline-offset:0.2em] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
							]}
							type="button"
							aria-expanded={compareOpen}
							onclick={() => (compareOpen = !compareOpen)}
						>
							{compareOpen ? a.closeCompare : a.compare}
						</button>
						<button
							class={[
								"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:border-[var(--accent)] [.shopper-toolbar_&]:[&[aria-expanded='true']]:underline [.shopper-toolbar_&]:[&[aria-expanded='true']]:[text-underline-offset:0.2em] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
							]}
							type="button"
							disabled={!interactive}
							aria-expanded={personasOpen}
							aria-controls="shopper-presets"
							bind:this={personaTrigger}
							onclick={() => (personasOpen = !personasOpen)}
							onkeydown={closePersonasOnEscape}
						>
							{a.persona}
							<svg
								class={[
									"disclosure [&.disclosure]:ms-[0.25rem] [&.disclosure]:[vertical-align:middle] [button[aria-expanded='true']_&]:[&.disclosure]:rotate-[180deg]"
								]}
								width="12"
								height="12"
								viewBox="0 0 12 12"
								aria-hidden="true"
							>
								<path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
							</svg>
						</button>
						<div
							id="shopper-presets"
							class={[
								'shopper-actions shopper-presets [&.shopper-actions]:my-[0.55rem] [&.shopper-actions]:flex [&.shopper-actions]:flex-wrap [&.shopper-actions]:items-center [&.shopper-actions]:gap-[0.4rem] [&.shopper-presets:not([hidden])]:[flex-basis:100%] [&.shopper-presets:not([hidden])]:pt-[0.55rem] [&.shopper-presets:not([hidden])]:[border-block-start:1px_dashed_var(--seam)] [&.shopper-presets[hidden]]:hidden [.shopper-toolbar_&]:[&.shopper-actions]:my-[0]'
							]}
							hidden={!personasOpen}
						>
							{#each personas as persona (persona)}
								<button
									class={[
										'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
									]}
									type="button"
									id={`persona-${persona}`}
									disabled={!interactive}
									onclick={() => selectPersona(persona)}
									onkeydown={closePersonasOnEscape}
								>
									{a[persona]}
								</button>
							{/each}
						</div>
					</div>
					<div
						class={[
							'shopper-actions shelf-utilities [&.shelf-utilities]:content-start [&.shelf-utilities]:[min-inline-size:0] [&.shopper-actions]:my-[0.55rem] [&.shopper-actions]:flex [&.shopper-actions]:flex-wrap [&.shopper-actions]:items-center [&.shopper-actions]:gap-[0.4rem] [.shopper-toolbar_&]:[&.shopper-actions]:my-[0]'
						]}
					>
						{#if !adapted || !interviewAnswers}
							<button
								class={[
									'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
								]}
								type="button"
								disabled={!undoStack.length}
								onclick={undo}
							>
								{a.undo}
							</button>
						{/if}
						<button
							class={[
								'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
							]}
							type="button"
							onclick={() => restoreDefaults()}
						>
							{a.reset}
						</button>
					</div>
				</div>
				{#if adapted || locks.length}
					<div
						class={[
							'shopper-actions [&.shopper-actions]:my-[0.55rem] [&.shopper-actions]:flex [&.shopper-actions]:flex-wrap [&.shopper-actions]:items-center [&.shopper-actions]:gap-[0.4rem] [.shopper-toolbar_&]:[&.shopper-actions]:my-[0]'
						]}
						aria-label={a.appearance}
					>
						{#each ['theme', 'layout', 'locale', 'category', 'maxPrice', 'query', 'specPreferences'] as value (value)}
							{@const key = value as keyof ShopperPlan}
							{#if JSON.stringify(activePlan[key]) !== JSON.stringify(defaultPlan[key])}
								<button
									class={[
										'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
									]}
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
			</section>
			<XrayDrawer locale={language} bind:open={traceOpen} returnFocus={traceTrigger}>
				<Xray
					locale={language}
					{trace}
					{forceOffline}
					onForceOffline={setForceOffline}
					modelName={liveModel}
					{poisonArmed}
					onPoison={dev ? () => (poisonArmed = true) : undefined}
				>
					{#if dev}
						<button
							class={[
								"[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.categories_&]:[&[aria-pressed='true']]:font-[700] [.categories_&]:[&[aria-pressed='true']]:text-[var(--ink)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.event-demo_.categories_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.event-demo_.categories_&]:[&[aria-pressed='true']]:text-[var(--accent)] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [.sort-tabs_&]:[&[aria-pressed='true']]:border-[var(--accent)] [.sort-tabs_&]:[&[aria-pressed='true']]:text-[var(--accent)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]"
							]}
							type="button"
							disabled={forceOffline}
							onclick={toggleLive}
							aria-pressed={liveEnabled}
						>
							{language === 'th' ? 'ลองใช้โมเดลสด' : 'Try live model'}
						</button>
					{/if}
					{#if liveFallback}
						<p
							class={[
								'[&:is(p)]:m-[0] [.assistant-reply_&]:[&:is(p)]:my-[0.25rem] [.empty_&]:[&:is(p)]:[margin-block:0.25rem_0.8rem] [.results-header_&]:[&:is(p)]:text-[length:var(--small)] [.results-header_&]:[&:is(p)]:text-[var(--muted)]'
							]}
						>
							{language === 'th'
								? 'ใช้การตอบแบบออฟไลน์แทน'
								: 'Live model unavailable. Used offline mode.'}
						</p>
					{/if}
					{#if turn?.dropped.length}<p
							class={[
								'[&:is(p)]:m-[0] [.assistant-reply_&]:[&:is(p)]:my-[0.25rem] [.empty_&]:[&:is(p)]:[margin-block:0.25rem_0.8rem] [.results-header_&]:[&:is(p)]:text-[length:var(--small)] [.results-header_&]:[&:is(p)]:text-[var(--muted)]'
							]}
						>
							{a.rejected}
						</p>{/if}
				</Xray>
			</XrayDrawer>
			{#if compareOpen}
				<div
					class={[
						'comparison-area [@media(min-width:1024px)]:group-[.trace-open]/store:[&.comparison-area]:pe-[calc(320px_+_1rem)]'
					]}
				>
					<CompareShelves
						plan={activePlan}
						locale={language}
						{eligibleProducts}
						onDeal={openDeal}
					/>
				</div>
			{/if}
			{#if quote}
				<section
					class={[
						'quote [&.quote]:my-[1rem] [&.quote]:py-[0.7rem] [&.quote]:[border-block:1px_solid_var(--seam)] [@media(min-width:1024px)]:group-[.trace-open]/store:[&.quote]:pe-[calc(320px_+_1rem)]'
					]}
					lang={quote.locale}
				>
					<button
						class={[
							'[&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
						]}
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
		<section
			class={[
				'[@media(min-width:1024px)]:group-[.trace-open]/store:[&#products]:pe-[calc(320px_+_1rem)]'
			]}
			id="products"
			aria-labelledby="products-heading"
			tabindex="-1"
		>
			<div
				class={[
					'results-header [&.results-header]:mb-[0.75rem] [&.results-header]:flex [&.results-header]:items-baseline [&.results-header]:justify-between [&.results-header]:gap-[1rem] [&.results-header]:pb-[0.4rem] [&.results-header]:[border-bottom:2px_solid_var(--ink)] group-[.event-demo]/store:[&.results-header]:mb-[0] group-[.event-demo]/store:[&.results-header]:p-[0.3rem_0.5rem] group-[.event-demo]/store:[&.results-header]:[border:0] [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)]'
				]}
				class:visually-hidden={skinSearch || (cookerSearch && sort === 'default')}
			>
				<h2
					class={[
						'[&:is(h2)]:m-[0] [&:is(h2)]:text-[1.375rem] [.drawer-heading_&]:[&:is(h2)]:text-[1rem] [.event-demo_.results-header_&]:[&:is(h2)]:text-[length:var(--small)] [.event-demo_.results-header_&]:[&:is(h2)]:text-[var(--muted)]'
					]}
					id="products-heading"
				>
					{cookerSearch && sort !== 'default' ? t[sort] : t.products}
				</h2>
				{#if eventDemo && !cookerSearch && !skinSearch}
					{@render harnessLink()}
					<a
						class={[
							'assistant-link [&.assistant-link]:ms-[auto] [&.assistant-link]:inline-flex [&.assistant-link]:min-h-[var(--tap)] [&.assistant-link]:items-center [&.assistant-link]:text-[length:var(--small)] [&.assistant-link]:text-[var(--ink)] [&.assistant-link]:underline [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]'
						]}
						href={resolve('/?view=receipt#assistant')}
					>
						{language === 'th' ? 'ผู้ช่วยช้อปปิ้ง' : 'Shopping assistant'}
					</a>
				{/if}
				<p
					class={[
						'[&:is(p)]:m-[0] [.assistant-reply_&]:[&:is(p)]:my-[0.25rem] [.empty_&]:[&:is(p)]:[margin-block:0.25rem_0.8rem] [.results-header_&]:[&:is(p)]:text-[length:var(--small)] [.results-header_&]:[&:is(p)]:text-[var(--muted)]'
					]}
					aria-live="polite"
				>
					<span
						class={[
							'visually-hidden [&.visually-hidden]:absolute [&.visually-hidden]:h-[1px] [&.visually-hidden]:w-[1px] [&.visually-hidden]:overflow-hidden [&.visually-hidden]:[clip-path:inset(50%)] [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
						]}
					>
						{t.products}
					</span>
					<span
						class={[
							'figure [.event-demo_.metadata_>_&]:[&:first-child]:p-[0_0.2rem] [.event-demo_.metadata_>_&]:[&:first-child]:[border:1px_solid_var(--seam)] [.metadata_>_&]:[&:is(span)]:inline-flex [.metadata_>_&]:[&:is(span)]:items-center [.metadata_>_&]:[&:is(span)]:gap-[0.25rem]'
						]}
						data-fact="resultCount"
						data-raw={products.length}
					>
						{formatNumber(products.length)}
					</span>
				</p>
			</div>
			{#if adapted && interviewAnswers}{@render interviewEntry()}{/if}
			{#if !eventDemo}<FactsReceipt root={proofRoot} locale={language} />{/if}
			<div bind:this={proofRoot}>
				{#if products.length === 0}
					<div
						class={[
							'empty [&.empty]:p-[1rem] [&.empty]:[border:1px_dashed_var(--ink)] group-[.event-demo]/store:[&.empty]:m-[0.5rem]'
						]}
					>
						<h3
							class={[
								'[&:is(h3)]:m-[0] [&:is(h3)]:text-[length:var(--size)] [&:is(h3)]:leading-[1.4] [&:is(h3)]:font-[650] [.card-body_&]:[&:is(h3)]:mb-[0.45rem] [.event-demo_.card-body_&]:[&:is(h3)]:m-[0] [.event-demo_.card-body_&]:[&:is(h3)]:min-h-[2.7em] [.event-demo_.card-body_&]:[&:is(h3)]:text-[max(0.9375rem,_var(--small))] [.event-demo_.card-body_&]:[&:is(h3)]:leading-[1.35] [.event-demo_.card-body_&]:[&:is(h3)]:font-[400]'
							]}
						>
							{t.empty}
						</h3>
						<p
							class={[
								'[&:is(p)]:m-[0] [.assistant-reply_&]:[&:is(p)]:my-[0.25rem] [.empty_&]:[&:is(p)]:[margin-block:0.25rem_0.8rem] [.results-header_&]:[&:is(p)]:text-[length:var(--small)] [.results-header_&]:[&:is(p)]:text-[var(--muted)]'
							]}
						>
							{t.emptyHint}
						</p>
						<button
							type="button"
							class={[
								'primary [&.primary]:border-[var(--accent)] [&.primary]:bg-[var(--accent)] [&.primary]:font-[650] [&.primary]:text-[white] [&.primary:hover]:bg-[var(--accent)] [&.primary:hover]:underline [&:hover]:bg-[var(--paper)] [&:is(button)]:box-border [&:is(button)]:inline-flex [&:is(button)]:min-h-[var(--tap)] [&:is(button)]:min-w-[0] [&:is(button)]:cursor-pointer [&:is(button)]:items-center [&:is(button)]:justify-center [&:is(button)]:gap-[0.35rem] [&:is(button)]:rounded-[var(--radius)] [&:is(button)]:bg-[var(--surface)] [&:is(button)]:p-[0.4rem_0.7rem] [&:is(button)]:text-[var(--ink)] [&:is(button)]:[border:1px_solid_var(--ink)] [&:is(button)]:[font:inherit] group-[:not(.event-demo)]/store:[&:is(button)]:[min-inline-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px] [.categories_&]:[&:is(button)]:rounded-[0] [.categories_&]:[&:is(button)]:[border-width:0_0_3px] [.categories_&]:[&:is(button)]:[border-style:solid] [.categories_&]:[&:is(button)]:border-[transparent] [.categories_&]:[&:is(button)]:bg-[transparent] [.categories_&]:[&:is(button)]:px-[0.45rem] [.categories_&]:[&:is(button)]:text-[var(--muted)] [.chips_&]:[&:is(button)]:rounded-[999px] [.chips_&]:[&:is(button)]:text-[length:var(--small)] [.demo-filter_.filter-actions_&]:[&:is(button)]:[flex:1] [.demo-filter_.filter-actions_&]:[&:is(button)]:border-[var(--accent)] [.drawer-heading_&]:[&:is(button)]:bg-[transparent] [.drawer-heading_&]:[&:is(button)]:[border:0] [.event-demo_.categories_&]:[&:is(button)]:[flex:none] [.event-demo_.categories_&]:[&:is(button)]:rounded-[var(--radius)] [.event-demo_.categories_&]:[&:is(button)]:bg-[#f5f5f5] [.event-demo_.categories_&]:[&:is(button)]:px-[0.5rem] [.event-demo_.categories_&]:[&:is(button)]:text-[length:var(--small)] [.event-demo_.categories_&]:[&:is(button)]:whitespace-nowrap [.event-demo_.categories_&]:[&:is(button)]:[border:1px_solid_transparent] [.shelf-utilities_&]:[&:disabled]:cursor-not-allowed [.shelf-utilities_&]:[&:disabled]:text-[var(--muted)] [.shelf-utilities_&]:[&:is(button)]:border-[transparent] [.shelf-utilities_&]:[&:is(button)]:bg-[transparent] [.shelf-utilities_&]:[&:not(:disabled):hover]:border-[var(--seam)] [.sort-tabs_&]:[&:is(button)]:rounded-[0] [.sort-tabs_&]:[&:is(button)]:[border-width:0_0_2px] [.sort-tabs_&]:[&:is(button)]:[border-style:solid] [.sort-tabs_&]:[&:is(button)]:border-[transparent] [.sort-tabs_&]:[&:is(button)]:p-[0.25rem] [.sort-tabs_&]:[&:is(button)]:[overflow-wrap:anywhere] [.sort-tabs_&]:[&:is(button)]:text-[var(--muted)] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:px-[0.45rem] [@media(max-width:520px)]:[.settings_&]:[&:is(button,_select)]:text-[length:var(--small)]'
							]}
							onclick={reset}
						>
							{t.reset}
						</button>
					</div>
				{:else if eventDemo}
					{@render shelf(
						products.map((product) => product.catalogId),
						'grid'
					)}
				{:else}
					<Sections
						sections={adapted ? activePlan.sections : ['products']}
						productIds={products.map((product) => product.catalogId)}
						layout={adapted ? activePlan.layout : 'grid'}
						locale={language}
						columns={[]}
						{listingHref}
						productTarget={false}
						priorities={priorityLabels}
						renderShelf={shelf}
						deal={topDeal && !quote ? sectionDeal : undefined}
						share={sharedStore}
					/>
				{/if}
			</div>
		</section>
		<footer
			class={[
				'[&:is(footer)]:py-[1.25rem] [&:is(footer)]:text-[length:var(--small)] [&:is(footer)]:text-[var(--muted)] group-[.event-demo]/store:[&:is(footer)]:px-[0.5rem]'
			]}
		>
			{eventDemo
				? language === 'th'
					? 'DynamicShopper · ภาพประกอบสินค้าจำลอง'
					: 'DynamicShopper · Illustrative product images'
				: t.simulated}
			{#if !eventDemo}<a
					class={[
						'inspection-link [&.inspection-link]:ms-[1rem] [&.inspection-link]:inline-flex [&.inspection-link]:items-center [&.inspection-link]:text-[inherit] [&.inspection-link]:[min-block-size:var(--tap)] [&:is(button,_a,_input,_select):focus-visible]:[outline:2px_solid_var(--accent)] [&:is(button,_a,_input,_select):focus-visible]:[outline-offset:2px]'
					]}
					href="#xray"
					onclick={() => (traceOpen = true)}
				>
					{language === 'th' ? 'ตรวจสอบหน้าร้านนี้' : 'Inspect this store'}
				</a>{/if}
		</footer>
	</main>
</div>
