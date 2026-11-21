import { Conversation } from './conversation.svelte';
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

function savedPlan(value: unknown): ShopperPlan | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return;
	const { patch } = validateTurn(
		{ intent: 'change', patch: value },
		defaultPlan,
		undefined,
		'en',
		true
	);
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
	visit = $state<StoreVisit>();
	offlineReady = $state(false);
	cart = $state.raw<readonly CartItem[]>([]);
	savedPlan?: ShopperPlan;
	#storage?: StoreStorage;
	#restored = false;

	restore(storage?: StoreStorage) {
		if (this.#restored) return;
		this.#restored = true;
		this.#storage = storage;
		if (!storage) return;
		const saved = readSavedStore(storage, savedPlan, savedCart);
		this.cart = saved.cart ?? [];
		this.savedPlan = saved.plan;
	}

	restoreBrowser() {
		// Merely reading window.localStorage can throw when the browser denies access.
		try {
			this.restore(window.localStorage);
		} catch {
			this.restore();
		}
	}

	savePlan(plan: ShopperPlan) {
		this.savedPlan = savedPlan(plan);
		this.#save();
	}

	addProduct = (id: string) => {
		const next = addCartItem(this.cart, id, knownProduct, mayPrice);
		if (next.status === 'added') {
			this.cart = next.cart;
			this.#save();
		}
		return next.status;
	};

	removeProduct = (id: string) => {
		this.cart = this.cart.filter((item) => item.productId !== id);
		this.#save();
	};

	#save() {
		if (this.#storage)
			writeSavedStore(
				this.#storage,
				{ plan: this.savedPlan, cart: this.cart },
				savedPlan,
				savedCart
			);
	}
}
export const createStoreSession = () => new StoreSession();
export const [getStoreSession, setStoreSession] = createContext<StoreSession>();

export function returnToStore(session: StoreSession): '/' | `/?${string}` {
	const query = session.visit?.search.slice(1);
	return query ? `/?${query}` : '/';
}
