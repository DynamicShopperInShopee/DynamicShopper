import { error } from '@sveltejs/kit';
import { catalog } from '../../../lib/store-catalog';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	const product = catalog.find(({ id }) => id === params.id);
	if (!product) error(404, 'Product not found');
	return {
		product,
		language: url.searchParams.get('lang') === 'th' ? ('th' as const) : ('en' as const)
	};
};
