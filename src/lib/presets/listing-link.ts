import { resolve } from '$app/paths';
import type { Locale } from '../catalog';

export function presetListingHref(id: string, locale: Locale, theme: string) {
	const listingTheme =
		theme === 'large-print'
			? 'large'
			: theme === 'minimal' || theme === 'vibrant'
				? theme
				: 'standard';
	return resolve(`/product/[id]?lang=${locale}&theme=${listingTheme}`, { id });
}
