import type { CatalogPort } from './catalog-port.ts';
import type {
	CardField,
	ChangeLine,
	Density,
	Language,
	Layout,
	Localized,
	Plan,
	PlanPart,
	Priority,
	Section,
	Theme
} from './types.ts';

const l = (en: string, th: string): Localized => ({ en, th });

export const themeLabels: Readonly<Record<Theme, Localized>> = {
	standard: l('Standard', 'มาตรฐาน'),
	minimal: l('Minimal', 'มินิมอล'),
	vibrant: l('Vibrant', 'สีสันสดใส'),
	'large-print': l('Large print', 'ตัวอักษรใหญ่')
};
export const layoutLabels: Readonly<Record<Layout, Localized>> = {
	grid: l('Grid', 'ตาราง'),
	list: l('List', 'รายการ'),
	table: l('Comparison table', 'ตารางเปรียบเทียบ')
};
export const densityLabels: Readonly<Record<Density, Localized>> = {
	compact: l('Compact', 'กระชับ'),
	comfortable: l('Comfortable', 'พอดี'),
	spacious: l('Spacious', 'โปร่ง')
};
export const languageLabels: Readonly<Record<Language, Localized>> = {
	en: l('English', 'ภาษาอังกฤษ'),
	th: l('Thai', 'ภาษาไทย')
};
export const cardFieldLabels: Readonly<Record<CardField, Localized>> = {
	image: l('Image', 'รูปภาพ'),
	price: l('Price', 'ราคา'),
	rating: l('Rating', 'คะแนน'),
	specs: l('Key specs', 'สเปกหลัก'),
	summary: l('Summary', 'สรุป'),
	reviews: l('Reviews', 'รีวิว'),
	shipping: l('Shipping', 'ค่าส่ง'),
	vouchers: l('Vouchers', 'โค้ดส่วนลด'),
	shop: l('Shop', 'ร้านค้า')
};
export const priorityLabels: Readonly<Record<Priority, Localized>> = {
	price: l('Price', 'ราคา'),
	performance: l('Performance', 'ประสิทธิภาพ'),
	durability: l('Durability', 'ความทนทาน'),
	design: l('Design', 'ดีไซน์'),
	rating: l('Rating', 'คะแนนรีวิว'),
	value: l('Value', 'ความคุ้มค่า')
};
export const sectionLabels: Readonly<Record<Section, Localized>> = {
	'top-picks': l('Top picks', 'ตัวเลือกแนะนำ'),
	compare: l('Compare top 3', 'เทียบสามอันดับแรก'),
	'what-matters': l('What matters', 'สิ่งที่ควรดู'),
	reviews: l('What buyers say', 'ผู้ซื้อพูดถึง'),
	'best-deal': l('Best deal', 'ดีลที่ดีที่สุด'),
	share: l('Share with family', 'แชร์ให้ครอบครัว'),
	products: l('Products', 'สินค้า')
};
export const partLabels: Readonly<Record<PlanPart, Localized>> = {
	theme: l('Theme', 'ธีม'),
	layout: l('Layout', 'รูปแบบ'),
	density: l('Spacing', 'ระยะห่าง'),
	language: l('Language', 'ภาษา'),
	cardFields: l('Card details', 'รายละเอียดบนการ์ด'),
	highlightSpecs: l('Highlighted specs', 'สเปกที่เน้น'),
	query: l('Search', 'คำค้นหา'),
	priorities: l('Ranking', 'การจัดอันดับ'),
	specPrefs: l('Spec preferences', 'สเปกที่ให้ความสำคัญ'),
	'filters.category': l('Category', 'หมวดหมู่'),
	'filters.maxPrice': l('Budget', 'งบประมาณ'),
	'filters.shops': l('Shops', 'ร้านค้า'),
	'filters.mallOnly': l('Mall shops only', 'เฉพาะร้าน Mall'),
	simplified: l('Fewer choices', 'แสดงน้อยลง'),
	sections: l('Page', 'หน้าเพจ')
};

const join = (items: readonly string[], lang: Language) =>
	lang === 'th' ? items.join(' และ ') : items.join(' and ');

/** Ranking described in words only: the two strongest priorities, never weights. */
export function prioritySummary(priorities: Plan['priorities'], lang: Language): string {
	const top = (Object.entries(priorities) as [Priority, number][])
		.filter(([, weight]) => weight > 0)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, 2)
		.map(([key]) => priorityLabels[key][lang]);
	if (top.length === 0) return lang === 'th' ? 'ไม่ได้จัดลำดับความสำคัญ' : 'No priorities';
	return lang === 'th' ? `เน้น${join(top, lang)}ก่อน` : `${join(top, lang)} first`;
}

function describe(plan: Plan, part: PlanPart, lang: Language, catalog: CatalogPort): string {
	const category = plan.filters.category;
	const specLabel = (key: string) => {
		for (const list of Object.values(catalog.specs)) {
			const found = list.find((definition) => definition.key === key);
			if (found) return found.label[lang];
		}
		return '';
	};
	const on = lang === 'th' ? 'เปิด' : 'On';
	const off = lang === 'th' ? 'ปิด' : 'Off';
	switch (part) {
		case 'theme':
			return themeLabels[plan.theme][lang];
		case 'layout':
			return layoutLabels[plan.layout][lang];
		case 'density':
			return densityLabels[plan.density][lang];
		case 'language':
			return languageLabels[plan.language][lang];
		case 'cardFields':
			return plan.cardFields.map((field) => cardFieldLabels[field][lang]).join(', ');
		case 'highlightSpecs':
			return plan.highlightSpecs.map(specLabel).join(', ') || (lang === 'th' ? 'ไม่มี' : 'None');
		case 'query':
			return plan.query === '' ? (lang === 'th' ? 'ล้างคำค้นหา' : 'Cleared') : 'search';
		case 'priorities':
			return prioritySummary(plan.priorities, lang);
		case 'specPrefs':
			return (
				plan.specPrefs
					.map(
						(pref) =>
							`${specLabel(pref.key)}: ${
								pref.direction === 'higher'
									? lang === 'th'
										? 'ยิ่งมากยิ่งดี'
										: 'higher is better'
									: lang === 'th'
										? 'ยิ่งน้อยยิ่งดี'
										: 'lower is better'
							}`
					)
					.join(', ') || (lang === 'th' ? 'ไม่มี' : 'None')
			);
		case 'filters.category':
			return category ? catalog.categories[category][lang] : lang === 'th' ? 'ทุกหมวด' : 'All';
		case 'filters.maxPrice':
			return plan.filters.maxPrice === null
				? lang === 'th'
					? 'ไม่จำกัดงบ'
					: 'No budget'
				: lang === 'th'
					? 'ตั้งงบแล้ว'
					: 'Budget set';
		case 'filters.shops':
			return (
				plan.filters.shops
					.map((id) => catalog.shops.find((shop) => shop.id === id)?.name[lang] ?? '')
					.join(', ') || (lang === 'th' ? 'ทุกร้าน' : 'All shops')
			);
		case 'filters.mallOnly':
			return plan.filters.mallOnly ? on : off;
		case 'simplified':
			return plan.simplified ? on : off;
		case 'sections':
			return plan.sections.map((section) => sectionLabels[section][lang]).join(', ');
	}
}

/**
 * "What changed", computed from the plan difference in the shopper's language. Never written
 * by the AI. Shopper-typed search words and the budget amount are carried as data
 * (`query`, `amount`) for the UI to format, so the text itself holds no digits.
 */
export function whatChanged(
	after: Plan,
	changed: readonly PlanPart[],
	lang: Language,
	catalog: CatalogPort
): (ChangeLine & { query?: string; amount?: number })[] {
	return changed.map((part) => {
		const line = {
			part,
			text: `${partLabels[part][lang]}: ${describe(after, part, lang, catalog)}`
		};
		if (part === 'query' && after.query !== '')
			return { ...line, text: partLabels.query[lang], query: after.query };
		if (part === 'filters.maxPrice' && after.filters.maxPrice !== null)
			return { ...line, amount: after.filters.maxPrice };
		return line;
	});
}
