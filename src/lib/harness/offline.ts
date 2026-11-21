import type { Product } from '../catalog/index.ts';
import type { CatalogPort } from './catalog-port.ts';
import { findBudgets, normalizeNumbers } from './budget.ts';
import { template, hasThaiScript } from './guard.ts';
import { activeCategory, normalizeSections } from './plan.ts';
import type {
	CardField,
	Category,
	Citation,
	Density,
	Language,
	Layout,
	Level,
	Priority,
	Section,
	SpecKey,
	StoreState,
	Theme
} from './types.ts';

/**
 * The envelope both backends produce. The model returns this as JSON; the keyword fallback
 * builds the same shape, so everything after "understand" is identical online and offline.
 */
export type Envelope = {
	intent: string;
	patch?: Record<string, unknown>;
	persona?: string;
	productIds?: string[];
	citations?: { productId: string; kind: string; key: string }[];
	reply?: string;
};

type Terms = readonly (string | RegExp)[];

/** ASCII terms match on word boundaries; Thai terms (no spaces in Thai) match as substrings. */
function has(text: string, terms: Terms): boolean {
	return terms.some((term) => {
		if (term instanceof RegExp) return term.test(text);
		if (/^[a-z0-9][\x20-\x7e]*[a-z0-9]$/i.test(term)) {
			const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(text);
		}
		return text.includes(term);
	});
}

const UNDO: Terms = ['undo', 'go back', 'take that back', 'revert', 'ย้อนกลับ', 'เลิกทำ', 'ย้อน'];
const RESET: Terms = [
	'reset',
	'start over',
	'start again',
	'clear everything',
	'default store',
	'เริ่มใหม่',
	'รีเซ็ต',
	'ล้างทั้งหมด',
	'ค่าเริ่มต้น'
];
const DEAL: Terms = [
	'cheapest way',
	'best deal',
	'best price',
	'final price',
	'total price',
	'voucher',
	'vouchers',
	'coupon',
	'coupons',
	'discount code',
	'promo code',
	'deal',
	'ซื้อยังไงให้ถูก',
	'วิธีที่ถูกที่สุด',
	'ดีล',
	'โค้ดส่วนลด',
	'คูปอง',
	'ใช้โค้ด',
	'ราคาสุทธิ',
	'ราคารวม',
	'ส่วนลด'
];
const MOM: Terms = [
	'mom',
	'mum',
	'mother',
	'my parent',
	'my parents',
	'grandma',
	'grandmother',
	'grandpa',
	'elderly',
	'senior',
	/แม่(?!น)/u,
	'พ่อ',
	'คุณยาย',
	'คุณย่า',
	'ผู้สูงอายุ',
	'คนแก่',
	'ผู้ใหญ่'
];
const QUESTION: Terms = [
	'?',
	'ไหม',
	'มั้ย',
	'หรือเปล่า',
	'หรือไม่',
	'กี่',
	'เท่าไร',
	'เท่าไหร่',
	'ยังไง',
	'อย่างไร',
	/^(?:does|do|is|are|can|will|how|what|which|would|should|has|have)\b/i
];

const CATEGORY_TERMS: Readonly<Record<Category, Terms>> = {
	'power-bank': [
		'power bank',
		'powerbank',
		'portable charger',
		'พาวเวอร์แบงก์',
		'พาวเวอร์แบงค์',
		'แบตสำรอง'
	],
	mouse: ['mouse', 'mice', 'เมาส์'],
	earbuds: ['earbuds', 'earbud', 'earphones', 'earphone', 'headphones', 'headphone', 'หูฟัง'],
	'rice-cooker': ['rice cooker', 'rice cookers', 'หม้อหุงข้าว'],
	skincare: [
		'skincare',
		'skin care',
		'sunscreen',
		'serum',
		'moisturiser',
		'moisturizer',
		'cleanser',
		'สกินแคร์',
		'ครีม',
		'กันแดด',
		'เซรั่ม',
		'บำรุงผิว'
	]
};

const THEME_TERMS: readonly [Theme, Terms][] = [
	[
		'large-print',
		[
			'bigger text',
			'large text',
			'large print',
			'big text',
			'larger font',
			'easy to read',
			'ตัวใหญ่',
			'ตัวหนังสือใหญ่',
			'ตัวอักษรใหญ่',
			'อ่านง่าย'
		]
	],
	['minimal', ['minimal', 'minimalist', 'clean look', 'plain', 'no decoration', 'เรียบ', 'มินิมอล']],
	['vibrant', ['colorful', 'colourful', 'vibrant', 'bright', 'สีสัน', 'สดใส', 'สีสด']],
	['standard', ['standard theme', 'normal look', 'default look', 'ธีมปกติ']]
];
const LAYOUT_TERMS: readonly [Layout, Terms][] = [
	['table', ['table', 'spec table', 'spreadsheet', 'ตาราง']],
	['list', ['list view', 'as a list', 'list', 'แบบรายการ', 'เป็นรายการ']],
	['grid', ['grid', 'cards', 'กริด', 'แบบการ์ด']]
];
const DENSITY_TERMS: readonly [Density, Terms][] = [
	['compact', ['compact', 'dense', 'more per screen', 'tighter', 'กระชับ', 'แน่นๆ']],
	['spacious', ['spacious', 'roomy', 'more space', 'airy', 'โปร่ง', 'ห่างๆ']]
];
const LANGUAGE_TERMS: readonly [Language, Terms][] = [
	['th', ['in thai', 'thai please', 'thai language', 'switch to thai', 'ภาษาไทย', 'เป็นไทย']],
	[
		'en',
		[
			'in english',
			'english please',
			'english language',
			'switch to english',
			'ภาษาอังกฤษ',
			'เป็นอังกฤษ'
		]
	]
];
const SPEC_FIRST: Terms = [
	'spec first',
	'specs first',
	'show specs',
	'show me specs',
	'spec table',
	'สเปกก่อน',
	'สเปคก่อน',
	'ดูสเปก',
	'ดูสเปค'
];
const PICTURES: Terms = ['pictures', 'photos', 'images', 'รูปเยอะ', 'ดูรูป'];
const MALL: Terms = [
	'mall',
	'official store',
	'official stores',
	'official shops',
	'มอลล์',
	'ร้านทางการ',
	'ร้านแท้'
];
const SIMPLIFIED: Terms = [
	'fewer choices',
	'just three',
	'only three',
	'top 3 only',
	'keep it simple',
	'ไม่ต้องเยอะ',
	'แค่สามตัว',
	'แค่ 3 ตัว'
];

const SECTION_TERMS: readonly [Section[], Terms][] = [
	[
		['compare', 'reviews'],
		[
			'compare',
			'comparison',
			'side by side',
			'top 3',
			'top three',
			'เทียบ',
			'เปรียบเทียบ',
			'สามตัวแรก',
			'3 ตัวแรก',
			'3 อันดับ'
		]
	],
	[
		['top-picks', 'best-deal'],
		['best value page', 'best value', 'value page', 'คุ้มที่สุด', 'คุ้มค่าที่สุด']
	],
	[
		['top-picks', 'reviews'],
		['gift', 'present', 'reviews', 'what buyers say', 'ของขวัญ', 'ของฝาก', 'รีวิว']
	]
];
const SHARE: Terms = ['share', 'send it to', 'send to', 'แชร์', 'ส่งให้'];

const PRIORITY_TERMS: readonly [Priority, Terms][] = [
	[
		'price',
		[
			'cheap',
			'cheapest',
			'affordable',
			'inexpensive',
			'low price',
			'budget friendly',
			/ถูก(?!ต้อง)/u,
			'ประหยัด',
			'ไม่แพง'
		]
	],
	[
		'performance',
		['performance', 'powerful', 'high end', 'flagship', 'สเปกแรง', 'แรงๆ', 'ประสิทธิภาพ']
	],
	[
		'durability',
		['durable', 'durability', 'sturdy', 'reliable', 'long lasting', 'ทนทาน', 'แข็งแรง']
	],
	['design', ['design', 'pretty', 'beautiful', 'stylish', 'looks good', 'สวย', 'ดีไซน์', 'น่ารัก']],
	[
		'rating',
		[
			'rating',
			'top rated',
			'highly rated',
			'best reviewed',
			'well reviewed',
			'คะแนน',
			'รีวิวดี',
			'เรตติ้ง'
		]
	],
	['value', ['value', 'worth it', 'bang for', 'คุ้ม']]
];

const SPEC_TERMS: readonly [SpecKey, 'higher' | 'lower', Terms][] = [
	[
		'battery',
		'higher',
		['battery', 'all day', 'long battery', /แบต(?!สำรอง)/u, 'ใช้ได้นาน', 'ทั้งวัน', 'นานๆ']
	],
	[
		'weight',
		'lower',
		['light', 'lightweight', 'light weight', 'ultralight', 'weight', 'เบา', 'น้ำหนัก']
	],
	['capacity', 'higher', ['capacity', 'holds more', 'ความจุ', 'จุเยอะ', 'จุมาก']],
	['latency', 'lower', ['latency', 'low latency', 'lag', 'delay', 'ดีเลย์', 'หน่วง']],
	['dpi', 'higher', ['dpi', 'sensor', 'precise', 'precision', 'แม่นยำ', 'แม่น']],
	['pollingRate', 'higher', ['polling', 'polling rate']],
	[
		'output',
		'higher',
		['fast charging', 'fast charge', 'output', 'laptop', 'ชาร์จเร็ว', 'ชาร์จไว', 'กำลังจ่าย']
	],
	['warranty', 'higher', ['warranty', 'ประกัน']],
	['programs', 'higher', ['programs', 'modes', 'menus', 'โปรแกรม', 'เมนู']],
	['power', 'lower', ['energy saving', 'low power', 'power saving', 'ประหยัดไฟ', 'กินไฟน้อย']],
	['spf', 'higher', ['spf', 'sun protection']],
	['volume', 'higher', ['volume', 'large bottle', 'ขวดใหญ่', 'ปริมาณเยอะ']]
];

/** Topics a listing can answer, by spec key or listing part. Anything else is declined. */
const ASK_TOPICS: readonly [SpecKey | 'reviews' | 'summary', Terms][] = [
	['battery', ['battery', 'charge', 'last all day', 'how long', 'flight', 'แบต', 'นาน', 'ชาร์จ']],
	['weight', ['weight', 'heavy', 'light', 'หนัก', 'เบา', 'น้ำหนัก']],
	['capacity', ['capacity', 'how many', 'how much rice', 'ความจุ', 'กี่ลิตร', 'จุ']],
	['latency', ['latency', 'lag', 'delay', 'ดีเลย์', 'หน่วง']],
	['noiseCancelling', ['noise', 'anc', 'cancel', 'quiet', 'ตัดเสียง', 'เสียงรบกวน']],
	['dpi', ['dpi', 'sensor', 'precise', 'แม่นยำ', 'เซ็นเซอร์']],
	['pollingRate', ['polling']],
	['connection', ['bluetooth', 'wireless', 'connect', 'connection', 'บลูทูธ', 'ไร้สาย', 'เชื่อมต่อ']],
	['output', ['output', 'fast charge', 'laptop', 'watt', 'ชาร์จเร็ว', 'กำลังจ่าย']],
	['warranty', ['warranty', 'guarantee', 'ประกัน']],
	['power', ['power use', 'electricity', 'กินไฟ', 'กำลังไฟ']],
	['programs', ['program', 'programs', 'modes', 'menu', 'โปรแกรม', 'เมนู']],
	['volume', ['volume', 'how big', 'size', 'ปริมาณ', 'ขนาด']],
	['spf', ['spf', 'sun protection', 'uv', 'กันแดด']],
	[
		'skinType',
		['skin type', 'oily', 'dry skin', 'sensitive', 'ผิวมัน', 'ผิวแห้ง', 'ผิวแพ้ง่าย', 'สภาพผิว']
	],
	['reviews', ['review', 'reviews', 'people say', 'buyers say', 'รีวิว', 'คนใช้', 'คนซื้อ']],
	['summary', ['what is it', 'what is this', 'tell me about', 'good for', 'คืออะไร', 'เหมาะกับ']]
];
/** Asked-about properties no listing covers. These decline instead of guessing. */
const UNCOVERED: Terms = [
	'waterproof',
	'water resistant',
	'ipx',
	'ip67',
	'ip68',
	'กันน้ำ',
	'swim',
	'ว่ายน้ำ'
];

function pick<T>(text: string, table: readonly [T, Terms][]): T | undefined {
	return table.find(([, terms]) => has(text, terms))?.[0];
}

function detectCategory(text: string): Category | undefined {
	for (const [category, terms] of Object.entries(CATEGORY_TERMS) as [Category, Terms][])
		if (has(text, terms)) return category;
	return undefined;
}

function namedProducts(text: string, catalog: CatalogPort): string[] {
	return catalog.products
		.filter((product) => {
			const short = product.name.en.split(/\s+/).slice(0, 2).join(' ').toLowerCase();
			return text.includes(short) || text.includes(product.id);
		})
		.map((product) => product.id);
}

function replyLanguage(message: string, state: StoreState, next?: Language): Language {
	if (hasThaiScript(message)) return 'th';
	return next ?? state.plan.language;
}

function citeListing(text: string, shown: readonly Product[], catalog: CatalogPort): Citation[] {
	if (has(text, UNCOVERED)) return [];
	const topic = pick(text, ASK_TOPICS);
	if (!topic) return [];
	const citations: Citation[] = [];
	for (const product of shown) {
		if (topic === 'reviews') {
			citations.push({ productId: product.id, kind: 'review', key: '0' });
			citations.push({ productId: product.id, kind: 'review', key: '1' });
		} else if (topic === 'summary')
			citations.push({ productId: product.id, kind: 'summary', key: 'summary' });
		else if (catalog.specs[product.category].some((definition) => definition.key === topic))
			citations.push({ productId: product.id, kind: 'spec', key: topic });
	}
	return citations;
}

/**
 * The keyword fallback. Synchronous, no network, replies only in fixed templates, so it can
 * never leak a fact. It understands plain Thai, English and mixed phrasing; it misses slang,
 * which is what the AI is for.
 */
export function interpretOffline(
	message: string,
	state: StoreState,
	catalog: CatalogPort,
	shown: readonly Product[]
): Envelope {
	const text = normalizeNumbers(message).toLowerCase().replace(/\s+/g, ' ').trim();
	const lang = replyLanguage(message, state);
	const reply = (key: Parameters<typeof template>[0], language = lang) => template(key, language);

	if (text === '') return { intent: 'chat', reply: reply('chat') };
	if (has(text, UNDO)) return { intent: 'undo', reply: reply('undo') };
	if (has(text, RESET)) return { intent: 'reset', reply: reply('reset') };
	if (has(text, DEAL)) {
		return {
			intent: 'find_deal',
			productIds: namedProducts(text, catalog),
			reply: reply('find_deal')
		};
	}

	const category = detectCategory(text);
	const theme = pick(text, THEME_TERMS);
	const layout = pick(text, LAYOUT_TERMS);
	const density = pick(text, DENSITY_TERMS);
	const language = pick(text, LANGUAGE_TERMS);
	const sectionsHit = SECTION_TERMS.filter(([, terms]) => has(text, terms)).map(
		([sections]) => sections
	);
	const share = has(text, SHARE);
	const specFirst = has(text, SPEC_FIRST);
	const pictures = has(text, PICTURES);
	const priorities = PRIORITY_TERMS.filter(([, terms]) => has(text, terms)).map(([key]) => key);
	const mall = has(text, MALL);
	const simplified = has(text, SIMPLIFIED);
	const budget = findBudgets(message).length > 0;
	const mom = has(text, MOM);

	const presentation =
		!!theme ||
		!!layout ||
		!!density ||
		!!language ||
		sectionsHit.length > 0 ||
		share ||
		specFirst ||
		pictures ||
		simplified;
	const searching = !!category || priorities.length > 0 || mall || budget;

	if (has(text, QUESTION) && !presentation && !searching && !mom) {
		const citations = citeListing(text, shown, catalog);
		return {
			intent: 'ask',
			citations,
			reply: reply(citations.length > 0 ? 'ask' : 'ask_decline')
		};
	}

	const targetCategory = category ?? activeCategory(catalog, state.plan);
	const patch: Record<string, unknown> = {};
	if (category) patch.filters = { category };
	if (mall) patch.filters = { ...(patch.filters as object), mallOnly: true };
	if (theme) patch.theme = theme;
	if (layout) patch.layout = layout;
	if (density) patch.density = density;
	if (language) patch.language = language;
	if (simplified) patch.simplified = true;
	if (specFirst) {
		patch.cardFields = ['specs', 'price', 'rating', 'shop'] satisfies CardField[];
		patch.layout ??= 'table';
	} else if (pictures) {
		patch.cardFields = ['image', 'price', 'summary', 'rating'] satisfies CardField[];
	}
	if (sectionsHit.length > 0 || share) {
		const sections: Section[] = [...(sectionsHit[0] ?? []), ...(share ? (['share'] as const) : [])];
		patch.sections = normalizeSections(sections);
	}
	if (priorities.length > 0)
		patch.priorities = Object.fromEntries(priorities.map((key) => [key, 'high' satisfies Level]));
	const specPrefs = SPEC_TERMS.filter(
		([key, , terms]) =>
			has(text, terms) &&
			!!targetCategory &&
			catalog.specs[targetCategory].some(
				(definition) => definition.key === key && definition.direction
			)
	).map(([key, direction]) => ({ key, direction }));
	if (specPrefs.length > 0) patch.specPrefs = specPrefs;

	if (mom) {
		const extra: Record<string, unknown> = {};
		if (patch.filters) extra.filters = patch.filters;
		if (patch.specPrefs) extra.specPrefs = patch.specPrefs;
		return { intent: 'persona', persona: 'mom', patch: extra, reply: reply('persona', 'th') };
	}
	if (has(text, ['tech minimal']))
		return { intent: 'persona', persona: 'tech', patch, reply: reply('persona') };
	if (has(text, ['visual vibrant']))
		return { intent: 'persona', persona: 'visual', patch, reply: reply('persona') };

	if (Object.keys(patch).length === 0 && !budget) return { intent: 'chat', reply: reply('chat') };
	const intent = presentation ? 'restyle' : 'search';
	const nextLang = replyLanguage(message, state, language);
	return { intent, patch, reply: reply(intent, nextLang) };
}
