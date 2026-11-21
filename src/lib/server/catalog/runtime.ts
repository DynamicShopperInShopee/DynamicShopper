import { resolve } from 'node:path';
import { CatalogStore } from './store.ts';

let store: CatalogStore | undefined;
export function getCatalogStore() {
	store ??= new CatalogStore(resolve(process.env.CATALOG_DATABASE_PATH ?? 'data/catalog.sqlite'));
	return store;
}
