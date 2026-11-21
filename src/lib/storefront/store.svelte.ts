import { createContext } from 'svelte';
import type { ShopperPlan, Turn } from '../personalization';
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

export interface StoreSession {
	visit?: StoreVisit;
	offlineReady: boolean;
}
export const [getStoreSession, setStoreSession] = createContext<StoreSession>();

export function returnToStore(session: StoreSession): '/' | `/?${string}` {
	const query = session.visit?.search.slice(1);
	return query ? `/?${query}` : '/';
}
