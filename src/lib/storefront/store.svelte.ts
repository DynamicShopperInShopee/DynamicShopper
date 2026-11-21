import { Conversation } from './conversation.svelte';
import { ListingSession } from './listingSession';
import { createContext } from 'svelte';
import { defaultPlan, type ShopperPlan, type Turn } from '../personalization';
import { validateTurn } from '../personalization/turn';
import { getProduct } from '../catalog/index.ts';
import { optimizeDeal } from '../pricing/index.ts';
import { addCartItem, restoreCart, type CartItem } from './cart';
import { getStoreOpenedAt } from './clock';
import { readSavedStore, writeSavedStore } from './browserState';
import type { Sort } from '../store-search';

export interface ShelfState {
	plan: ShopperPlan;
	adapted: boolean;
	sort: Sort;
	freeShipping: boolean;
	locks: (keyof ShopperPlan)[];
}

interface StoreVisit extends ShelfState {
	undoStack: ShelfState[];
	turn?: Turn;
	liveModel?: string;
	liveFallback: boolean;
	changes: (keyof ShopperPlan)[];
	focusedProduct?: string;
	draftQuery: string;
	search: string;
}

type StoreStorage = Pick<Storage, 'getItem' | 'setItem'>;
type StorageLock = <Result>(write: () => Result) => Promise<Result>;

function savedPlan(value: unknown): ShopperPlan | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return;
	const { query, maxPrice, ...fields } = value as Record<string, unknown>;
	const { patch } = validateTurn(
		{ intent: 'change', patch: fields },
		defaultPlan,
		undefined,
		'en',
		true
	);
	// Saved explicit controls may contain values the assistant is forbidden to infer.
	if (typeof query === 'string') patch.query = query.trim();
	if (
		maxPrice === null ||
		(typeof maxPrice === 'number' && Number.isSafeInteger(maxPrice) && maxPrice >= 0)
	)
		patch.maxPrice = maxPrice;
	if (!Object.keys(patch).length) return;
	return { ...structuredClone(defaultPlan), ...patch };
}

const knownProduct = (id: string) => getProduct(id) !== undefined;
function mayPrice(items: readonly CartItem[]) {
	const openedAt = getStoreOpenedAt();
	return optimizeDeal(items, { openedAt, now: Math.max(openedAt, Date.now()) }) !== null;
}
const savedCart = (value: unknown) => restoreCart(value, knownProduct, mayPrice);

export class StoreSession {
	readonly conversation = new Conversation();
	readonly listing = new ListingSession(this.conversation);
	visit = $state<StoreVisit>();
	offlineReady = $state(false);
	cart = $state.raw<readonly CartItem[]>([]);
	savedPlan?: ShopperPlan;
	#storage?: StoreStorage;
	#lock?: StorageLock;
	#restored = false;
	#cartWrites = Promise.resolve();

	restore(storage?: StoreStorage, lock?: StorageLock) {
		if (this.#restored) return;
		this.#restored = true;
		this.#storage = storage;
		this.#lock = lock;
		const saved = this.#read();
		this.cart = saved.cart ?? [];
		this.savedPlan = saved.plan;
	}

	restoreBrowser() {
		// Merely reading window.localStorage can throw when the browser denies access.
		try {
			const locks = navigator.locks;
			this.restore(
				window.localStorage,
				locks && ((write) => locks.request('dynamicshopper.store.v1', write))
			);
		} catch {
			this.restore();
		}
	}

	savePlan(plan: ShopperPlan) {
		const nextPlan = savedPlan(plan);
		if (JSON.stringify(nextPlan) === JSON.stringify(this.savedPlan ?? defaultPlan)) return;
		this.savedPlan = nextPlan;
		void this.#persist(() => {
			const cart = this.#read().cart ?? this.cart;
			this.#save(nextPlan, cart);
			this.cart = cart;
		});
	}

	cartSettled() {
		return this.#cartWrites;
	}

	addProduct = (id: string) =>
		this.#changeCart(() => {
			const saved = this.#read();
			const next = addCartItem(saved.cart ?? this.cart, id, knownProduct, mayPrice);
			if (next.status === 'added') this.#save(saved.plan, next.cart);
			this.cart = next.cart;
			return next.status;
		});

	removeProduct = (id: string) =>
		this.#changeCart(() => {
			const saved = this.#read();
			const cart = (saved.cart ?? this.cart).filter((item) => item.productId !== id);
			this.#save(saved.plan, cart);
			this.cart = cart;
		});

	#changeCart<Result>(write: () => Result): Promise<Result> {
		const result = this.#cartWrites.then(() => this.#persist(write));
		const settled = () => undefined;
		this.#cartWrites = result.then(settled, settled);
		return result;
	}

	async #persist<Result>(write: () => Result): Promise<Result> {
		if (!this.#storage || !this.#lock) return write();
		let started = false;
		try {
			return await this.#lock(() => {
				started = true;
				return write();
			});
		} catch (error) {
			if (started) throw error;
			return write();
		}
	}

	#read() {
		return this.#storage ? readSavedStore(this.#storage, savedPlan, savedCart) : {};
	}

	#save(plan: ShopperPlan | undefined, cart: readonly CartItem[]) {
		if (this.#storage && !writeSavedStore(this.#storage, { plan, cart }, savedPlan, savedCart))
			this.#storage = undefined;
	}
}
export const createStoreSession = () => new StoreSession();
export const [getStoreSession, setStoreSession] = createContext<StoreSession>();

export function returnToStore(session: StoreSession): '/' | `/?${string}` {
	const query = session.visit?.search.slice(1);
	return query ? `/?${query}` : '/?view=receipt';
}
