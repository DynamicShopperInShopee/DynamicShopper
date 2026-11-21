import type { Language, Localized } from './types.ts';

export const MAX_REPLY_LENGTH = 280;

/**
 * Fails closed: any digit or numeric character in any script (decimal, circled, fractions,
 * Roman numerals), any currency symbol, the words baht/บาท/THB/USD,
 * or anything that looks like markup. A false alarm costs a blander sentence; a miss would cost
 * the product's promise. Never loosen this to make a reply nicer.
 */
export const FORBIDDEN_REPLY = /[\p{Nd}\p{No}\p{Nl}\p{Sc}<>]|baht|บาท|thb|usd/iu;

const l = (en: string, th: string): Localized => ({ en, th });

export const templates = {
	restyle: l("I've restyled the store to your taste.", 'ปรับหน้าร้านให้ตามที่ต้องการแล้ว'),
	search: l('Here are the products that match.', 'นี่คือสินค้าที่ตรงกับที่ต้องการ'),
	persona: l("I've set the store up for this shopper.", 'จัดหน้าร้านให้เหมาะกับผู้ซื้อคนนี้แล้ว'),
	find_deal: l(
		"Here's the best deal, worked out from the catalog.",
		'นี่คือดีลที่ดีที่สุด คำนวณจากข้อมูลในร้าน'
	),
	deal_pick: l('Which product do you mean?', 'หมายถึงสินค้าชิ้นไหน'),
	reset: l('Back to the standard store.', 'กลับสู่หน้าร้านมาตรฐานแล้ว'),
	undo: l("I've undone the last change.", 'ย้อนการเปลี่ยนแปลงล่าสุดแล้ว'),
	undo_none: l("There's nothing to undo.", 'ไม่มีการเปลี่ยนแปลงให้ย้อน'),
	ask: l("Here's what the listing says.", 'ข้อมูลจากรายละเอียดสินค้ามีดังนี้'),
	ask_decline: l("I can't confirm that from the listing.", 'ไม่สามารถยืนยันเรื่องนี้จากรายละเอียดสินค้าได้'),
	chat: l(
		'I can change how the store looks, find products, compare them, or work out the best deal.',
		'ช่วยปรับหน้าร้าน ค้นหาสินค้า เปรียบเทียบ หรือหาดีลที่ดีที่สุดให้ได้'
	),
	no_change: l("That's already how the store looks.", 'หน้าร้านเป็นแบบนี้อยู่แล้ว')
} as const satisfies Record<string, Localized>;

export type TemplateKey = keyof typeof templates;

export const template = (key: TemplateKey, lang: Language) => templates[key][lang];

function truncate(text: string): string {
	if (text.length <= MAX_REPLY_LENGTH) return text;
	const cut = text.slice(0, MAX_REPLY_LENGTH);
	const space = cut.search(/\s\S*$/);
	return (space > MAX_REPLY_LENGTH / 2 ? cut.slice(0, space) : cut).trimEnd();
}

/** Check first, then cut: a forbidden mark anywhere replaces the whole reply. */
export function guardReply(
	text: unknown,
	fallback: TemplateKey,
	lang: Language
): { text: string; guard: 'passed' | 'replaced' } {
	if (typeof text !== 'string') return { text: template(fallback, lang), guard: 'replaced' };
	const clean = text.normalize('NFC').replace(/\s+/g, ' ').trim();
	if (clean === '' || FORBIDDEN_REPLY.test(clean))
		return { text: template(fallback, lang), guard: 'replaced' };
	return { text: truncate(clean), guard: 'passed' };
}

export const hasThaiScript = (text: string) => /[฀-๿]/u.test(text);
