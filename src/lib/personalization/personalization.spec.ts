import { describe, expect, it } from 'vitest';
import { products } from '../catalog';
import { defaultPlan, interpretOffline, rankProducts, validateProposal } from './index';

describe('offline shopping', () => {
	it('makes the existing gaming-mouse store minimal and spec first', () => {
		const turn = interpretOffline('ขอแบบเรียบๆ ดูสเปกก่อน', { ...defaultPlan, query: 'gaming mouse' });
		expect(turn).toMatchObject({
			intent: 'change',
			patch: { theme: 'minimal', layout: 'table', details: ['specs', 'price', 'rating', 'shop'] }
		});
		expect(turn.patch.query).toBeUndefined();
	});

	it('sets up a readable Thai rice-cooker shortlist for family', () => {
		const turn = interpretOffline('ซื้อของขวัญให้แม่ หม้อหุงข้าว ใช้ง่ายๆ', defaultPlan);
		expect(turn.patch).toMatchObject({
			theme: 'large-print',
			locale: 'th',
			category: 'rice-cooker',
			simplified: true,
			sections: ['top-picks', 'what-matters', 'best-deal', 'share', 'products']
		});
		expect(rankProducts(products, { ...defaultPlan, ...turn.patch })).toHaveLength(3);
	});

	it('composes a comparison with reviews for a gym shopper', () => {
		const turn = interpretOffline('earbuds for the gym, compare the top 3', defaultPlan);
		expect(turn.patch).toMatchObject({
			category: 'earbuds',
			sections: ['compare', 'reviews', 'products']
		});
		const ranked = rankProducts(products, { ...defaultPlan, ...turn.patch });
		expect(ranked.length).toBeGreaterThan(3);
		expect(ranked.every(({ product }) => product.category === 'earbuds')).toBe(true);
	});

	it('uses the same battery and weight terms to rank and explain Aero X first', () => {
		const current = {
			...defaultPlan,
			query: 'gaming mouse'
		};
		const turn = interpretOffline(
			'I care about battery and light weight, under 1500 baht',
			current
		);
		const plan = { ...current, ...turn.patch };
		const ranked = rankProducts(products, plan);
		expect(ranked).toHaveLength(3);
		expect(ranked[0].product.name.en).toContain('Aero X');
		expect(ranked[0].terms.map(({ key }) => key)).toEqual(
			expect.arrayContaining(['battery', 'weight'])
		);
		expect(rankProducts([...products].reverse(), plan)).toEqual(ranked);
	});

	it.each([
		['ขอ earbuds งบ ๑,๕๐๐', 1500],
		['mouse within 1.5k', 1500],
		['mouse no more than 1,500', 1500],
		['ขอแบบ งบ 2 พัน', 2000],
		['หม้อหุงข้าว 2 ลิตร', undefined],
		['power bank under 65W', undefined],
		['power bank under 65 Wh', undefined],
		['earbuds below 5 stars', undefined],
		['งบไม่ต่ำกว่า 500', undefined],
		['ซื้อให้แม่ อายุ 65', undefined]
	])('reads a price ceiling only when appropriate in %s', (message, budget) => {
		expect(interpretOffline(message, defaultPlan).patch.maxPrice).toBe(budget);
	});

	it('cites the focused product battery and leaves the store unchanged', () => {
		const product = products.find(({ name }) => name.en.includes('Aero X'))!;
		expect(
			interpretOffline('does the battery last all day?', defaultPlan, product.id)
		).toMatchObject({
			intent: 'ask',
			patch: {},
			citations: [{ productId: product.id, field: 'spec.battery' }]
		});
		expect(interpretOffline('is it waterproof?', defaultPlan, product.id)).toMatchObject({
			intent: 'ask',
			patch: {},
			citations: [],
			reply: 'I can’t confirm that from the listing.'
		});
	});

	it('resolves a named product from a punctuated question', () => {
		const product = products.find(({ name }) => name.en.includes('Aero X'))!;
		expect(interpretOffline('Battery life on the Aero X?', defaultPlan)).toMatchObject({
			intent: 'ask',
			citations: [{ productId: product.id, field: 'spec.battery' }]
		});
	});

	it('resolves deal requests without a restyle or rerank', () => {
		expect(
			interpretOffline('cheapest way to get this?', defaultPlan, 'cooker-one-button')
		).toMatchObject({
			intent: 'deal',
			patch: {},
			productIds: ['cooker-one-button']
		});
	});
});

describe('proposal validation', () => {
	it('keeps allowlisted siblings while rejecting creative fields and model numbers', () => {
		expect(
			validateProposal(
				{
					intent: 'change',
					patch: {
						theme: 'minimal',
						layout: 'carousel',
						details: ['price', 'invented'],
						sections: ['reviews', 'fake'],
						maxPrice: 1,
						productOrder: ['bad'],
						query: 'no matching product'
					},
					reply: 'It costs ๑ baht.'
				},
				defaultPlan
			)
		).toMatchObject({
			intent: 'change',
			patch: { theme: 'minimal', details: ['price'], sections: ['reviews', 'products'] },
			dropped: ['layout', 'details', 'sections', 'maxPrice', 'unknown-field', 'query'],
			guarded: true
		});
	});

	it.each(['١', '１', '₹', 'THB', 'บาท', 'USD', '<span>'])(
		'guards a reply containing %s',
		(unsafe) => {
			expect(
				validateProposal({ intent: 'chat', reply: 'A'.repeat(200) + unsafe }, defaultPlan).guarded
			).toBe(true);
		}
	);

	it('does not permit a question to edit the store or cite a foreign listing or a price', () => {
		expect(
			validateProposal(
				{
					intent: 'ask',
					patch: { theme: 'minimal' },
					citations: [
						{ productId: 'cooker-one-button', field: 'spec.power' },
						{ productId: 'cooker-one-button', field: 'price' },
						{ productId: 'unseen', field: 'spec.capacity' }
					]
				},
				defaultPlan,
				'cooker-one-button'
			)
		).toMatchObject({
			intent: 'ask',
			patch: {},
			citations: [{ productId: 'cooker-one-button', field: 'spec.power' }]
		});
	});
});
