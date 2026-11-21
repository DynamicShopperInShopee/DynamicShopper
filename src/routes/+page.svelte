<script lang="ts">
	import '../lib/assets/products/cooker-photos.css';
	import { resolve } from '$app/paths';
	import { afterNavigate, beforeNavigate, snapshot } from '$app/navigation';
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
			if (result.answers.reading === 'large') register('theme');
			// Remember explicit interview controls without adding a phantom Undo step.
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
		if (result.answers.reading === 'large') register('theme');
		writePlan({ ...previous, ...result.patch });
		changes = fields.map(([key]) => key as keyof ShopperPlan);
		interviewAnswers = result.answers;
		interviewDirectOnly = directOnly;
		// The reviewed proposal may be refined by later chat requests. A theme chosen
		// with the explicit theme picker remains protected from inferred suggestions.
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
		if (!storeReady || eventDemo) return;
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
		<details class="rank">
			<summary>{a.rank}</summary>
			<ul>
				{#each reasons.slice(0, 3) as reason (reason.key)}
					<li>
						<span>{termName(reason.key, productId)}</span><span
							class="rank-track"
							aria-hidden="true"
						>
							<span
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
		<ul class="product-grid" class:list-layout={shelfLayout === 'list' || theme === 'large'}>
			{#each shelfProducts as product (product.id)}
				{#if eventDemo}
					<li
						class="product"
						data-product={product.catalogId}
						data-product-card={product.catalogId}
					>
						<div
							class="art demo-photo"
							data-category={product.category}
							data-model={product.id}
							data-cooker-photo={product.catalogId}
							aria-hidden={product.id === 'cooker-1' ? undefined : true}
						>
							{#if product.id === 'cooker-1'}<CookerPhotoCaption locale={language} compact />{/if}
						</div>
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
								<span class="visually-hidden">{t.shipping}</span>
								<span class="leader" aria-hidden="true"></span>
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
						<div class="card-actions">
							<AddToCart
								productId={product.catalogId}
								locale={language}
								onAdd={session.addProduct}
							/>
							<button class="best-price" type="button" onclick={() => openDeal(product.catalogId)}>
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
	class="store"
	class:event-demo={eventDemo}
	class:trace-open={traceOpen && !eventDemo}
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
					<a
						class="compare-link"
						data-offline-ready={session.offlineReady}
						href={resolve(`/compare?${compareParams}`)}
					>
						{a.compare}
					</a>
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
					<CartControls locale={language} onBestPrice={() => openBasket()} />
					<button
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

	<main class="wrap">
		<h1 class:visually-hidden={eventDemo}>{t.title}</h1>
		{#if eventDemo}
			<header class="marketplace-brand" aria-label="DynamicShopper">
				<a href={resolve('/')} class="marketplace-identity">
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
					<span>DynamicShopper</span>
				</a>
			</header>
		{/if}

		<form class="search" class:cooker-search={cookerSearch} role="search" onsubmit={submitSearch}>
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
			<input
				id="search"
				disabled={!interactive}
				maxlength={eventDemo ? searchLimit : undefined}
				type="search"
				placeholder={category !== 'all' ? categories[category][language] : t.searchHint}
				bind:value={draftQuery}
			/>
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
				{#if cookerSearch}
					<CookerSearchSort
						label={t.sort}
						bind:sort
						options={cookerSorts.map((value) => ({ value, label: t[value] }))}
					/>
				{:else}
					<button
						class="filter-trigger"
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
				<button class="primary" type="submit">{t.submit}</button>
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
			/>
		{/snippet}
		{#if !adapted || !interviewAnswers}{@render interviewEntry()}{/if}
		<ShoppingTasks
			locale={language}
			ids={products.map((product) => product.catalogId)}
			disabled={!interactive}
		/>

		{#if skinSearch && products.length > 0}
			<SearchShopPreview {products} {language} {theme} />
		{/if}
		{#if eventDemo && !cookerSearch}
			<div class="sort-tabs" role="group" aria-label={t.sort}>
				<button type="button" aria-pressed={sort === 'default'} onclick={() => (sort = 'default')}>
					{language === 'th' ? 'เกี่ยวข้อง' : 'Relevance'}
				</button>
				<button
					type="button"
					aria-pressed={sort === 'top-rated'}
					onclick={() => (sort = 'top-rated')}
				>
					{t['top-rated']}
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

		{#if cookerSearch || skinSearch}
			<SearchQuickFilters
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
				changeCategory={(value: Category | 'all') => {
					if (query) {
						draftQuery = query = '';
					}
					chooseCategory(value, true);
				}}
				toggleLanguage={() => {
					register('locale');
					language = language === 'th' ? 'en' : 'th';
				}}
			/>
		{:else}
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
					disabled={!interactive}
					aria-pressed={category === 'all'}
					onclick={() => chooseCategory('all')}
				>
					{t.all}
				</button>
				{#each categoryKeys as key (key)}
					<button
						disabled={!interactive}
						aria-pressed={category === key}
						onclick={() => chooseCategory(key)}
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
		{/if}

		{#if !eventDemo}
			<div class="toolbar">
				<label class="sort">
					<span>{t.sort}</span>
					<select bind:value={sort} onchange={cancelPending}>
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

		<CriteriaOverview
			plan={activePlan}
			onChange={updateCriteria}
			{freeShipping}
			{capacity}
			onShipping={updateShipping}
			onCapacity={selectCapacity}
		/>

		{#if hasFilters}
			<div class="chips">
				{#if selectedCapacityProduct}
					<button type="button" onclick={() => selectCapacity(undefined)}>
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
			<section class="shopper-tools" aria-label={a.persona}>
				{#if restoredFields.length || cartRestored}
					<div class="assistant-reply" role="status">
						<strong>
							{language === 'th' ? 'กู้คืนหน้าร้านที่บันทึกไว้แล้ว' : 'Restored your saved store'}
						</strong>
						<p>
							{[
								...new Set(restoredFields.map(changeName)),
								...(cartRestored ? [language === 'th' ? 'ตะกร้า' : 'Cart'] : [])
							].join(' · ')}
						</p>
					</div>
				{/if}
				{#if changes.length}
					<div class="assistant-reply" role="status">
						<strong>{a.changed}</strong>
						<p>{[...new Set(changes.map(changeName))].join(' · ')}</p>
					</div>
				{/if}
				{#if sharedLookOpened}<p role="status">
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
				<div class="shopper-toolbar">
					<div class="shopper-actions shopper-views">
						<button
							type="button"
							aria-expanded={compareOpen}
							onclick={() => (compareOpen = !compareOpen)}
						>
							{compareOpen ? a.closeCompare : a.compare}
						</button>
						<button
							type="button"
							disabled={!interactive}
							aria-expanded={personasOpen}
							aria-controls="shopper-presets"
							bind:this={personaTrigger}
							onclick={() => (personasOpen = !personasOpen)}
							onkeydown={closePersonasOnEscape}
						>
							{a.persona}
							<svg class="disclosure" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
								<path d="m2 4 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" />
							</svg>
						</button>
						<div
							id="shopper-presets"
							class="shopper-actions shopper-presets"
							hidden={!personasOpen}
						>
							{#each personas as persona (persona)}
								<button
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
					<div class="shopper-actions shelf-utilities">
						<button type="button" disabled={!undoStack.length} onclick={undo}>{a.undo}</button>
						<button type="button" onclick={() => restoreDefaults()}>{a.reset}</button>
					</div>
				</div>
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
							type="button"
							disabled={forceOffline}
							onclick={toggleLive}
							aria-pressed={liveEnabled}
						>
							{language === 'th' ? 'ลองใช้โมเดลสด' : 'Try live model'}
						</button>
					{/if}
					{#if liveFallback}
						<p>
							{language === 'th'
								? 'ใช้การตอบแบบออฟไลน์แทน'
								: 'Live model unavailable. Used offline mode.'}
						</p>
					{/if}
					{#if turn?.dropped.length}<p>{a.rejected}</p>{/if}
				</Xray>
			</XrayDrawer>
			{#if compareOpen}
				<div class="comparison-area">
					<CompareShelves
						plan={activePlan}
						locale={language}
						{eligibleProducts}
						onDeal={openDeal}
					/>
				</div>
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
		{/if}
		{#if cookerSearch && products.length > 0}
			<SearchShopPreview {products} {language} {theme} />
		{/if}
		<section id="products" aria-labelledby="products-heading" tabindex="-1">
			<div
				class="results-header"
				class:visually-hidden={skinSearch || (cookerSearch && sort === 'default')}
			>
				<h2 id="products-heading">{cookerSearch && sort !== 'default' ? t[sort] : t.products}</h2>
				{#if eventDemo && !cookerSearch && !skinSearch}
					<a class="assistant-link" href={resolve('/?view=receipt#assistant')}>
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
			{#if adapted && interviewAnswers}{@render interviewEntry()}{/if}
			{#if !eventDemo}<FactsReceipt root={proofRoot} locale={language} />{/if}
			<div bind:this={proofRoot}>
				{#if products.length === 0}
					<div class="empty">
						<h3>{t.empty}</h3>
						<p>{t.emptyHint}</p>
						<button type="button" class="primary" onclick={reset}>{t.reset}</button>
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
		<footer>
			{eventDemo
				? language === 'th'
					? 'DynamicShopper · ภาพประกอบสินค้าจำลอง'
					: 'DynamicShopper · Illustrative product images'
				: t.simulated}
			{#if !eventDemo}<a class="inspection-link" href="#xray" onclick={() => (traceOpen = true)}>
					{language === 'th' ? 'ตรวจสอบหน้าร้านนี้' : 'Inspect this store'}
				</a>{/if}
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
	.store:not(.event-demo) button {
		min-inline-size: var(--tap);
	}
	.wrap {
		width: min(100% - 2.5rem, 70rem);
		margin-inline: auto;
	}
	.masthead {
		border-bottom: 1px solid var(--seam);
		background: var(--surface);
	}
	.compare-link {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap, 44px);
		text-decoration: underline;
		text-underline-offset: 0.15em;
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
	.shopper-toolbar {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		column-gap: 1rem;
		row-gap: 0.15rem;
		margin-block-start: 0.65rem;
	}
	.shopper-toolbar .shopper-actions {
		margin-block: 0;
	}
	.shopper-views,
	.shelf-utilities {
		min-inline-size: 0;
		align-content: start;
	}
	.shopper-toolbar button[aria-expanded='true'] {
		border-color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}
	.disclosure {
		margin-inline-start: 0.25rem;
		vertical-align: middle;
	}
	button[aria-expanded='true'] .disclosure {
		rotate: 180deg;
	}
	.shelf-utilities button {
		border-color: transparent;
		background: transparent;
	}
	.shelf-utilities button:not(:disabled):hover {
		border-color: var(--seam);
	}
	.shelf-utilities button:disabled {
		color: var(--muted);
		cursor: not-allowed;
	}
	.shopper-presets:not([hidden]) {
		flex-basis: 100%;
		padding-block-start: 0.55rem;
		border-block-start: 1px dashed var(--seam);
	}
	.shopper-presets[hidden] {
		display: none;
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

	.card-actions {
		position: relative;
		z-index: 1;
		align-self: flex-start;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-start;
		margin-block-start: 0.65rem;
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
	.rank ul {
		padding: 0;
		list-style: none;
	}
	.rank li {
		display: grid;
		grid-template-columns: 1fr 35%;
		gap: 0.5rem;
		align-items: center;
	}
	.rank-track,
	[data-rank-bar] {
		display: block;
	}
	[data-rank-bar] {
		height: 0.375rem;
		background: currentColor;
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
		/* The sticky filters change height after scrolling. Keep the shelf offset stable. */
		overflow-anchor: none;
		--paper: #f5f5f5;
		--marketplace-orange: #ee4d2d;
		--accent: #b5321a;

		--seam: #e4e4e4;
		--radius: 6px;
		--small: 0.8125rem;
		--ink: #222;
		--muted: #585858;
	}
	.marketplace-brand {
		padding: 0.75rem 1rem 0.2rem;
		background: var(--marketplace-orange);
		color: white;
	}
	.marketplace-identity {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		min-height: 44px;
		font-size: 1.25rem;
		font-weight: 750;
		letter-spacing: -0.035em;
		text-decoration: none;
		color: inherit;
	}
	.marketplace-identity:focus-visible {
		outline-color: white;
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
		background: var(--marketplace-orange);
		position: sticky;
		top: 0;
		z-index: 3;
		margin: 0;
		padding: 0.375rem 0.5rem;
		gap: 0.375rem;
	}
	.event-demo .search input {
		border-color: white;
		background: white;
		border-radius: 0.375rem;
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
		background: white;
		border: 0;
		color: var(--accent);
		gap: 0.2rem;
		padding-inline: 0.4rem;
	}
	.sort-tabs {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
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
		gap: 0.5rem;
		padding-inline: 0.5rem;
		grid-template-columns: repeat(4, minmax(0, 1fr));
	}
	.event-demo .product {
		grid-template-columns: minmax(0, 1fr);
		grid-template-rows: auto 1fr;
	}
	.event-demo .art {
		position: relative;
		aspect-ratio: 1;
	}

	.event-demo .card-body h3 {
		font-size: max(0.9375rem, var(--small));
		line-height: 1.35;
		font-weight: 400;
	}
	.event-demo .price :global(strong) {
		color: var(--accent);
		font-size: max(1.1rem, var(--size));
	}
	.event-demo .price :global(s) {
		color: var(--muted);
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

	.event-demo .card-body {
		gap: 0.25rem;
		padding: 0.45rem 0.5rem 0.6rem;
	}
	.event-demo .card-body h3 {
		margin: 0;
		min-height: 2.7em;
	}
	.event-demo .price {
		margin: 0;
		gap: 0.15rem 0.4rem;
	}
	.event-demo .metadata {
		order: 1;
		align-items: center;
		justify-content: start;
	}
	.event-demo .metadata > span:first-child {
		border: 1px solid var(--seam);
		padding: 0 0.2rem;
	}
	.event-demo .shipping {
		border: 0;
		margin: 0;
		order: 2;
		align-items: center;
		justify-content: start;
		padding-block: 0;
		gap: 0.35rem;
	}
	.event-demo .leader {
		display: none;
	}
	.event-demo .card-body :global(.shop) {
		order: 3;
	}
	.inspection-link {
		display: inline-flex;
		align-items: center;
		min-block-size: var(--tap);
		margin-inline-start: 1rem;
		color: inherit;
	}
	@media (min-width: 1024px) {
		.store.trace-open #products,
		.store.trace-open .comparison-area,
		.store.trace-open .quote {
			padding-inline-end: calc(320px + 1rem);
		}
	}
	.shipping :global(.shipping-shop) {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		border-inline-start: 1px solid var(--seam);
		padding-inline-start: 0.35rem;
	}
	@media (max-width: 699px) {
		.event-demo .cooker-search {
			display: grid;
			grid-template-columns: var(--tap) minmax(0, 1fr) var(--tap);
			padding-inline: 0.125rem;
			gap: 0.125rem;
		}
		.cooker-search .search-back {
			grid-area: 1 / 1;
		}
		.event-demo .cooker-search input {
			grid-area: 1 / 2;
			width: 100%;
			padding-inline: var(--tap) 0.5rem;
		}
		.event-demo .cooker-search .search-icon {
			grid-area: 1 / 2;
			justify-self: start;
			width: var(--tap);
			margin: 0;
		}
	}
</style>
