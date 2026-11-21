import { describe, expect, it } from 'vitest';

import { contractSample } from './contract-sample';

describe('shared contract sample', () => {
	it('pins the bilingual HomeKrua cooker facts', () => {
		expect(contractSample.products).toHaveLength(1);
		expect(contractSample.anchorProduct).toMatchObject({
			id: 'cooker-one-button',
			category: 'rice-cooker',
			shopId: 'homekrua',
			name: {
				en: '1.8L one-button electric rice cooker',
				th: 'หม้อหุงข้าวไฟฟ้าแบบปุ่มเดียว 1.8 ลิตร'
			},
			price: 690,
			originalPrice: 890,
			shipping: 50,
			specs: { capacity: 1.8, warranty: 2 }
		});
		expect(contractSample.visibleFacts).toEqual({
			price: { en: '฿690', th: '690 บาท' },
			originalPrice: { en: '฿890', th: '890 บาท' },
			shipping: { en: '฿50', th: '50 บาท' },
			capacity: { en: '1.8 L', th: '1.8 ลิตร' },
			warranty: { en: '2 yr', th: '2 ปี' }
		});
		expect(contractSample.missingFact).toEqual({
			productId: 'cooker-one-button',
			field: 'spec.temperature',
			expected: undefined
		});
	});

	it('pins one basket, clock and optimizer expectation', () => {
		expect(contractSample.openedAt).toBe(Date.parse('2026-11-21T03:30:00Z'));
		expect(contractSample.basket).toEqual([{ productId: 'cooker-one-button', quantity: 1 }]);
		expect(contractSample.pricingContext).toEqual({
			openedAt: contractSample.openedAt,
			now: contractSample.openedAt,
			coinBalance: 1200
		});
		expect(contractSample.expectedDeal).toMatchObject({
			baseline: 740,
			appliedVouchers: [
				{ code: 'SAVE50', amount: 50 },
				{ code: 'SHIP40', amount: 40 }
			],
			coinsUsed: 65,
			total: 585,
			savings: 155
		});
		expect(contractSample.expectedDeal.items).toEqual([
			{
				productId: 'cooker-one-button',
				quantity: 1,
				shopId: 'homekrua',
				unitPrice: 690,
				subtotal: 690
			}
		]);
		expect(
			contractSample.expectedDeal.unusedVouchers.map(({ code, reason, gap }) => [code, reason, gap])
		).toEqual([
			['MEGA8', 'minimum-spend', 310],
			['KRUA150', 'minimum-spend', 510],
			['SHIP60', 'minimum-spend', 810],
			['FLASH100', 'expired', undefined],
			['AUDIO200', 'no-eligible-item', undefined],
			['GAMER10', 'no-eligible-item', undefined],
			['GLOW15', 'no-eligible-item', undefined],
			['TECH100', 'no-eligible-item', undefined]
		]);
	});

	it('carries the mixed proposal and its fieldwise-safe result', () => {
		expect(contractSample.styleRequest).toBe('ขอแบบเรียบ อ่านง่าย');
		expect(contractSample.mixedProposal).toEqual({
			intent: 'change',
			patch: { theme: 'minimal', sections: ['unknown-section'] },
			reply: 'I updated the store.'
		});
		expect(contractSample.mixedTurn).toMatchObject({
			intent: 'change',
			patch: { theme: 'minimal' },
			trace: { dropped: ['invalid-section'], guarded: false }
		});
		expect(contractSample.openingState.focusProductId).toBe('cooker-one-button');
		expect(contractSample.openingState.cart).toEqual(contractSample.basket);
		expect(contractSample.openingState.explicit.fields).toContain('language');
		expect(contractSample.expectedRankingTerms).toEqual([
			{ kind: 'priority', key: 'value', strength: 'full' }
		]);
		expect(contractSample.questionTurn).toMatchObject({
			intent: 'ask',
			citations: [{ productId: 'cooker-one-button', field: 'spec.capacity' }],
			trace: { backend: 'offline' }
		});
	});
});
