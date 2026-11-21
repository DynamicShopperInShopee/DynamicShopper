import { describe, expect, it } from 'vitest';
import { continueOfflineInterview, startOfflineInterview } from './interview-offline';

function walk(locale: 'en' | 'th', messages: string[]) {
	let state = startOfflineInterview(locale);
	for (const message of messages) state = continueOfflineInterview(state, message, locale);
	return state;
}

describe('offline interview conversation', () => {
	it('asks the four authored questions and maps spoken answers to allowed IDs', () => {
		const state = walk('en', [
			'I want to compare products',
			'show me the specs',
			'value',
			'large text'
		]);
		expect(state.complete).toBe(true);
		expect(state.answers).toEqual({
			goal: 'compare',
			evidence: 'specs',
			priority: 'value',
			reading: 'large'
		});
		expect(state.reply).not.toMatch(/[\d฿$€£¥]/u);
	});

	it('understands Thai answers and asks again when an answer is not an allowed option', () => {
		let state = startOfflineInterview('th');
		expect(state.reply).toContain('วันนี้อยากเลือกซื้อแบบไหน');
		state = continueOfflineInterview(state, 'ไม่รู้สิ', 'th');
		expect(state.answers).toEqual({});
		expect(state.reply).toContain('วันนี้อยากเลือกซื้อแบบไหน');
		state = continueOfflineInterview(state, 'เปรียบเทียบ', 'th');
		state = continueOfflineInterview(state, 'รีวิว', 'th');
		state = continueOfflineInterview(state, 'คุ้มค่า', 'th');
		state = continueOfflineInterview(state, 'ตัวอักษรใหญ่', 'th');
		expect(state.complete).toBe(true);
		expect(state.answers).toEqual({
			goal: 'compare',
			evidence: 'reviews',
			priority: 'value',
			reading: 'large'
		});
	});

	it('lets a shopper skip the current question or finish early without inventing answers', () => {
		const skipped = walk('en', ['skip', 'skip', 'skip', 'skip']);
		expect(skipped.complete).toBe(true);
		expect(skipped.answers).toEqual({});
		const early = walk('en', ['browse', 'done']);
		expect(early.complete).toBe(true);
		expect(early.answers).toEqual({ goal: 'browse' });
		const quality = walk('en', ['browse', 'photos', 'I value quality', 'compact']);
		expect(quality.answers).toEqual({
			goal: 'browse',
			evidence: 'photos',
			priority: 'durability',
			reading: 'compact'
		});
	});
});
