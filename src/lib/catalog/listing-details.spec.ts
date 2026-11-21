import { expect, it } from 'vitest';
import * as catalog from './index';

const digitalId = 'cooker-digital';
const anchorId = 'cooker-one-button';

it('keeps the digital capacity and program count in the canonical specs', () => {
	expect(catalog.resolveFact(digitalId, 'spec.capacity')?.raw).toBe(2);
	expect(catalog.resolveFact(digitalId, 'spec.programs')?.raw).toBe(9);
	expect(catalog.getProduct(digitalId)?.name).toEqual({
		en: '2 L digital rice cooker with 9 programs',
		th: 'หม้อหุงข้าวดิจิทัล 2 ลิตร 9 โปรแกรม'
	});
});

it.each([
	['detail.presetHours', 24, 'h', '24 h', '24 ชม.'],
	['detail.heatingAngle', 360, 'deg', '360°', '360 องศา'],
	['detail.warningSeconds', 3, 's', '3 s', '3 วินาที'],
	['detail.width', 20, 'cm', '20 cm', '20 ซม.'],
	['detail.depth', 24.5, 'cm', '24.5 cm', '24.5 ซม.'],
	['detail.height', 21, 'cm', '21 cm', '21 ซม.'],
	['detail.weight', 1.7, 'kg', '1.7 kg', '1.7 กก.'],
	['detail.packageCount', 6, null, '6', '6']
] as const)(
	'formats %s from its numeric raw value in both languages',
	(field, raw, unit, en, th) => {
		const fact = catalog.resolveFact(digitalId, field);
		expect(fact).toEqual({ productId: digitalId, field, raw, unit });
		expect(catalog.formatFact(fact!, 'en')).toBe(en);
		expect(catalog.formatFact(fact!, 'th')).toBe(th);
	}
);

it('exposes catalog rows that all resolve and format in each language', () => {
	const details = catalog.getListingDetails(digitalId);
	expect(details).toBeDefined();
	const { features, modes, dimensions, packageItems, highlights, technical } = details!;
	const rows = [...features, ...modes, ...dimensions, ...packageItems, ...highlights, ...technical];
	expect(new Set(rows.map(({ field }) => field)).size).toBe(rows.length);
	for (const { field, label, raw, unit } of rows) {
		const fact = catalog.resolveFact(digitalId, field);
		expect(fact).toEqual({ productId: digitalId, field, raw, unit });
		for (const locale of ['en', 'th'] as const) {
			expect(label[locale].trim()).not.toBe('');
			const formatted = catalog.formatFact(fact!, locale);
			expect(formatted.trim()).not.toBe('');
			if (typeof raw === 'object') expect(formatted).toBe(raw[locale]);
		}
	}
});

it('matches the modes and package items to their catalog counts', () => {
	const details = catalog.getListingDetails(digitalId);
	expect(details).toBeDefined();
	expect(details!.modes.map(({ field }) => field)).toEqual([
		'detail.mode.boil',
		'detail.mode.quickCook',
		'detail.mode.steam',
		'detail.mode.porridge',
		'detail.mode.soup',
		'detail.mode.stew',
		'detail.mode.yogurt',
		'detail.mode.cake',
		'detail.mode.keepWarm'
	]);
	expect(details!.packageItems.map(({ field }) => field)).toEqual([
		'detail.part.cooker',
		'detail.part.innerPot',
		'detail.part.ricePaddle',
		'detail.part.measuringCup',
		'detail.part.powerCord',
		'detail.part.manual'
	]);
	expect(details!.modes).toHaveLength(Number(catalog.resolveFact(digitalId, 'spec.programs')?.raw));
	expect(details!.packageItems).toHaveLength(
		Number(catalog.resolveFact(digitalId, 'detail.packageCount')?.raw)
	);
});

it('attaches the caption facts to simulated media and existing review excerpts', () => {
	const details = catalog.getListingDetails(digitalId);
	expect(details).toBeDefined();
	expect(details!.reviewMedia.map(({ mediaId }) => mediaId).sort()).toEqual([
		'controls',
		'rice',
		'serving'
	]);
	for (const { reviewField, captionField } of details!.reviewMedia) {
		expect(catalog.resolveFact(digitalId, reviewField)?.raw).toBeDefined();
		const caption = catalog.resolveFact(digitalId, captionField);
		expect(caption).toBeDefined();
		expect(catalog.formatFact(caption!, 'en')).toMatch(/\bsimulated\b/i);
		expect(catalog.formatFact(caption!, 'th')).toContain('จำลอง');
	}
});

it('scopes detail facts to one listing and rejects unknown or inherited paths', () => {
	for (const productId of [anchorId, 'cooker-family', 'unknown', '__proto__', 'constructor']) {
		expect(catalog.getListingDetails(productId)).toBeUndefined();
		expect(catalog.resolveFact(productId, 'detail.width')).toBeUndefined();
	}
	for (const field of [
		'detail',
		'detail.unknown',
		'detail.__proto__',
		'detail.constructor',
		'detail.toString',
		'detail.features.0.raw',
		'detail.mode.0',
		'detail.mode.boil.en',
		'detail.media.valueOf'
	]) {
		expect(catalog.resolveFact(digitalId, field)).toBeUndefined();
	}
});

it('preserves the digital pricing inputs and the distinct one-button listing', () => {
	expect(catalog.getProduct(digitalId)).toMatchObject({ price: 1290, shipping: 50 });
	expect(catalog.getProduct(digitalId)?.originalPrice).toBeUndefined();
	expect(catalog.getProduct(digitalId)?.specs).toMatchObject({ power: 450, warranty: 3 });
	expect(catalog.getProduct(anchorId)).toMatchObject({
		price: 690,
		originalPrice: 890,
		shipping: 50,
		specs: { capacity: 1.8, power: 700, programs: 2, warranty: 2 }
	});
});
