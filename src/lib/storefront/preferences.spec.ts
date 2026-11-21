import { expect, it } from 'vitest';
import { formatBaht } from '../catalog';
import { defaultPlan, type ShopperPlan } from '../personalization/plan';
import { derivePreferenceChips } from './preferences';

it('restores one spec preference at a time', () => {
	const plan: ShopperPlan = {
		...defaultPlan,
		specPreferences: { battery: 'higher', weight: 'lower' }
	};
	const chips = derivePreferenceChips(plan, 'en');
	expect(chips.find(({ id }) => id === 'specPreferences:battery')).toMatchObject({
		label: 'Battery life · Prefer higher',
		patch: { specPreferences: { weight: 'lower' } },
		resetField: false
	});
	expect(derivePreferenceChips({ ...plan, specPreferences: { weight: 'lower' } }, 'th')).toEqual([
		expect.objectContaining({
			label: 'น้ำหนัก · เน้นค่าต่ำ',
			patch: { specPreferences: {} },
			resetField: true
		})
	]);
});

it('restores one shop at a time', () => {
	const plan: ShopperPlan = { ...defaultPlan, shops: ['techhub', 'audiolab'] };
	const [chip] = derivePreferenceChips(plan, 'th');
	expect(chip).toMatchObject({
		label: 'ร้านค้า · ร้านทางการ TechHub',
		patch: { shops: ['audiolab'] },
		resetField: false
	});
});

it('shows saved density, Mall and zero budget differences without active locks', () => {
	const savedPlan = { ...defaultPlan, density: 'compact', mallOnly: true, maxPrice: 0 } as const;
	const chips = derivePreferenceChips(savedPlan, 'en');
	expect(chips).toHaveLength(3);
	expect(chips).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ patch: { density: 'comfortable' }, resetField: true }),
			expect.objectContaining({ patch: { mallOnly: false }, resetField: true }),
			expect.objectContaining({
				label: `Budget · ${formatBaht(0, 'en')}`,
				patch: { maxPrice: null },
				resetField: true
			})
		])
	);
});

it('restores a missing default priority and preserves the other priorities', () => {
	const plan: ShopperPlan = { ...defaultPlan, priorities: { performance: 1, value: 0.5 } };
	const chips = derivePreferenceChips(plan, 'en');
	expect(chips.find(({ id }) => id === 'priorities:rating')).toMatchObject({
		label: 'Ranking · Rating now matters less',
		patch: { priorities: { rating: 1, performance: 1, value: 0.5 } },
		resetField: false
	});
	expect(chips.find(({ id }) => id === 'priorities:performance')).toMatchObject({
		patch: { priorities: { value: 0.5 } },
		resetField: false
	});
	expect(derivePreferenceChips({ ...plan, priorities: { value: 0.5 } }, 'en')[0].resetField).toBe(
		true
	);
	expect(chips.every(({ label }) => !/\d/.test(label))).toBe(true);
});

it('detects reordered display arrays and renders a query as plain text', () => {
	const query = '<em>bag → blue</em>';
	const chips = derivePreferenceChips(
		{ ...defaultPlan, details: [...defaultPlan.details].reverse(), query },
		'en'
	);
	expect(chips).toEqual([
		expect.objectContaining({ patch: { details: defaultPlan.details } }),
		expect.objectContaining({ label: `Search · ${query}`, patch: { query: '' } })
	]);
});

it.each([
	{ locale: 'en', query: 'All products', label: 'Search · All products' },
	{ locale: 'th', query: 'ทุกคำค้น', label: 'คำค้น · ทุกคำค้น' }
] as const)(
	'shows an explicit $locale query equal to its empty-state label',
	({ locale, query, label }) => {
		expect(derivePreferenceChips({ ...defaultPlan, query }, locale)).toEqual([
			{
				id: 'query',
				field: 'query',
				label,
				patch: { query: '' },
				resetField: true
			}
		]);
	}
);
