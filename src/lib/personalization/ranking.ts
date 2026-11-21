import { categories, getShop, specs, type Product } from '../catalog';
import { priorities, type ShopperPlan } from './plan';

export function matchesQuery(product: Product, query: string): boolean {
	const shop = getShop(product.shopId);
	const fields = [
		product.name.en,
		product.name.th,
		categories[product.category].en,
		categories[product.category].th,
		shop?.name.en,
		shop?.name.th,
		...product.tags
	];
	const text = fields.join(' ').normalize('NFKC').toLowerCase();
	// Accept the common singular in searches for a category labelled “Gaming mice”.
	const searchable = product.category === 'mouse' ? `${text} mouse` : text;
	return query
		.normalize('NFKC')
		.toLowerCase()
		.trim()
		.split(/\s+/u)
		.every((word) => searchable.includes(word));
}

export function rankProducts(products: readonly Product[], plan: ShopperPlan) {
	const eligible = products.filter(
		(product) =>
			(!plan.category || product.category === plan.category) &&
			(plan.maxPrice === null || product.price <= plan.maxPrice) &&
			(!plan.shops.length || plan.shops.includes(product.shopId)) &&
			(!plan.mallOnly || getShop(product.shopId)?.mall === true) &&
			matchesQuery(product, plan.query)
	);
	const normalized = (
		key: string,
		read: (product: Product) => number | undefined,
		lower: boolean,
		weight: number
	) => {
		const values = eligible.map(read).filter((value): value is number => value !== undefined);
		const min = Math.min(...values);
		const max = Math.max(...values);
		return (product: Product) => {
			const value = read(product);
			const ratio =
				value === undefined
					? 0
					: max === min
						? 1
						: lower
							? (max - value) / (max - min)
							: (value - min) / (max - min);
			return { key, contribution: ratio * weight };
		};
	};

	const measures = priorities.flatMap((key) => {
		const weight = plan.priorities[key] ?? 0;
		if (!weight) return [];
		if (key === 'price' || key === 'rating') {
			return [normalized(key, (product) => product[key], key === 'price', weight)];
		}
		return [(product: Product) => ({ key, contribution: product.scores[key] * weight })];
	});
	for (const key of Object.keys(
		plan.specPreferences
	).sort() as (keyof ShopperPlan['specPreferences'])[]) {
		const direction = plan.specPreferences[key];
		if (!direction) continue;
		measures.push(
			normalized(
				key,
				(product) => {
					if (!specs[product.category].some((spec) => spec.key === key && spec.direction))
						return undefined;
					const value = product.specs[key];
					return typeof value === 'number' ? value : undefined;
				},
				direction === 'lower',
				1
			)
		);
	}

	const rows = eligible.map((product) => {
		const terms = measures
			.map((measure) => measure(product))
			.sort((a, b) => b.contribution - a.contribution);
		return { product, terms, score: terms.reduce((sum, term) => sum + term.contribution, 0) };
	});
	rows.sort(
		(a, b) =>
			b.score - a.score ||
			(getShop(b.product.shopId)?.rating ?? 0) - (getShop(a.product.shopId)?.rating ?? 0) ||
			a.product.name.en.localeCompare(b.product.name.en, 'en') ||
			a.product.id.localeCompare(b.product.id, 'en')
	);
	return (plan.simplified ? rows.slice(0, 3) : rows).map(({ product, terms }) => ({
		product,
		terms
	}));
}
