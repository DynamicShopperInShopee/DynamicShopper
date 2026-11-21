import type { Category, FactUnit, Localized, SpecKey } from './types.ts';

export type SpecDefinition = Readonly<{
	key: SpecKey;
	label: Localized;
	unit: FactUnit;
	direction: 'higher' | 'lower' | null;
}>;

const spec = (
	key: SpecKey,
	en: string,
	th: string,
	unit: FactUnit,
	direction: SpecDefinition['direction']
): SpecDefinition => ({ key, label: { en, th }, unit, direction });

const battery = spec('battery', 'Battery life', 'อายุแบตเตอรี่', 'h', 'higher');
const weight = spec('weight', 'Weight', 'น้ำหนัก', 'g', 'lower');

export const specs: Readonly<Record<Category, readonly SpecDefinition[]>> = {
	mouse: [
		spec('dpi', 'Max DPI', 'ความไวสูงสุด', null, 'higher'),
		weight,
		battery,
		spec('pollingRate', 'Polling rate', 'อัตราการส่งข้อมูล', 'Hz', 'higher'),
		spec('connection', 'Connection', 'การเชื่อมต่อ', null, null)
	],
	earbuds: [
		battery,
		spec('noiseCancelling', 'Noise cancelling', 'การตัดเสียงรบกวน', null, null),
		spec('latency', 'Latency', 'ความหน่วง', 'ms', 'lower'),
		weight
	],
	'power-bank': [
		spec('capacity', 'Capacity', 'ความจุ', 'mAh', 'higher'),
		spec('output', 'Max output', 'กำลังจ่ายสูงสุด', 'W', 'higher'),
		weight
	],
	'rice-cooker': [
		spec('capacity', 'Capacity', 'ความจุ', 'L', 'higher'),
		spec('power', 'Power', 'กำลังไฟ', 'W', 'lower'),
		spec('programs', 'Cooking programs', 'โปรแกรมหุงข้าว', null, 'higher'),
		spec('warranty', 'Warranty', 'การรับประกัน', 'yr', 'higher')
	],
	skincare: [
		spec('volume', 'Volume', 'ปริมาตร', 'ml', 'higher'),
		spec('spf', 'SPF', 'ค่า SPF', null, 'higher'),
		spec('skinType', 'Skin type', 'ประเภทผิว', null, null)
	]
};

export const categories: Readonly<Record<Category, Localized>> = {
	mouse: { en: 'Gaming mice', th: 'เมาส์เกมมิ่ง' },
	earbuds: { en: 'Earbuds', th: 'หูฟังเอียร์บัด' },
	'power-bank': { en: 'Power banks', th: 'พาวเวอร์แบงก์' },
	'rice-cooker': { en: 'Rice cookers', th: 'หม้อหุงข้าว' },
	skincare: { en: 'Skincare', th: 'ผลิตภัณฑ์ดูแลผิว' }
};
