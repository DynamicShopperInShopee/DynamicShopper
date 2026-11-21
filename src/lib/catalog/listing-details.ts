import type { FactUnit, Localized } from './types.ts';

export type DetailRow = Readonly<{
	field: string;
	label: Localized;
	raw: number | Localized;
	unit: FactUnit;
}>;

export type ListingReviewMedia = Readonly<{
	reviewField: 'review.0' | 'review.1';
	mediaId: 'rice' | 'controls' | 'serving';
	captionField: string;
}>;

export type ListingDetails = Readonly<{
	features: readonly DetailRow[];
	modes: readonly DetailRow[];
	dimensions: readonly DetailRow[];
	packageItems: readonly DetailRow[];
	highlights: readonly DetailRow[];
	technical: readonly DetailRow[];
	reviewMedia: readonly ListingReviewMedia[];
}>;

function row(
	field: string,
	label: Localized,
	raw: DetailRow['raw'],
	unit: FactUnit = null
): DetailRow {
	return { field, label, raw, unit };
}

const mode = { en: 'Cooking mode', th: 'โหมดการปรุง' };
const part = { en: 'In the box', th: 'อุปกรณ์ในกล่อง' };
const reviewMedia = [
	{
		reviewField: 'review.0',
		mediaId: 'rice',
		captionField: 'detail.media.rice',
		caption: {
			en: 'Simulated review image of cooked rice in the inner pot.',
			th: 'ภาพรีวิวจำลอง ข้าวสุกในหม้อชั้นใน'
		}
	},
	{
		reviewField: 'review.0',
		mediaId: 'serving',
		captionField: 'detail.media.serving',
		caption: {
			en: 'Simulated review image of rice served in a bowl.',
			th: 'ภาพรีวิวจำลอง ข้าวที่ตักใส่ชาม'
		}
	},
	{
		reviewField: 'review.1',
		mediaId: 'controls',
		captionField: 'detail.media.controls',
		caption: {
			en: 'Simulated review image of the digital controls.',
			th: 'ภาพรีวิวจำลอง แผงควบคุมดิจิทัล'
		}
	}
] as const satisfies readonly (ListingReviewMedia & { caption: Localized })[];

const digitalDetails: ListingDetails = {
	features: [
		row('detail.presetHours', { en: 'Preset timer limit', th: 'ตั้งเวลาล่วงหน้าได้สูงสุด' }, 24, 'h'),
		row(
			'detail.coating',
			{ en: 'Inner pot coating', th: 'สารเคลือบหม้อชั้นใน' },
			{ en: 'Non-stick', th: 'เคลือบกันติด' }
		),
		row('detail.heatingAngle', { en: 'Heating coverage', th: 'การกระจายความร้อน' }, 360, 'deg'),
		row(
			'detail.keepWarm',
			{ en: 'Keep warm', th: 'การอุ่นข้าว' },
			{ en: 'Automatic keep-warm', th: 'อุ่นข้าวอัตโนมัติ' }
		),
		row('detail.warningSeconds', { en: 'Overheat warning', th: 'แจ้งเตือนเมื่อร้อนเกิน' }, 3, 's')
	],
	modes: [
		row('detail.mode.boil', mode, { en: 'Boil', th: 'ต้ม' }),
		row('detail.mode.quickCook', mode, { en: 'Quick cook', th: 'หุงด่วน' }),
		row('detail.mode.steam', mode, { en: 'Steam', th: 'นึ่ง' }),
		row('detail.mode.porridge', mode, { en: 'Porridge', th: 'โจ๊ก' }),
		row('detail.mode.soup', mode, { en: 'Soup', th: 'ซุป' }),
		row('detail.mode.stew', mode, { en: 'Stew', th: 'ตุ๋น' }),
		row('detail.mode.yogurt', mode, { en: 'Yogurt', th: 'โยเกิร์ต' }),
		row('detail.mode.cake', mode, { en: 'Cake', th: 'เค้ก' }),
		row('detail.mode.keepWarm', mode, { en: 'Keep warm', th: 'อุ่นข้าว' })
	],
	dimensions: [
		row('detail.width', { en: 'Width', th: 'ความกว้าง' }, 20, 'cm'),
		row('detail.depth', { en: 'Depth', th: 'ความลึก' }, 24.5, 'cm'),
		row('detail.height', { en: 'Height', th: 'ความสูง' }, 21, 'cm'),
		row('detail.weight', { en: 'Weight', th: 'น้ำหนัก' }, 1.7, 'kg')
	],
	packageItems: [
		row('detail.part.cooker', part, { en: 'Rice cooker', th: 'ตัวหม้อหุงข้าว' }),
		row('detail.part.innerPot', part, { en: 'Inner pot', th: 'หม้อชั้นใน' }),
		row('detail.part.ricePaddle', part, { en: 'Rice paddle', th: 'ทัพพีตักข้าว' }),
		row('detail.part.measuringCup', part, { en: 'Measuring cup', th: 'ถ้วยตวง' }),
		row('detail.part.powerCord', part, { en: 'Power cord', th: 'สายไฟ' }),
		row('detail.part.manual', part, { en: 'User manual', th: 'คู่มือการใช้งาน' })
	],
	highlights: [
		row(
			'detail.highlight.mealPlanning',
			{ en: 'Preset cooking', th: 'ตั้งเวลาหุง' },
			{
				en: 'Set the timer to cook ahead. The cooker switches to keep-warm automatically after cooking.',
				th: 'ตั้งเวลาหุงล่วงหน้าได้ เมื่อหุงเสร็จเครื่องจะเข้าสู่โหมดอุ่นข้าวอัตโนมัติ'
			}
		),
		row(
			'detail.highlight.innerPot',
			{ en: 'Inner pot', th: 'หม้อชั้นใน' },
			{
				en: 'Heat circulates around the non-stick inner pot. Use the cooking modes for rice, soup or steamed dishes.',
				th: 'ความร้อนกระจายรอบหม้อชั้นในเคลือบกันติด เลือกโหมดสำหรับหุงข้าว ทำซุป หรือนึ่งอาหารได้'
			}
		),
		row(
			'detail.highlight.overheatWarning',
			{ en: 'Overheat protection', th: 'ระบบป้องกันความร้อนสูงเกิน' },
			{
				en: 'The cooker includes overheat protection and warns when it gets too hot.',
				th: 'เครื่องมีระบบป้องกันความร้อนสูงเกินและแจ้งเตือนเมื่อเครื่องร้อนเกินไป'
			}
		)
	],
	technical: [
		row('detail.model', { en: 'Model', th: 'รุ่น' }, { en: 'DS-D2', th: 'DS-D2' }),
		row(
			'detail.type',
			{ en: 'Type', th: 'ประเภท' },
			{ en: 'Digital rice cooker', th: 'หม้อหุงข้าวดิจิทัล' }
		),
		row(
			'detail.voltage',
			{ en: 'Voltage', th: 'แรงดันไฟฟ้า' },
			{ en: '220–240 V', th: '220–240 โวลต์' }
		)
	],
	reviewMedia: reviewMedia.map(({ reviewField, mediaId, captionField }) => ({
		reviewField,
		mediaId,
		captionField
	}))
};

type DetailValue = Readonly<Pick<DetailRow, 'raw' | 'unit'>>;

const digitalRows = [
	...digitalDetails.features,
	...digitalDetails.modes,
	...digitalDetails.dimensions,
	...digitalDetails.packageItems,
	...digitalDetails.highlights,
	...digitalDetails.technical
];

const digitalFacts = new Map<string, DetailValue>([
	...digitalRows.map(({ field, raw, unit }) => [field, { raw, unit }] as const),
	['detail.packageCount', { raw: digitalDetails.packageItems.length, unit: null }],
	...reviewMedia.map(
		({ captionField, caption }) => [captionField, { raw: caption, unit: null }] as const
	)
]);

export function getListingDetails(productId: string): ListingDetails | undefined {
	return productId === 'cooker-digital' ? digitalDetails : undefined;
}

export function getListingDetailFact(productId: string, field: string): DetailValue | undefined {
	return productId === 'cooker-digital' ? digitalFacts.get(field) : undefined;
}
