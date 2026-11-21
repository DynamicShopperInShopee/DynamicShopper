import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CatalogStore } from '../src/lib/server/catalog/store.ts';
import { handleCatalogRequest } from '../src/lib/server/catalog/api.ts';

function argument(name: string, fallback?: string) {
	const index = process.argv.indexOf(name);
	if (index < 0) return fallback;
	const value = process.argv[index + 1];
	if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
	return value;
}

export async function runCatalogServer() {
	const databasePath = resolve(
		argument('--database', process.env.CATALOG_DATABASE_PATH ?? 'data/catalog.sqlite')!
	);
	const store = new CatalogStore(databasePath);
	const importFile = argument('--import');
	if (importFile) {
		try {
			const result = store.importSnapshot(JSON.parse(await readFile(resolve(importFile), 'utf8')));
			process.stdout.write(`${JSON.stringify({ ...result, databasePath })}\n`);
		} finally {
			store.close();
		}
		return;
	}
	const portText = argument('--port', process.env.CATALOG_PORT ?? '4190')!;
	if (!/^\d+$/.test(portText) || Number(portText) < 1 || Number(portText) > 65535)
		throw new Error('Invalid catalog port');
	const port = Number(portText);
	const imagesDirectory = resolve(argument('--images', 'data/shopee/images')!);
	const server = createServer((incoming, outgoing) => {
		const respond = async () => {
			const request = new Request(new URL(incoming.url ?? '/', `http://127.0.0.1:${port}`), {
				method: incoming.method ?? 'GET'
			});
			const response = await handleCatalogRequest(request, store, imagesDirectory);
			const body = Buffer.from(await response.arrayBuffer());
			outgoing.writeHead(response.status, Object.fromEntries(response.headers));
			outgoing.end(body);
		};
		void respond().catch(() => {
			if (outgoing.headersSent) {
				outgoing.destroy();
				return;
			}
			outgoing.writeHead(500, { 'content-type': 'application/json', 'cache-control': 'no-store' });
			outgoing.end(JSON.stringify({ error: 'catalog_error' }));
		});
	});
	server.listen(port, '127.0.0.1', () =>
		process.stdout.write(`Catalog API listening at http://127.0.0.1:${port}/api/catalog\n`)
	);
	const close = () => {
		server.close(() => {
			store.close();
			process.exit(0);
		});
	};
	process.once('SIGINT', close);
	process.once('SIGTERM', close);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	await runCatalogServer();
}
