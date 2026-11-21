import BetterSqlite3 from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
	CatalogCategory,
	CatalogPage,
	CatalogSnapshot,
	CatalogSnapshotInfo,
	ShopListing
} from '../../catalog-api/types.ts';
import { parseCatalogQuery } from './query.ts';
import { validateCatalogSnapshot } from './validate.ts';

export class CatalogUnavailableError extends Error {}

type MetaRow = { metadata: string; categories: string; checksum: string };
type ListingRow = { body: string };

/** Catalog writes are only available to trusted import code, never to HTTP callers. */
export class CatalogStore {
	private readonly database: BetterSqlite3.Database;

	constructor(path: string) {
		if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
		this.database = new BetterSqlite3(path);
		this.database.pragma('journal_mode = WAL');
		this.database.pragma('busy_timeout = 5000');
		this.database.exec(`
			CREATE TABLE IF NOT EXISTS catalog_meta (
				id INTEGER PRIMARY KEY CHECK (id = 1), metadata TEXT NOT NULL,
				categories TEXT NOT NULL, checksum TEXT NOT NULL
			);
			CREATE TABLE IF NOT EXISTS catalog_items (
				id TEXT PRIMARY KEY, position INTEGER NOT NULL, category TEXT NOT NULL,
				price INTEGER, searchable TEXT NOT NULL, body TEXT NOT NULL,
				CHECK (price IS NULL OR (typeof(price) = 'integer' AND price >= 0))
			);
			CREATE INDEX IF NOT EXISTS catalog_category_position ON catalog_items (category, position);
			CREATE INDEX IF NOT EXISTS catalog_price_id ON catalog_items (price, id);
		`);
	}

	importSnapshot(input: unknown): { changed: boolean; total: number; snapshotId: string } {
		const validated = validateCatalogSnapshot(input);
		const checksum = createHash('sha256').update(JSON.stringify(validated)).digest('hex');
		return this.database.transaction(() => {
			const previous = this.database
				.prepare('SELECT checksum FROM catalog_meta WHERE id = 1')
				.get() as { checksum: string } | undefined;
			if (previous?.checksum === checksum)
				return { changed: false, total: validated.items.length, snapshotId: validated.snapshot.id };
			const insert = this.database.prepare(
				'INSERT INTO catalog_items (id, position, category, price, searchable, body) VALUES (?, ?, ?, ?, ?, ?)'
			);
			this.database.prepare('DELETE FROM catalog_items').run();
			for (const [position, item] of validated.items.entries()) {
				const searchable = [item.name.en, item.name.th, item.sellerName ?? '']
					.join(' ')
					.toLowerCase();
				insert.run(item.id, position, item.category, item.price, searchable, JSON.stringify(item));
			}
			this.database
				.prepare(
					'INSERT INTO catalog_meta (id, metadata, categories, checksum) VALUES (1, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, categories = excluded.categories, checksum = excluded.checksum'
				)
				.run(JSON.stringify(validated.snapshot), JSON.stringify(validated.categories), checksum);
			return { changed: true, total: validated.items.length, snapshotId: validated.snapshot.id };
		})();
	}

	private metadata(): { snapshot: CatalogSnapshotInfo; categories: CatalogCategory[] } {
		const row = this.database
			.prepare('SELECT metadata, categories, checksum FROM catalog_meta WHERE id = 1')
			.get() as MetaRow | undefined;
		if (!row) throw new CatalogUnavailableError('Catalog has not been imported');
		return {
			snapshot: JSON.parse(row.metadata) as CatalogSnapshotInfo,
			categories: JSON.parse(row.categories) as CatalogCategory[]
		};
	}

	snapshot(): CatalogSnapshot {
		return this.database.transaction(() => ({
			...this.metadata(),
			items: (
				this.database
					.prepare('SELECT body FROM catalog_items ORDER BY position, id')
					.all() as ListingRow[]
			).map(({ body }) => JSON.parse(body) as ShopListing)
		}))();
	}

	get(id: string): ShopListing | null {
		this.metadata();
		const row = this.database.prepare('SELECT body FROM catalog_items WHERE id = ?').get(id) as
			ListingRow | undefined;
		return row ? (JSON.parse(row.body) as ShopListing) : null;
	}

	list(params: URLSearchParams): CatalogPage {
		const query = parseCatalogQuery(params);
		return this.database.transaction(() => {
			const meta = this.metadata();
			const where: string[] = [];
			const bindings: (number | string)[] = [];
			if (query.category !== 'all') {
				where.push('category = ?');
				bindings.push(query.category);
			}
			if (query.maxPrice !== null) {
				where.push('price IS NOT NULL AND price <= ?');
				bindings.push(query.maxPrice);
			}
			for (const term of query.q.toLowerCase().split(/\s+/).filter(Boolean)) {
				where.push('instr(searchable, ?) > 0');
				bindings.push(term);
			}
			const condition = where.length ? ` WHERE ${where.join(' AND ')}` : '';
			const total = (
				this.database
					.prepare(`SELECT COUNT(*) AS total FROM catalog_items${condition}`)
					.get(...bindings) as { total: number }
			).total;
			const order =
				query.sort === 'catalog'
					? 'position, id'
					: `price IS NULL, price ${query.sort === 'price-low' ? 'ASC' : 'DESC'}, id`;
			const rows = this.database
				.prepare(`SELECT body FROM catalog_items${condition} ORDER BY ${order} LIMIT ? OFFSET ?`)
				.all(...bindings, query.pageSize, (query.page - 1) * query.pageSize) as ListingRow[];
			return {
				...meta,
				items: rows.map(({ body }) => JSON.parse(body) as ShopListing),
				total,
				page: query.page,
				pageSize: query.pageSize
			};
		})();
	}

	close() {
		this.database.close();
	}
}
