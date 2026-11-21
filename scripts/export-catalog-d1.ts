import BetterSqlite3 from 'better-sqlite3';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { CatalogSnapshot } from '../src/lib/catalog-api/types.ts';
import { validateCatalogSnapshot } from '../src/lib/server/catalog/validate.ts';

const MAX_STATEMENT_BYTES = 100_000;
const schema = [
	`CREATE TABLE IF NOT EXISTS catalog_meta (
		id INTEGER PRIMARY KEY CHECK (id = 1), metadata TEXT NOT NULL,
		categories TEXT NOT NULL, checksum TEXT NOT NULL
	)`,
	`CREATE TABLE IF NOT EXISTS catalog_items (
		id TEXT PRIMARY KEY, position INTEGER NOT NULL, category TEXT NOT NULL,
		price INTEGER, searchable TEXT NOT NULL, body TEXT NOT NULL,
		CHECK (price IS NULL OR (typeof(price) = 'integer' AND price >= 0))
	)`,
	'CREATE INDEX IF NOT EXISTS catalog_category_position ON catalog_items (category, position)',
	'CREATE INDEX IF NOT EXISTS catalog_price_id ON catalog_items (price, id)'
];

function sha256(value: string | Buffer): string {
	return createHash('sha256').update(value).digest('hex');
}

/** SQLite string literals escape apostrophes by doubling them, never backslashes. */
function literal(value: string | number | null): string {
	if (value === null) return 'NULL';
	if (typeof value === 'number') {
		if (!Number.isSafeInteger(value)) throw new Error('SQL numeric value must be a safe integer');
		return String(value);
	}
	if (value.includes('\0')) throw new Error('NUL is not supported in SQL text literals');
	return `'${value.replaceAll("'", "''")}'`;
}

export function exportCatalogD1(input: unknown) {
	const snapshot = validateCatalogSnapshot(input);
	const checksum = sha256(JSON.stringify(snapshot));
	const statements = [...schema];
	// If a nontransactional executor stops midway, the API must fail closed while
	// metadata is absent. D1 batch/import owns its transaction; no BEGIN or COMMIT.
	statements.push(`DELETE FROM catalog_meta WHERE id = 1 AND checksum <> ${literal(checksum)}`);
	for (const [position, item] of snapshot.items.entries()) {
		const searchable = [item.name.en, item.name.th, item.sellerName ?? ''].join(' ').toLowerCase();
		const values = [item.id, position, item.category, item.price, searchable, JSON.stringify(item)];
		statements.push(
			`INSERT INTO catalog_items (id, position, category, price, searchable, body) VALUES (${values.map(literal).join(', ')}) ` +
				'ON CONFLICT(id) DO UPDATE SET position = excluded.position, category = excluded.category, ' +
				'price = excluded.price, searchable = excluded.searchable, body = excluded.body ' +
				'WHERE catalog_items.position IS NOT excluded.position OR catalog_items.category IS NOT excluded.category ' +
				'OR catalog_items.price IS NOT excluded.price OR catalog_items.searchable IS NOT excluded.searchable ' +
				'OR catalog_items.body IS NOT excluded.body'
		);
	}
	statements.push(
		`DELETE FROM catalog_items WHERE id NOT IN (${snapshot.items.map(({ id }) => literal(id)).join(', ')})`
	);
	// Metadata is always the final write: no incomplete snapshot is advertised.
	statements.push(
		`INSERT INTO catalog_meta (id, metadata, categories, checksum) VALUES (1, ` +
			`${literal(JSON.stringify(snapshot.snapshot))}, ${literal(JSON.stringify(snapshot.categories))}, ${literal(checksum)}) ` +
			'ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, categories = excluded.categories, checksum = excluded.checksum ' +
			'WHERE catalog_meta.checksum IS NOT excluded.checksum'
	);
	for (const statement of statements) {
		if (Buffer.byteLength(`${statement};`, 'utf8') > MAX_STATEMENT_BYTES)
			throw new Error('A generated SQL statement exceeds the D1 100,000-byte limit');
	}
	const sql = [
		'-- DynamicShopper catalog only: unrelated tables are never changed.',
		`-- Snapshot: ${snapshot.snapshot.id}`,
		`-- Validated JSON SHA-256: ${checksum}`,
		'-- Execute as one D1 file import or one D1 batch. No explicit transaction statements.',
		'-- Metadata is invalidated first for changed snapshots and published only after all items.',
		...statements.map((statement) => `${statement};`),
		''
	].join('\n');
	return { snapshot, checksum, statements, sql };
}

type ExportedCatalog = ReturnType<typeof exportCatalogD1>;

function readSnapshot(database: BetterSqlite3.Database): CatalogSnapshot {
	const meta = database
		.prepare('SELECT metadata, categories FROM catalog_meta WHERE id = 1')
		.get() as {
		metadata: string;
		categories: string;
	};
	return {
		items: (
			database.prepare('SELECT body FROM catalog_items ORDER BY position, id').all() as {
				body: string;
			}[]
		).map(({ body }) => JSON.parse(body) as CatalogSnapshot['items'][number]),
		categories: JSON.parse(meta.categories) as CatalogSnapshot['categories'],
		snapshot: JSON.parse(meta.metadata) as CatalogSnapshot['snapshot']
	};
}

/** Runs on a new isolated SQLite database; this function makes no cloud request. */
export function verifyCatalogD1(exported: ExportedCatalog) {
	const database = new BetterSqlite3(':memory:');
	try {
		database.exec('CREATE TABLE auth_canary (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
		database
			.prepare('INSERT INTO auth_canary VALUES (?, ?)')
			.run('unrelated', "Keep this account's data");
		database.exec(exported.sql);
		assert.deepStrictEqual(readSnapshot(database), exported.snapshot);
		assert.deepStrictEqual(
			database.prepare('SELECT checksum FROM catalog_meta WHERE id = 1').get(),
			{ checksum: exported.checksum }
		);
		assert.equal(sha256(JSON.stringify(readSnapshot(database))), exported.checksum);
		const changes = database.prepare('SELECT total_changes() AS count').get();
		database.exec(exported.sql);
		assert.deepStrictEqual(database.prepare('SELECT total_changes() AS count').get(), changes);
		assert.deepStrictEqual(readSnapshot(database), exported.snapshot);
		assert.deepStrictEqual(database.prepare('SELECT * FROM auth_canary').all(), [
			{ id: 'unrelated', value: "Keep this account's data" }
		]);
		assert.deepStrictEqual(
			(
				database
					.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
					.all() as { name: string }[]
			).map(({ name }) => name),
			['auth_canary', 'catalog_items', 'catalog_meta']
		);
		return { exactRoundTrip: true, identicalReimportNoWrites: true, unrelatedTableUnchanged: true };
	} finally {
		database.close();
	}
}

function selfTest() {
	const input: CatalogSnapshot = {
		items: [
			{
				id: '1.2',
				name: { en: "Seller's item'); DROP TABLE auth_canary; --\nไทย", th: 'ตัวอย่าง' },
				category: 'test',
				price: 1290,
				currency: 'THB',
				image: null,
				source: 'https://shopee.co.th/product/1/2',
				size: null
			}
		],
		categories: [{ id: 'test', name: { en: 'Test', th: 'ทดสอบ' }, count: 1 }],
		snapshot: {
			id: 'test-export',
			source: 'https://shopee.co.th/',
			observedAt: '2026-11-21T07:22:40.572000Z',
			importedAt: '2026-11-21T07:33:23.267700Z',
			total: 1
		}
	};
	const original = exportCatalogD1(input);
	verifyCatalogD1(original);
	const updated = exportCatalogD1({ ...input, items: [{ ...input.items[0], price: 1291 }] });
	const database = new BetterSqlite3(':memory:');
	try {
		database.exec(original.sql);
		assert.throws(() =>
			database.transaction(() => {
				for (const statement of updated.statements.slice(0, schema.length + 2))
					database.exec(statement);
				database.exec('INSERT INTO nonexistent_table VALUES (1)');
			})()
		);
		assert.deepStrictEqual(readSnapshot(database), original.snapshot);
		// Even without an enclosing transaction, interruption cannot expose mixed
		// items as a complete catalog because publication metadata is absent.
		for (const statement of updated.statements.slice(0, schema.length + 2))
			database.exec(statement);
		assert.equal(database.prepare('SELECT COUNT(*) AS count FROM catalog_meta').pluck().get(), 0);
		database.exec(updated.sql);
		assert.deepStrictEqual(readSnapshot(database), updated.snapshot);
	} finally {
		database.close();
	}
	process.stdout.write(
		'D1 exporter checks passed: escaping, exact round trip, idempotence, unrelated table isolation, rollback and interrupted-import recovery.\n'
	);
}

function argument(name: string, fallback: string): string {
	const index = process.argv.indexOf(name);
	if (index < 0) return fallback;
	const value = process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
	return value;
}

async function atomicFile(path: string, content: string) {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(`${path}.tmp`, content, 'utf8');
	await rename(`${path}.tmp`, path);
}

export async function runExportCatalogD1() {
	if (process.argv.includes('--self-test')) return selfTest();
	const input = resolve(argument('--input', 'data/shopee/catalog.json'));
	const output = resolve(argument('--output', 'data/shopee/catalog-d1.sql'));
	const source = await readFile(input);
	const exported = exportCatalogD1(JSON.parse(source.toString('utf8')));
	const required = Number(argument('--require-count', '1500'));
	if (
		!Number.isSafeInteger(required) ||
		required < 1 ||
		exported.snapshot.items.length !== required
	)
		throw new Error(
			`Expected exactly ${required} validated items, found ${exported.snapshot.items.length}`
		);
	const verified = verifyCatalogD1(exported);
	const audit = {
		snapshotId: exported.snapshot.snapshot.id,
		inputSha256: sha256(source),
		checksum: exported.checksum,
		sqlSha256: sha256(exported.sql),
		total: exported.snapshot.items.length,
		categories: exported.snapshot.categories.length,
		statements: exported.statements.length,
		maximumStatementBytes: Math.max(
			...exported.statements.map((statement) => Buffer.byteLength(`${statement};`, 'utf8'))
		),
		sqlBytes: Buffer.byteLength(exported.sql, 'utf8'),
		...verified
	};
	await atomicFile(output, exported.sql);
	await atomicFile(`${output}.audit.json`, JSON.stringify(audit, null, 2) + '\n');
	// The statement list can be executed as one D1 batch; it must never be split
	// by semicolons, which may legitimately occur inside a quoted source value.
	await atomicFile(`${output}.statements.json`, JSON.stringify(exported.statements) + '\n');
	process.stdout.write(`${JSON.stringify({ output, ...audit })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	await runExportCatalogD1();
}
