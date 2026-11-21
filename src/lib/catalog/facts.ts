import { getProduct } from './products.ts';
import { getShop } from './shops.ts';
import { specs } from './specs.ts';
import type { Fact, FactUnit, Locale, Localized } from './types.ts';

export function resolveFact(productId: string, field: string): Fact | undefined {
	const product = getProduct(productId);
	if (!product) return undefined;

	const fact = (raw: Fact['raw'] | undefined, unit: FactUnit = null): Fact | undefined =>
		raw === undefined ? undefined : { productId, field, raw, unit };

	switch (field) {
		case 'price':
		case 'originalPrice':
		case 'shipping':
			return fact(product[field], 'baht');
		case 'rating':
		case 'reviewCount':
		case 'sold':
		case 'name':
		case 'summary':
			return fact(product[field]);
		case 'review.0':
			return fact(product.reviews[0]);
		case 'review.1':
			return fact(product.reviews[1]);
		case 'shopRating':
			return fact(getShop(product.shopId)?.rating);
		case 'shop':
			return fact(getShop(product.shopId)?.name);
		default: {
			const definition = specs[product.category].find(({ key }) => field === `spec.${key}`);
			return definition && fact(product.specs[definition.key], definition.unit);
		}
	}
}

const units: Readonly<Record<Exclude<FactUnit, 'baht' | null>, Localized>> = {
	g: { en: 'g', th: 'กรัม' },
	h: { en: 'h', th: 'ชม.' },
	Hz: { en: 'Hz', th: 'เฮิรตซ์' },
	ms: { en: 'ms', th: 'มิลลิวินาที' },
	mAh: { en: 'mAh', th: 'มิลลิแอมป์-ชั่วโมง' },
	W: { en: 'W', th: 'วัตต์' },
	L: { en: 'L', th: 'ลิตร' },
	yr: { en: 'yr', th: 'ปี' },
	ml: { en: 'ml', th: 'มล.' }
};

const numbers = {
	en: new Intl.NumberFormat('en', { maximumFractionDigits: 20 }),
	th: new Intl.NumberFormat('th', { maximumFractionDigits: 20 })
};

export function formatBaht(amount: number, locale: Locale): string {
	const printed = numbers[locale].format(amount);
	return locale === 'th' ? `${printed} บาท` : `฿${printed}`;
}

export function formatFact({ field, raw, unit }: Fact, locale: Locale): string {
	if (typeof raw === 'object') return raw[locale];
	if (typeof raw === 'string') return raw;
	if (field === 'shipping' && raw === 0) return locale === 'th' ? 'ส่งฟรี' : 'Free';

	if (unit === 'baht') return formatBaht(raw, locale);
	const amount = numbers[locale].format(raw);
	return unit ? `${amount} ${units[unit][locale]}` : amount;
}
