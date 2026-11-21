import { getProduct, products, specs, type Category, type SpecKey } from '../catalog';
import { personaPlan, type ShopperPlan } from './plan';
import { validateTurn, type Turn } from './turn';

const categoryWords: readonly [Category, RegExp][] = [
	['mouse', /\b(?:mous(?:e|es)|mice)\b|เมาส์|เม้าส์/u],
	['earbuds', /\b(?:earbuds?|earphones?|headphones?)\b|หูฟัง/u],
	['power-bank', /\bpower[ -]?banks?\b|พาวเวอร์แบงก์|แบตสำรอง/u],
	['rice-cooker', /\brice[ -]?cookers?\b|หม้อหุงข้าว/u],
	['skincare', /\b(?:skin[ -]?care|sunscreen|serum|moisturi[sz]er)\b|สกินแคร์|ครีมกันแดด|เซรั่ม/u]
];

const specWords: readonly [SpecKey, RegExp][] = [
	['battery', /\bbattery\b|แบต(?:เตอรี่)?/u],
	['weight', /\b(?:weight|lightweight|light weight|lighter)\b|น้ำหนัก|เบา/u],
	['dpi', /\bdpi\b|ความไว/u],
	['pollingRate', /polling rate|อัตราการส่งข้อมูล/u],
	['connection', /\b(?:connection|bluetooth)\b|การเชื่อมต่อ|บลูทูธ/u],
	['noiseCancelling', /\banc\b|noise cancel|ตัดเสียงรบกวน/u],
	['latency', /\blatency\b|ความหน่วง/u],
	['capacity', /\b(?:capacity|litres?|liters?|mah)\b|ความจุ|จุ(?:เท่าไร|เท่าไหร่|กี่|ได้)|ลิตร/u],
	['power', /\b(?:watt(?:s|age)?|power usage)\b|กำลังไฟ|กินไฟ|วัตต์/u],
	['output', /\boutput\b|กำลังจ่าย/u],
	['programs', /\bprograms?\b|โปรแกรม/u],
	['warranty', /\bwarranty\b|รับประกัน/u],
	['spf', /\bspf\b/u],
	['volume', /\bvolume\b|ปริมาตร/u],
	['skinType', /\bskin type\b|ประเภทผิว/u]
];

function budget(message: string): number | undefined {
	const digits = '๐๑๒๓๔๕๖๗๘๙';
	const text = message.replace(/[๐-๙]/gu, (digit) => String(digits.indexOf(digit)));
	if (
		/(?:at least|(?<!no )more than|not (?:under|below|less than)|ไม่ต่ำกว่า|ไม่น้อยกว่า|อย่างน้อย|ตั้งแต่)/u.test(
			text
		)
	)
		return;
	const whole = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?`;
	const amount = `(?<amount>${whole})(?:\\s*(?<multiplier>k\\b|พัน|หมื่น))?`;
	const match =
		new RegExp(
			`(?:(?:\\b(?:under|below|within|up to|budget(?: of)?|no more than)\\b|งบ(?:ไม่เกิน)?|ไม่เกิน|ต่ำกว่า|ไม่ถึง)\\s*(?:฿\\s*)?|฿\\s*)${amount}(?![\\d.,]|\\s*(?:w(?:h|atts?)?\\b|l(?:itres?|iters?)?\\b|g(?:rams?)?\\b|stars?\\b|days?\\b|weeks?\\b|years?\\b|hrs?\\b|hours?\\b|mah\\b|hz\\b|วัตต์|ลิตร|กรัม|ดาว|วัน|ปี|ชั่วโมง|มิลลิแอมป์))`,
			'u'
		).exec(text) ??
		new RegExp(`(?:^|[^\\d.,-])${amount}\\s*(?:baht\\b|thb\\b|บาท|฿)`, 'u').exec(text) ??
		/^(?<amount>\d+(?:\.\d+)?)\s*(?<multiplier>k|พัน|หมื่น)$/u.exec(text);
	if (!match?.groups) return;
	const multiplier = match.groups.multiplier === 'หมื่น' ? 10000 : match.groups.multiplier ? 1000 : 1;
	const value = Number(match.groups.amount.replaceAll(',', '')) * multiplier;
	return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function interpretOffline(message: string, plan: ShopperPlan, focus?: string): Turn {
	const text = message.slice(0, 1000).normalize('NFKC').toLowerCase().trim();
	const locale = /\p{Script=Thai}/u.test(text) ? 'th' : plan.locale;
	const finish = (candidate: unknown, productId = focus) =>
		validateTurn(candidate, plan, productId, locale, true);
	const category = categoryWords.find(([, words]) => words.test(text))?.[0];
	const nameWords = text.replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ');
	const mentioned = products.filter((product) => {
		const english = product.name.en.toLowerCase();
		const thai = product.name.th.toLowerCase();
		const shortEnglish = english.split(/\s+/u).slice(0, 2).join(' ');
		return (
			text.includes(product.id) ||
			text.includes(english) ||
			text.includes(thai) ||
			(shortEnglish.length > 4 &&
				!/^\d/u.test(shortEnglish) &&
				` ${nameWords} `.includes(` ${shortEnglish} `))
		);
	});
	const target =
		mentioned.length === 1
			? mentioned[0]
			: mentioned.length
				? undefined
				: focus
					? getProduct(focus)
					: undefined;
	const interests = specWords.filter(([, words]) => words.test(text)).map(([key]) => key);

	if (/^(?:undo|go back|ย้อนกลับ|ย้อนการเปลี่ยนแปลง)[.!\s]*$/u.test(text))
		return finish({ intent: 'undo' });
	if (/^(?:reset|start over|เริ่มใหม่|คืนค่าเริ่มต้น)[.!\s]*$/u.test(text))
		return finish({ intent: 'reset' });
	if (
		/\b(?:best deal|best price|cheapest (?:way|deal)|stack (?:vouchers|coupons))\b|ดีลที่ดีที่สุด|ราคาดีที่สุด|ถูกที่สุด|ใช้โค้ด/u.test(
			text
		)
	) {
		return finish({ intent: 'deal', productIds: mentioned.map(({ id }) => id) }, target?.id);
	}

	const question =
		/^(?:(?:is|are|does|do|can|will|what|how|which)\b)|[?？]|ไหม|หรือเปล่า|เท่าไร|เท่าไหร่|กี่|นานแค่ไหน/u.test(
			text
		);
	if (question) {
		const listingUsable = target && (!category || category === target.category);
		const unsupported = /waterproof|ipx|กันน้ำ/u.test(text);
		const fields = interests.map((key) => `spec.${key}`);
		if (!fields.length && /\breviews?\b|รีวิว/u.test(text)) fields.push('review.0', 'review.1');
		if (!fields.length && /how (?:easy|simple)|ใช้ง่าย/u.test(text)) fields.push('summary');
		const citations =
			listingUsable && !unsupported ? fields.map((field) => ({ productId: target.id, field })) : [];
		return finish({ intent: 'ask', citations }, target?.id);
	}

	const patch: Partial<ShopperPlan> = {};
	if (category) patch.category = category;
	const ceiling = budget(text);
	if (ceiling !== undefined) patch.maxPrice = ceiling;
	if (
		/\b(?:my mom|for (?:my )?mom|for (?:my )?mother|for (?:my )?mum|mom mode)\b|ให้(?:คุณ)?แม่|โหมดคุณแม่/u.test(
			text
		)
	) {
		const { theme, layout, density, details, locale, simplified, sections, priorities } =
			personaPlan('mom');
		Object.assign(patch, {
			theme,
			layout,
			density,
			details,
			locale,
			simplified,
			sections,
			priorities
		});
	} else {
		if (/\b(?:minimal|clean layout|plain layout)\b|เรียบ|มินิมอล/u.test(text)) {
			const { theme, layout, density, details, sections } = personaPlan('tech');
			Object.assign(patch, { theme, layout, density, details, sections });
		}
		if (/\b(?:colou?rful|vibrant|visual style)\b|สีสัน|สีสด/u.test(text)) {
			const { theme, layout, density, details, sections } = personaPlan('visual');
			Object.assign(patch, { theme, layout, density, details, sections });
		}
		if (
			/\b(?:larger? (?:print|text|font)|big(?:ger)? (?:text|font))\b|ตัวหนังสือใหญ่|ตัวอักษรใหญ่/u.test(
				text
			)
		) {
			patch.theme = 'large-print';
			patch.density = 'spacious';
		}
		if (/\b(?:specs? first|spec table|technical specs)\b|สเป[กค]ก่อน|ดูสเป[กค]/u.test(text)) {
			patch.layout = 'table';
			patch.details = ['specs', 'price', 'rating', 'shop'];
		}
		if (/\b(?:list view|show as a list)\b|แบบรายการ/u.test(text)) patch.layout = 'list';
		if (/\b(?:grid view|show as a grid)\b|แบบตารางการ์ด/u.test(text)) patch.layout = 'grid';
		if (/\bcompact\b|แบบกะทัดรัด/u.test(text)) patch.density = 'compact';
		if (/\b(?:compare|top\s*(?:3|three))\b|เปรียบเทียบ|เทียบสาม|เทียบ\s*๓/u.test(text)) {
			patch.sections = ['compare', 'reviews', 'products'];
		} else if (/\bbest value\b|คุ้มที่สุด|คุ้มค่า/u.test(text)) {
			patch.sections = ['top-picks', 'best-deal', 'products'];
			patch.priorities = { ...plan.priorities, value: 1 };
		} else if (/\b(?:gift|reviews?)\b|ของขวัญ|รีวิว/u.test(text)) {
			patch.sections = ['top-picks', 'reviews', 'products'];
		}
	}
	if (/\b(?:in thai|thai language)\b|ภาษาไทย/u.test(text)) patch.locale = 'th';
	if (/\b(?:in english|english language)\b|ภาษาอังกฤษ/u.test(text)) patch.locale = 'en';
	if (/\bmall (?:shops? )?only\b|เฉพาะร้าน\s*mall/u.test(text)) patch.mallOnly = true;
	if (/\bshare\b|แชร์|ส่งให้ครอบครัว/u.test(text)) {
		patch.sections = [
			...(patch.sections ?? plan.sections).filter(
				(section) => section !== 'products' && section !== 'share'
			),
			'share',
			'products'
		];
	}

	const activeCategory = category ?? plan.category;
	const definitions = activeCategory ? specs[activeCategory] : Object.values(specs).flat();
	const requested = interests.flatMap((key) => {
		const definition = definitions.find((definition) => definition.key === key);
		return definition ? [definition] : [];
	});
	if (requested.length) {
		patch.highlightedSpecs = requested.map(({ key }) => key);
		const weights = Object.fromEntries(
			requested.flatMap(({ key, direction }) => (direction ? [[key, direction]] : []))
		);
		if (Object.keys(weights).length) patch.specPreferences = weights;
	}
	return finish(Object.keys(patch).length ? { intent: 'change', patch } : { intent: 'chat' });
}
