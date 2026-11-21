import {
	getProduct,
	products,
	resolveFact,
	shops,
	specs,
	type Locale,
	type SpecKey
} from '../catalog';
import {
	densities,
	details,
	directions,
	layouts,
	locales,
	priorities,
	sections,
	themes,
	type ShopperPlan
} from './plan';
import { matchesQuery } from './ranking';

const intents = ['change', 'ask', 'deal', 'undo', 'reset', 'chat'] as const;
type Citation = { productId: string; field: string };
export type Turn = {
	intent: (typeof intents)[number];
	patch: Partial<ShopperPlan>;
	reply: string;
	citations: Citation[];
	productIds: string[];
	dropped: string[];
	guarded: boolean;
};

const unsafeCopy = /[\p{N}\p{Sc}<>]|\b(?:baht|thb|usd)\b|บาท/iu;
const replies = {
	change: { en: 'I updated the store to match your request.', th: 'ปรับหน้าร้านตามที่ขอแล้ว' },
	ask: { en: 'Here’s what the listing says.', th: 'นี่คือข้อมูลจากหน้าสินค้า' },
	decline: { en: 'I can’t confirm that from the listing.', th: 'ยืนยันเรื่องนี้จากหน้าสินค้าไม่ได้' },
	deal: {
		en: 'I’ll check the best deal for this selection.',
		th: 'จะตรวจสอบดีลที่ดีที่สุดสำหรับสินค้าที่เลือก'
	},
	select: { en: 'Choose a product to check its best deal.', th: 'เลือกสินค้าเพื่อดูดีลที่ดีที่สุด' },
	undo: { en: 'I’ll undo the last change.', th: 'จะย้อนการเปลี่ยนแปลงล่าสุด' },
	reset: { en: 'I’ll reset the store.', th: 'จะคืนหน้าร้านเป็นค่าเริ่มต้น' },
	chat: {
		en: 'Ask me to find products, change the layout, or check a listing.',
		th: 'บอกให้ช่วยหาสินค้า ปรับหน้าร้าน หรือดูข้อมูลสินค้าได้เลย'
	}
};

const record = (value: unknown): Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};

function allow<T>(value: unknown, allowed: readonly T[]): value is T {
	return allowed.includes(value as T);
}

export function validateProposal(candidate: unknown, plan: ShopperPlan, focus?: string): Turn {
	return validateTurn(candidate, plan, focus, plan.locale, false);
}

export function validateTurn(
	candidate: unknown,
	plan: ShopperPlan,
	focus: string | undefined,
	locale: Locale,
	local: boolean
): Turn {
	const input = record(candidate);
	const dropped = new Set<string>();
	const allowedIntents = local
		? intents
		: intents.filter((kind) => kind !== 'undo' && kind !== 'reset');
	const intent = allow(input.intent, allowedIntents) ? input.intent : 'chat';
	if (intent !== input.intent) dropped.add('intent');
	const patch: Partial<ShopperPlan> = {};
	const raw = record(input.patch);
	const category =
		raw.category === null ||
		(typeof raw.category === 'string' && Object.hasOwn(specs, raw.category))
			? (raw.category as ShopperPlan['category'])
			: plan.category;
	const definitions = category ? specs[category] : Object.values(specs).flat();

	function single<T>(key: string, value: unknown, allowed: readonly T[]) {
		if (allow(value, allowed)) return value;
		dropped.add(key);
	}

	function list<T>(key: string, value: unknown, allowed: readonly T[]): T[] | undefined {
		if (!Array.isArray(value)) {
			dropped.add(key);
			return;
		}
		const valid = value.slice(0, 32).filter((item): item is T => allow(item, allowed));
		if (valid.length !== value.length) dropped.add(key);
		return value.length && !valid.length ? undefined : [...new Set(valid)];
	}

	if (intent === 'change') {
		for (const [key, value] of Object.entries(raw)) {
			switch (key) {
				case 'theme':
					patch.theme = single(key, value, themes);
					break;
				case 'layout':
					patch.layout = single(key, value, layouts);
					break;
				case 'density':
					patch.density = single(key, value, densities);
					break;
				case 'locale':
					patch.locale = single(key, value, locales);
					break;
				case 'category':
					if (value === null || value === category) patch.category = category;
					else dropped.add(key);
					break;
				case 'maxPrice':
					if (
						local &&
						(value === null ||
							(typeof value === 'number' && Number.isSafeInteger(value) && value > 0))
					)
						patch.maxPrice = value;
					else dropped.add(key);
					break;
				case 'details': {
					const fields = list(key, value, details);
					if (fields?.length) patch.details = fields;
					else dropped.add(key);
					break;
				}
				case 'sections': {
					const items = list(key, value, sections);
					if (items) patch.sections = items.includes('products') ? items : [...items, 'products'];
					break;
				}
				case 'shops':
					patch.shops = list(
						key,
						value,
						shops.map(({ id }) => id)
					);
					break;
				case 'highlightedSpecs':
					patch.highlightedSpecs = list(
						key,
						value,
						definitions.map(({ key }) => key)
					);
					break;
				case 'mallOnly':
				case 'simplified':
					if (typeof value === 'boolean') patch[key] = value;
					else dropped.add(key);
					break;
				case 'query': {
					const query = typeof value === 'string' ? value.trim() : undefined;
					if (
						query !== undefined &&
						query.length <= 80 &&
						!unsafeCopy.test(query) &&
						(!query ||
							products.some(
								(product) =>
									(!category || product.category === category) && matchesQuery(product, query)
							))
					) {
						patch.query = query;
					} else dropped.add(key);
					break;
				}
				case 'priorities': {
					const weights = local ? {} : { ...plan.priorities };
					let count = 0;
					for (const [priority, proposed] of Object.entries(record(value))) {
						const weight =
							local && typeof proposed === 'number' && Number.isFinite(proposed)
								? Math.max(0, Math.min(1, proposed))
								: proposed === 'first'
									? 1
									: proposed === 'next'
										? 0.5
										: proposed === 'off'
											? 0
											: undefined;
						if (allow(priority, priorities) && weight !== undefined) {
							(weights as ShopperPlan['priorities'])[priority] = weight;
							count++;
						} else dropped.add(key);
					}
					if (
						count ||
						(local && value && typeof value === 'object' && Object.keys(value).length === 0)
					)
						patch.priorities = weights;
					else dropped.add(key);
					break;
				}
				case 'specPreferences': {
					const preferences = { ...plan.specPreferences };
					let count = 0;
					for (const [spec, direction] of Object.entries(record(value))) {
						if (
							definitions.some((definition) => definition.key === spec && definition.direction) &&
							allow(direction, directions)
						) {
							preferences[spec as SpecKey] = direction;
							count++;
						} else dropped.add(key);
					}
					if (count) patch.specPreferences = preferences;
					else dropped.add(key);
					break;
				}
				default:
					dropped.add('unknown-field');
			}
		}
		for (const key of Object.keys(patch) as (keyof ShopperPlan)[]) {
			if (patch[key] === undefined) delete patch[key];
		}
		if (patch.category !== undefined && patch.category !== plan.category) {
			if (patch.query === undefined && plan.query) patch.query = '';
			const known = new Set(definitions.map(({ key }) => key));
			const highlighted = (patch.highlightedSpecs ?? plan.highlightedSpecs).filter((key) =>
				known.has(key)
			);
			const currentPreferences = patch.specPreferences ?? plan.specPreferences;
			const preferences = Object.fromEntries(
				Object.entries(currentPreferences).filter(([key]) => known.has(key as SpecKey))
			);
			if (highlighted.length !== (patch.highlightedSpecs ?? plan.highlightedSpecs).length)
				patch.highlightedSpecs = highlighted;
			if (Object.keys(preferences).length !== Object.keys(currentPreferences).length)
				patch.specPreferences = preferences;
		}
	} else if (input.patch !== undefined) dropped.add('patch');

	const citations: Citation[] = [];
	if (intent === 'ask' && Array.isArray(input.citations)) {
		for (const ref of input.citations.slice(0, 12)) {
			const { productId, field } = record(ref);
			if (
				typeof productId !== 'string' ||
				productId !== focus ||
				typeof field !== 'string' ||
				!/^(?:summary|review\.[01]|spec\.[a-zA-Z]+)$/.test(field) ||
				!resolveFact(productId, field)
			) {
				dropped.add('citations');
			} else if (
				!citations.some((citation) => citation.productId === productId && citation.field === field)
			) {
				citations.push({ productId, field });
			}
		}
	}
	const productIds: string[] = [];
	if (intent === 'deal') {
		if (Array.isArray(input.productIds)) {
			for (const id of input.productIds.slice(0, 10)) {
				if (typeof id === 'string' && getProduct(id)) {
					if (!productIds.includes(id)) productIds.push(id);
				} else dropped.add('productIds');
			}
		}
		if (!productIds.length && focus && getProduct(focus)) productIds.push(focus);
	}

	const template =
		intent === 'ask' && !citations.length
			? 'decline'
			: intent === 'deal' && !productIds.length
				? 'select'
				: intent;
	const reply = replies[template][locale];
	const guarded =
		input.reply !== undefined &&
		(typeof input.reply !== 'string' ||
			unsafeCopy.test(input.reply) ||
			input.reply.trim() !== reply);
	return { intent, patch, reply, citations, productIds, dropped: [...dropped], guarded };
}
