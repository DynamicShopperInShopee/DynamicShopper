import { describe, expect, it } from 'vitest';
import { defaultCatalog as catalog } from './catalog-port.ts';
import { FORBIDDEN_REPLY, MAX_REPLY_LENGTH, guardReply, templates } from './guard.ts';
import { whatChanged } from './labels.ts';
import { changedParts, mergePlan, personaPatches, standardPlan } from './plan.ts';

describe('R5 · the reply guard fails closed', () => {
	it.each([
		['Only 1290 baht today', 'ASCII digits'],
		['ราคา ๑๒๙๐ เท่านั้น', 'Thai digits'],
		['Price ١٢٣ now', 'Arabic-Indic digits'],
		['Just １２ left', 'full-width digits'],
		['Costs ฿ a little', 'baht sign'],
		['Pay in € please', 'euro sign'],
		['It is cheap in baht', 'the word baht'],
		['ถูกมากเลยบาท', 'the word บาท'],
		['Priced in THB', 'THB'],
		['Priced in usd', 'USD lowercase'],
		['<b>Great</b> pick', 'markup'],
		['Only ① left', 'circled digit'],
		['Save ½ today', 'vulgar fraction'],
		['Chapter Ⅻ deal', 'Roman numeral'],
		['', 'empty']
	])('replaces a reply with %s (%s)', (text) => {
		const result = guardReply(text, 'restyle', 'en');
		expect(result.guard).toBe('replaced');
		expect(result.text).toBe(templates.restyle.en);
	});

	it('passes a clean reply and cuts it at a word boundary', () => {
		expect(guardReply('A calmer store for you.', 'restyle', 'en')).toEqual({
			text: 'A calmer store for you.',
			guard: 'passed'
		});
		const long = 'word '.repeat(200);
		const { text, guard } = guardReply(long, 'chat', 'en');
		expect(guard).toBe('passed');
		expect(text.length).toBeLessThanOrEqual(MAX_REPLY_LENGTH);
		expect(text.endsWith('word')).toBe(true);
	});

	it('checks before cutting: a digit past the cut still replaces the reply', () => {
		const text = `${'calm '.repeat(80)}only 9 left`;
		expect(guardReply(text, 'chat', 'th').text).toBe(templates.chat.th);
	});

	it('replaces non-string replies', () => {
		expect(guardReply({ text: 'hi' }, 'ask', 'th')).toEqual({
			text: templates.ask.th,
			guard: 'replaced'
		});
	});

	it('property: no output of the guard ever contains a forbidden mark', () => {
		let seed = 11;
		const alphabet = 'abc ข ก ๑ 1 ฿ $ < > € baht บาท THB usd ٠ １ . ,'.split(' ');
		for (let i = 0; i < 5000; i++) {
			const text = Array.from(
				{ length: (seed = (seed * 48271) % 2147483647) % 12 },
				() => alphabet[(seed = (seed * 48271) % 2147483647) % alphabet.length]
			).join(' ');
			expect(FORBIDDEN_REPLY.test(guardReply(text, 'restyle', 'en').text)).toBe(false);
		}
	});

	it('no fixed template trips the guard', () => {
		for (const template of Object.values(templates)) {
			expect(FORBIDDEN_REPLY.test(template.en)).toBe(false);
			expect(FORBIDDEN_REPLY.test(template.th)).toBe(false);
		}
	});
});

describe('R17 · "What changed" is computed from the diff, in words', () => {
	it('names every changed part in both languages without digits', () => {
		const after = mergePlan(
			mergePlan(standardPlan, personaPatches.mom, catalog),
			{
				query: 'gaming 2',
				filters: { category: 'mouse', maxPrice: 1500, shops: ['gamerzone'], mallOnly: true },
				highlightSpecs: ['dpi'],
				specPrefs: [{ key: 'battery', direction: 'higher' }]
			},
			catalog
		);
		const changed = changedParts(standardPlan, after);
		expect(changed.length).toBeGreaterThanOrEqual(14);
		for (const lang of ['en', 'th'] as const) {
			const lines = whatChanged(after, changed, lang, catalog);
			expect(lines.map((line) => line.part)).toEqual(changed);
			for (const line of lines) expect(FORBIDDEN_REPLY.test(line.text), line.text).toBe(false);
			expect(lines.find((line) => line.part === 'filters.maxPrice')?.amount).toBe(1500);
			expect(lines.find((line) => line.part === 'query')?.query).toBe('gaming 2');
		}
		expect(whatChanged(after, ['priorities'], 'en', catalog)[0].text).toBe(
			'Ranking: Rating and Durability first'
		);
	});

	it('says nothing when nothing changed', () => {
		expect(whatChanged(standardPlan, [], 'en', catalog)).toEqual([]);
	});
});
