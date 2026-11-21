import { describe, expect, it } from 'vitest';
import { liveChoices, parseLiveHints, projectLiveHints, readLivePatch } from './live';
import { densities, layouts, locales, themes } from './plan';

describe('live presentation boundary', () => {
	it.each([
		['หน้าร้านดูจริงจังไป ขอจอยๆ หน่อย', ['playful']],
		['เปิดมาแล้วตาลาย อยากกวาดตาดูไวๆ', ['overwhelmed', 'quick-scan']],
		['My grandmother has to squint at the small print.', ['older-reader', 'large-text']],
		['Show the specs side by side', ['specs']],
		['Let the photos do the talking', ['imagery']],
		['ขอแบบรายการ ภาษาไทย', ['list-view', 'thai']],
		['Nothing relevant to the display PRIVATE-SENTINEL', []]
	])('projects fixed presentation hints from %s', (message, expected) => {
		expect(projectLiveHints(message)).toEqual(expected);
	});

	it.each([
		'PRIVATE-SENTINEL NovaBrand ฿๑,๒๓๔ จอยๆ',
		'PRIVATE-SENTINEL NovaBrand １２３４ THB จอยๆ',
		'PRIVATE-SENTINEL NovaBrand \\u0031\\u0032 %E0%B8%BF &#36; ٢٠٩ จอยๆ'
	])('sends only the recognized hint from mixed input %s', (message) => {
		expect(JSON.stringify(projectLiveHints(message))).toBe('["playful"]');
	});

	it('bounds projected and parsed hints regardless of repeated or hostile input', () => {
		expect(projectLiveHints('จอยๆ '.repeat(500))).toEqual(['playful']);
		expect(parseLiveHints(['playful', 'specs'])).toEqual(['playful', 'specs']);
		expect(parseLiveHints(['specs', 'playful'])).toEqual(['playful', 'specs']);
		expect(parseLiveHints([])).toEqual([]);
		expect(parseLiveHints(['playful', 'playful'])).toBeNull();
		expect(parseLiveHints(['playful', { raw: 'PRIVATE-SENTINEL' }])).toBeNull();
		expect(parseLiveHints(['playful', '฿๑๒๓'])).toBeNull();
		expect(parseLiveHints(Array(100).fill('playful'))).toBeNull();
		expect(parseLiveHints(Array(1))).toBeNull();
		expect(parseLiveHints('playful')).toBeNull();
	});

	it('reuses plan choices and reads valid fields beside invalid fields', () => {
		expect(liveChoices).toEqual({
			theme: themes,
			layout: layouts,
			density: densities,
			locale: locales
		});
		expect(
			readLivePatch({
				theme: 'minimal',
				layout: 'PRIVATE-SENTINEL',
				density: 450,
				locale: 'th',
				maxPrice: 450,
				query: 'raw text',
				reply: '฿๔๕๐',
				details: ['price'],
				priorities: { rating: 1 },
				citations: [{ productId: 'product' }]
			})
		).toEqual({ theme: 'minimal', locale: 'th' });
		expect(
			readLivePatch({ theme: 'vibrant', layout: 'grid', density: 'spacious', locale: 'en' })
		).toEqual({ theme: 'vibrant', layout: 'grid', density: 'spacious', locale: 'en' });
		expect(readLivePatch(JSON.parse('{"__proto__":{"theme":"minimal"}}'))).toEqual({});
		expect(readLivePatch(Object.create({ theme: 'minimal' }))).toEqual({});
		expect(readLivePatch(null)).toEqual({});
	});
});
