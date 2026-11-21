import { expect, it } from 'vitest';
import { defaultPlan, personaPlan } from '../personalization/plan';
import { describePlanChanges } from './describePlanChanges';

it('lists effective layout, section and preference transitions in the reply language', () => {
	const next = personaPlan('tech');
	const en = describePlanChanges(defaultPlan, next, 'en');
	expect(en).toContain('Theme · Standard → Minimal');
	expect(en).toContain('Layout · Grid → Table');
	expect(en).toContain('Page sections · Products → What matters, Products');
	expect(en).toContain('Ranking · Performance now matters more');
	const th = describePlanChanges(defaultPlan, next, 'th');
	expect(th).toContain('ธีม · มาตรฐาน → เรียบง่าย');
	expect(th).toContain('รูปแบบ · ตารางการ์ด → ตารางเปรียบเทียบ');
	expect(th).toContain('การจัดลำดับ · ให้ความสำคัญกับประสิทธิภาพมากขึ้น');
});

it('distinguishes shopper budget and spec choices from catalog prices and ranking weights', () => {
	const next = {
		...defaultPlan,
		maxPrice: 1500,
		specPreferences: { battery: 'higher', weight: 'lower' } as const
	};
	expect(describePlanChanges(defaultPlan, next, 'en')).toEqual([
		'Budget · No limit → ฿1,500',
		'Battery life · No preference → Prefer higher',
		'Weight · No preference → Prefer lower'
	]);
	expect(
		describePlanChanges(next, { ...next, priorities: { value: 0.5, rating: 1 } }, 'en')
	).toEqual([]);
	expect(
		describePlanChanges(next, { ...next, priorities: { rating: 0.5, value: 0.7 } }, 'en')
	).toEqual(['Ranking · Rating now matters less', 'Ranking · Value now matters more']);
});

it('names the filters a shopper added or removed and preserves section order', () => {
	const withFilters = {
		...defaultPlan,
		query: 'rice cooker',
		category: 'rice-cooker' as const,
		shops: ['techhub', 'homekrua'] as typeof defaultPlan.shops,
		mallOnly: true,
		sections: ['reviews', 'products'] as typeof defaultPlan.sections
	};
	const lines = describePlanChanges(defaultPlan, withFilters, 'en');
	expect(lines).toContain('Search · All products → rice cooker');
	expect(lines).toContain('Category · All → Rice cookers');
	expect(lines).toContain('Shop type · All → Mall only');
	expect(lines).toContain('Shops · All → บ้านครัว HomeKrua, TechHub Official Store');
	expect(lines).toContain('Page sections · Products → Reviews, Products');
	expect(
		describePlanChanges(withFilters, { ...withFilters, shops: ['homekrua', 'techhub'] }, 'th')
	).toEqual([]);
	expect(describePlanChanges(withFilters, defaultPlan, 'en')).toContain(
		'Category · Rice cookers → All'
	);
});
