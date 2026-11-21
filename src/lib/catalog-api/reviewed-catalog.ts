import snapshot from '../../../catalogs/shopee-2026-11-21/catalog.json';
import { decodeCatalogSnapshot } from './client';

const decoded = decodeCatalogSnapshot(snapshot);
if (!decoded) throw new Error('Bundled catalog failed validation');
export const reviewedCatalog = decoded;
