import { expect, it } from 'vitest';
import { formatFact, getProduct, resolveFact } from './index';

it('resolves and formats the anchor facts independently in Thai and English', () => {
	const id = 'cooker-one-button';
	expect(getProduct(id)?.name).toEqual({
		en: '1.8L one-button electric rice cooker',
		th: 'หม้อหุงข้าวไฟฟ้าแบบปุ่มเดียว 1.8 ลิตร'
	});
	const examples = [
		['price', 690, 'baht', '฿690', '690 บาท'],
		['originalPrice', 890, 'baht', '฿890', '890 บาท'],
		['shopRating', 4.8, null, '4.8', '4.8'],
		['shipping', 50, 'baht', '฿50', '50 บาท'],
		['spec.capacity', 1.8, 'L', '1.8 L', '1.8 ลิตร'],
		['spec.warranty', 2, 'yr', '2 yr', '2 ปี']
	] as const;
	for (const [field, raw, unit, en, th] of examples) {
		const fact = resolveFact(id, field);
		expect(fact).toEqual({ productId: id, field, raw, unit });
		expect(formatFact(fact!, 'en')).toBe(en);
		expect(formatFact(fact!, 'th')).toBe(th);
	}
});

it('returns undefined for missing records, fields, and inherited keys', () => {
	expect(getProduct('toString')).toBeUndefined();
	expect(resolveFact('missing', 'price')).toBeUndefined();
	expect(resolveFact('cooker-one-button', 'unknown')).toBeUndefined();
	expect(resolveFact('cooker-one-button', '__proto__')).toBeUndefined();
	expect(resolveFact('cooker-one-button', 'spec.toString')).toBeUndefined();
	expect(resolveFact('cooker-one-button', 'review.length')).toBeUndefined();
	expect(resolveFact('aero-x', 'originalPrice')).toBeUndefined();
});

it('formats free shipping while retaining the zero-baht raw value', () => {
	const fact = resolveFact('vortex-w', 'shipping');
	expect(fact).toEqual({ productId: 'vortex-w', field: 'shipping', raw: 0, unit: 'baht' });
	expect(formatFact(fact!, 'en')).toBe('Free');
	expect(formatFact(fact!, 'th')).toBe('ส่งฟรี');
});
