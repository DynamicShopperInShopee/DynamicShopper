import {
	cpSync,
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateCatalogSnapshot } from '../../src/lib/server/catalog/validate.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const build = resolve(root, 'preview/dist');
const output = resolve(root, 'deploy/catalog/dist/assets');
const catalog = validateCatalogSnapshot(
	JSON.parse(readFileSync(resolve(root, 'data/shopee/catalog.json'), 'utf8'))
);
if (!existsSync(resolve(build, 'index.html')))
	throw new Error(
		'Run npm run build:catalog:cloud to build and package the current shopping preview.'
	);
// This command packages an existing build. The build:catalog:cloud script owns rebuilding source.
const images = catalog.items.filter((item) => item.image !== null);
for (const item of images) {
	if (item.image !== `/api/catalog/images/${item.id}`)
		throw new Error(`Image must be locally cached: ${item.id}`);
	const source = resolve(root, `data/shopee/images/${item.id}.jpg`);
	if (statSync(source).size > 25 * 1024 * 1024)
		throw new Error(`Image exceeds asset size limit: ${item.id}`);
}
// Rebuild only this generated directory after all required input paths have passed validation.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(build, output, { recursive: true });
const targetImages = resolve(output, '_catalog-images');
mkdirSync(targetImages, { recursive: true });
for (const item of images)
	cpSync(
		resolve(root, `data/shopee/images/${item.id}.jpg`),
		resolve(targetImages, `${item.id}.jpg`)
	);
writeFileSync(
	resolve(root, 'deploy/catalog/dist/package.json'),
	JSON.stringify(
		{
			snapshotId: catalog.snapshot.id,
			items: catalog.items.length,
			images: images.length
		},
		null,
		2
	) + '\n'
);
console.log(
	JSON.stringify({
		assets: output,
		snapshotId: catalog.snapshot.id,
		items: catalog.items.length,
		images: images.length
	})
);
