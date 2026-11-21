import { categories, formatBaht, getShop, specs, type Locale, type SpecKey } from '../catalog';
import { priorities, type ShopperPlan } from '../personalization/plan';
import { assistantCopy, rankingTerms, storefrontCopy } from './copy';

const labels = {
	grid: ['Grid', 'ตารางการ์ด'],
	list: ['List', 'รายการ'],
	table: ['Table', 'ตารางเปรียบเทียบ'],
	compact: ['Compact', 'กระชับ'],
	comfortable: ['Comfortable', 'พอดี'],
	spacious: ['Spacious', 'กว้าง'],
	en: ['English', 'อังกฤษ'],
	th: ['Thai', 'ไทย'],
	image: ['Image', 'ภาพ'],
	price: ['Price', 'ราคา'],
	rating: ['Rating', 'คะแนน'],
	specs: ['Specifications', 'สเปก'],
	summary: ['Summary', 'สรุปสินค้า'],
	reviews: ['Reviews', 'รีวิว'],
	shipping: ['Shipping', 'ค่าจัดส่ง'],
	vouchers: ['Vouchers', 'คูปอง'],
	shop: ['Shop', 'ร้านค้า'],
	'top-picks': ['Top picks', 'สินค้าแนะนำ'],
	compare: ['Compare products', 'เทียบสินค้า'],
	'what-matters': ['What matters', 'สิ่งที่ควรดู'],
	'best-deal': ['Best deal', 'ดีลที่ดีที่สุด'],
	share: ['Share', 'แชร์'],
	products: ['Products', 'สินค้า'],
	higher: ['Prefer higher', 'เน้นค่าสูง'],
	lower: ['Prefer lower', 'เน้นค่าต่ำ']
} as const;

const specLabels = new Map(
	Object.values(specs)
		.flat()
		.map(({ key, label }) => [key, label])
);

export function describePlanChanges(
	previous: ShopperPlan,
	next: ShopperPlan,
	locale: Locale
): string[] {
	const th = locale === 'th';
	const label = (id: keyof typeof labels) => labels[id][th ? 1 : 0];
	const none = th ? 'ไม่ระบุ' : 'None';
	const preference = th ? 'ไม่ได้เจาะจง' : 'No preference';
	const list = (items: readonly string[]) => (items.length ? items.join(', ') : none);
	const spec = (key: SpecKey) => specLabels.get(key)?.[locale] ?? key;
	const copy = assistantCopy[locale];
	const store = storefrontCopy[locale];
	const lines: string[] = [];
	function changed(title: string, before: string, after: string) {
		if (before !== after) lines.push(`${title} · ${before} → ${after}`);
	}
	function field(title: string, display: (plan: ShopperPlan) => string) {
		changed(title, display(previous), display(next));
	}

	field(copy.theme, (p) => store[p.theme === 'large-print' ? 'large' : p.theme]);
	field(copy.layout, (p) => label(p.layout));
	field(th ? 'ระยะห่าง' : 'Spacing', (p) => label(p.density));
	field(copy.locale, (p) => label(p.locale));
	field(th ? 'รายละเอียดบนการ์ด' : 'Product card', (p) => list(p.details.map(label)));
	field(th ? 'สเปกที่เน้น' : 'Highlighted specs', (p) => list(p.highlightedSpecs.map(spec)));
	field(copy.query, (p) => p.query || (th ? 'ทุกคำค้น' : 'All products'));
	field(copy.category, (p) => (p.category ? categories[p.category][locale] : store.all));
	field(copy.maxPrice, (p) =>
		p.maxPrice === null ? (th ? 'ไม่จำกัด' : 'No limit') : formatBaht(p.maxPrice, locale)
	);
	field(th ? 'ร้านค้า' : 'Shops', (p) =>
		p.shops.length
			? list([...p.shops].sort().map((id) => getShop(id)?.name[locale] ?? id))
			: store.all
	);
	field(th ? 'ประเภทร้าน' : 'Shop type', (p) =>
		p.mallOnly ? (th ? 'เฉพาะร้าน Mall' : 'Mall only') : store.all
	);
	field(th ? 'ตัวเลือกสินค้า' : 'Selection', (p) =>
		p.simplified ? (th ? 'รายการคัดสรร' : 'Shortlist') : th ? 'สินค้าที่ตรงทั้งหมด' : 'All matches'
	);
	field(th ? 'ส่วนต่าง ๆ ของหน้า' : 'Page sections', (p) => list(p.sections.map(label)));

	for (const key of priorities) {
		const before = previous.priorities[key] ?? 0;
		const after = next.priorities[key] ?? 0;
		if (before === after) continue;
		const [en, thai] = rankingTerms[key];
		lines.push(
			th
				? `${copy.priorities} · ให้ความสำคัญกับ${thai}${after > before ? 'มากขึ้น' : 'น้อยลง'}`
				: `${copy.priorities} · ${en} now matters ${after > before ? 'more' : 'less'}`
		);
	}
	for (const key of [...specLabels.keys()].sort()) {
		const before = previous.specPreferences[key];
		const after = next.specPreferences[key];
		changed(spec(key), before ? label(before) : preference, after ? label(after) : preference);
	}
	return lines;
}
