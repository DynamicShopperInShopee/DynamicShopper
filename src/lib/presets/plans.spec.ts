import { describe, expect, it } from 'vitest';
import { products, shops, specs, vouchers } from '../catalog';
import { defaultPlan, densities, layouts, themes, type ShopperPlan } from '../personalization/plan';
import { validateProposal } from '../personalization/turn';
import { presetPatch, shopPresets } from './plans';

const allowedFields = ['theme', 'layout', 'density', 'details', 'sections'];
const contexts: ShopperPlan[] = ['en', 'th'].flatMap((locale) =>
	[null, ...Object.keys(specs)].map((category) => ({
		...structuredClone(defaultPlan),
		locale: locale as ShopperPlan['locale'],
		category: category as ShopperPlan['category'],
		query: 'my explicit search 123',
		maxPrice: 987,
		shops: [shops[0].id],
		mallOnly: true,
		simplified: true,
		priorities: { durability: 1, price: 0.5 }
	}))
);

describe('authored shop presets', () => {
	it('contains twenty unique configurations with distinct information workflows', () => {
		expect(shopPresets).toHaveLength(20);
		expect(new Set(shopPresets.map(({ id }) => id)).size).toBe(20);
		const patches = shopPresets.map(({ id }) => presetPatch(id, defaultPlan));
		expect(new Set(patches.map((patch) => JSON.stringify(patch))).size).toBe(20);
		// Ignore theme, density and detail order: recoloring or renaming alone is not a new workflow.
		expect(
			new Set(
				patches.map((patch) =>
					JSON.stringify({
						layout: patch.layout,
						details: [...(patch.details ?? [])].sort(),
						sections: patch.sections
					})
				)
			).size
		).toBe(20);
		expect(new Set(patches.map(({ theme }) => theme))).toEqual(new Set(themes));
		expect(new Set(patches.map(({ layout }) => layout))).toEqual(new Set(layouts));
		expect(new Set(patches.map(({ density }) => density))).toEqual(new Set(densities));
		for (const locale of ['en', 'th'] as const)
			expect(new Set(shopPresets.map(({ title }) => title[locale])).size).toBe(20);
	});

	it.each(shopPresets)(
		'$id is bilingual, validates without drops, and always includes price and products',
		(preset) => {
			expect(preset.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
			for (const value of [preset.title, preset.description]) {
				expect(value.en.trim().length).toBeGreaterThan(0);
				expect(value.th.trim().length).toBeGreaterThan(0);
				expect(value.en).not.toBe(value.th);
				expect(value.th).toMatch(/\p{Script=Thai}/u);
			}
			for (const plan of contexts) {
				const validated = validateProposal({ intent: 'change', patch: preset.patch }, plan);
				expect(validated.dropped).toEqual([]);
				expect(validated.patch).toEqual(preset.patch);
				const patch = presetPatch(preset.id, plan);
				expect(patch).toEqual(validated.patch);
				expect(Object.keys(patch).sort()).toEqual([...allowedFields].sort());
				expect(patch.details).toContain('price');
				expect(patch.sections).toContain('products');
				expect(new Set(patch.details).size).toBe(patch.details?.length);
				expect(new Set(patch.sections).size).toBe(patch.sections?.length);
				if (patch.theme === 'large-print') expect(patch.density).toBe('spacious');
				const next = { ...plan, ...patch };
				for (const key of Object.keys(plan) as (keyof ShopperPlan)[])
					if (!allowedFields.includes(key)) expect(next[key]).toEqual(plan[key]);
			}
		}
	);

	it('does not mutate input plans, registries or any canonical catalog records', () => {
		const beforePlans = structuredClone(contexts);
		const beforeCatalog = JSON.stringify({ products, shops, specs, vouchers });
		const beforePresets = structuredClone(shopPresets);
		for (const plan of contexts) {
			for (const { id } of shopPresets) {
				const patch = presetPatch(id, plan);
				// A consuming UI may modify its returned arrays without changing later requests.
				patch.details?.splice(0);
				patch.sections?.splice(0);
				expect(presetPatch(id, plan).details).toContain('price');
				expect(presetPatch(id, plan).sections).toContain('products');
			}
		}
		expect(contexts).toEqual(beforePlans);
		expect(shopPresets).toEqual(beforePresets);
		expect(JSON.stringify({ products, shops, specs, vouchers })).toBe(beforeCatalog);
	});

	it('returns an empty patch for unknown or hostile IDs without coercing them', () => {
		const before = structuredClone(defaultPlan);
		const ids: unknown[] = [
			undefined,
			null,
			true,
			0,
			20,
			NaN,
			'',
			'unknown',
			'__proto__',
			'constructor',
			'EVERYDAY-BROWSE',
			' everyday-browse ',
			'<script>',
			[],
			['everyday-browse'],
			{ id: 'everyday-browse', patch: { price: 1 } },
			Symbol('everyday-browse'),
			{
				toString() {
					throw new Error('IDs must not be coerced');
				}
			}
		];
		for (const id of ids) expect(presetPatch(id, defaultPlan)).toEqual({});
		expect(defaultPlan).toEqual(before);
	});
});
