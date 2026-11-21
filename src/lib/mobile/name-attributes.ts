import type { LocalizedText } from '../catalog-api/types';

export function catalogNameAttributes(
	record: { id: string; name: LocalizedText },
	lang: 'en' | 'th'
) {
	// The synthetic All products filter has no catalog record.
	if (record.id === 'all') return {};
	return {
		'data-fact-key': `${record.id}:name`,
		'data-raw': record.name[lang],
		'data-source': 'catalog'
	};
}
