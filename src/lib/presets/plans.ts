import type { ShopperPlan } from '../personalization/plan';
import { validateProposal } from '../personalization/turn';
import { copy, type Copy } from './parts';

export type PresetField = 'theme' | 'layout' | 'density' | 'details' | 'sections';
export type PresetPatch = Partial<Pick<ShopperPlan, PresetField>>;
export type ShopPreset = {
	id: string;
	title: Copy;
	description: Copy;
	patch: PresetPatch;
};

/** Authored presentation choices. Product selection, ranking and facts stay with the store. */
export const shopPresets: readonly ShopPreset[] = [
	{
		id: 'everyday-browse',
		title: copy('Everyday browsing', 'เลือกซื้อทั่วไป'),
		description: copy(
			'A balanced picture grid with prices, shops and delivery details.',
			'ตารางภาพที่อ่านง่าย พร้อมราคา ร้านค้า และข้อมูลจัดส่ง'
		),
		patch: {
			theme: 'standard',
			layout: 'grid',
			density: 'comfortable',
			details: ['image', 'price', 'rating', 'shop', 'shipping'],
			sections: ['products']
		}
	},
	{
		id: 'quick-scan',
		title: copy('Quick scan', 'กวาดดูสินค้าเร็ว'),
		description: copy(
			'Compact picture cards keep names, prices and shops easy to scan.',
			'การ์ดภาพกระชับช่วยไล่ดูชื่อ ราคา และร้านค้าได้เร็ว'
		),
		patch: {
			theme: 'minimal',
			layout: 'grid',
			density: 'compact',
			details: ['image', 'price', 'shop'],
			sections: ['products']
		}
	},
	{
		id: 'picture-stories',
		title: copy('Pictures and summaries', 'ดูภาพพร้อมสรุป'),
		description: copy(
			'Roomy picture cards pair catalog images with short listing summaries.',
			'การ์ดภาพโปร่ง ๆ แสดงภาพจากแค็ตตาล็อกคู่สรุปสินค้า'
		),
		patch: {
			theme: 'vibrant',
			layout: 'grid',
			density: 'spacious',
			details: ['image', 'price', 'summary'],
			sections: ['products']
		}
	},
	{
		id: 'review-led-browse',
		title: copy('Read reviews first', 'เริ่มจากรีวิว'),
		description: copy(
			'Read catalog review quotes before browsing cards with ratings and reviews.',
			'อ่านรีวิวจากแค็ตตาล็อกก่อนดูการ์ดที่มีคะแนนและรีวิว'
		),
		patch: {
			theme: 'standard',
			layout: 'grid',
			density: 'comfortable',
			details: ['image', 'price', 'rating', 'reviews'],
			sections: ['reviews', 'products']
		}
	},
	{
		id: 'spec-workbench',
		title: copy('Specification table', 'ตารางเทียบสเปก'),
		description: copy(
			'A compact comparison table for checking catalog specifications side by side.',
			'ตารางเปรียบเทียบกระชับสำหรับตรวจสเปกจากแค็ตตาล็อกทีละคอลัมน์'
		),
		patch: {
			theme: 'minimal',
			layout: 'table',
			density: 'compact',
			details: ['price', 'specs', 'rating', 'shop'],
			sections: ['products']
		}
	},
	{
		id: 'guided-comparison',
		title: copy('Guided comparison', 'เทียบพร้อมแนวทางเลือก'),
		description: copy(
			'Show the current ranking priorities above a spacious specification table.',
			'แสดงสิ่งสำคัญที่ใช้เรียงสินค้าอยู่แล้วเหนือตารางสเปกที่เว้นระยะอ่านง่าย'
		),
		patch: {
			theme: 'standard',
			layout: 'table',
			density: 'spacious',
			details: ['price', 'specs', 'shipping', 'shop'],
			sections: ['what-matters', 'products']
		}
	},
	{
		id: 'compare-then-browse',
		title: copy('Compare, then browse', 'เทียบก่อนเลือกดูต่อ'),
		description: copy(
			'Compare the leading products, then continue through picture and specification cards.',
			'เทียบสินค้าลำดับต้น ๆ แล้วดูการ์ดภาพและสเปกของรายการที่เหลือต่อ'
		),
		patch: {
			theme: 'minimal',
			layout: 'grid',
			density: 'comfortable',
			details: ['image', 'price', 'specs', 'shop'],
			sections: ['compare', 'products']
		}
	},
	{
		id: 'summary-reading',
		title: copy('Read the summaries', 'อ่านสรุปทีละรายการ'),
		description: copy(
			'A calm list gives each listing summary room beside its picture and price.',
			'รายการเรียบง่ายให้พื้นที่อ่านสรุปคู่ภาพและราคาสินค้า'
		),
		patch: {
			theme: 'minimal',
			layout: 'list',
			density: 'spacious',
			details: ['image', 'price', 'summary', 'shop'],
			sections: ['products']
		}
	},
	{
		id: 'spec-reading',
		title: copy('Read the specifications', 'อ่านรายละเอียดสเปก'),
		description: copy(
			'Read catalog specifications and summaries in a list without product images.',
			'อ่านสเปกและสรุปจากแค็ตตาล็อกเป็นรายการโดยไม่แสดงภาพสินค้า'
		),
		patch: {
			theme: 'standard',
			layout: 'list',
			density: 'comfortable',
			details: ['price', 'specs', 'summary', 'shipping'],
			sections: ['products']
		}
	},
	{
		id: 'delivery-check',
		title: copy('Check delivery details', 'ตรวจข้อมูลจัดส่ง'),
		description: copy(
			'A compact list keeps catalog shipping, shops and prices visible without changing filters.',
			'รายการกระชับแสดงค่าจัดส่ง ร้านค้า และราคาจากแค็ตตาล็อก โดยคงตัวกรองเดิม'
		),
		patch: {
			theme: 'standard',
			layout: 'list',
			density: 'compact',
			details: ['price', 'shipping', 'shop'],
			sections: ['products']
		}
	},
	{
		id: 'deal-receipt',
		title: copy('Inspect the deal', 'ตรวจใบคำนวณดีล'),
		description: copy(
			'Show the existing optimizer’s deal receipt above a compact list with voucher details.',
			'ดูใบคำนวณดีลจากระบบเดิมเหนือรายการกระชับพร้อมข้อมูลโค้ดส่วนลด'
		),
		patch: {
			theme: 'minimal',
			layout: 'list',
			density: 'compact',
			details: ['price', 'vouchers', 'shipping', 'shop'],
			sections: ['best-deal', 'products']
		}
	},
	{
		id: 'deal-and-compare',
		title: copy('Deal and specifications', 'ดูดีลคู่ตารางสเปก'),
		description: copy(
			'Inspect the optimizer’s receipt, then compare the catalog in a specification table.',
			'ตรวจใบคำนวณจากระบบราคา แล้วเทียบสินค้าในตารางสเปก'
		),
		patch: {
			theme: 'standard',
			layout: 'table',
			density: 'comfortable',
			details: ['price', 'specs', 'vouchers', 'shipping'],
			sections: ['best-deal', 'products']
		}
	},
	{
		id: 'guided-shortlist',
		title: copy('Start with leading choices', 'เริ่มจากตัวเลือกลำดับต้น'),
		description: copy(
			'Explain current priorities, then show leading choices before the remaining catalog.',
			'อธิบายสิ่งสำคัญที่ตั้งไว้ แล้วแสดงตัวเลือกลำดับต้นก่อนรายการที่เหลือ'
		),
		patch: {
			theme: 'vibrant',
			layout: 'list',
			density: 'comfortable',
			details: ['image', 'price', 'summary', 'rating'],
			sections: ['what-matters', 'top-picks', 'products']
		}
	},
	{
		id: 'gift-discussion',
		title: copy('Choose a gift together', 'ช่วยกันเลือกของขวัญ'),
		description: copy(
			'Browse leading choices and review quotes, with a link to share the presentation.',
			'ดูตัวเลือกลำดับต้นและรีวิว พร้อมลิงก์แชร์รูปแบบการแสดงผล'
		),
		patch: {
			theme: 'vibrant',
			layout: 'grid',
			density: 'comfortable',
			details: ['image', 'price', 'summary', 'reviews', 'shipping'],
			sections: ['top-picks', 'reviews', 'share', 'products']
		}
	},
	{
		id: 'review-and-compare',
		title: copy('Reviews beside the decision', 'ดูรีวิวก่อนเทียบรายละเอียด'),
		description: copy(
			'Read review quotes first, then inspect the full specification table.',
			'อ่านรีวิวก่อน แล้วตรวจตารางสเปกของสินค้าทั้งหมด'
		),
		patch: {
			theme: 'minimal',
			layout: 'table',
			density: 'comfortable',
			details: ['price', 'specs', 'rating', 'reviews'],
			sections: ['reviews', 'products']
		}
	},
	{
		id: 'large-picture-browse',
		title: copy('Large-print picture browsing', 'ดูภาพพร้อมตัวอักษรใหญ่'),
		description: copy(
			'Large text and spacious picture cards make summaries and delivery details easier to read.',
			'ตัวอักษรใหญ่และการ์ดภาพโปร่งช่วยให้อ่านสรุปและข้อมูลจัดส่งได้สะดวก'
		),
		patch: {
			theme: 'large-print',
			layout: 'grid',
			density: 'spacious',
			details: ['image', 'price', 'summary', 'shipping'],
			sections: ['products']
		}
	},
	{
		id: 'large-reading-guide',
		title: copy('Large-print reading guide', 'แนวทางเลือกแบบตัวอักษรใหญ่'),
		description: copy(
			'A spacious list follows an explanation of the shopper’s existing priorities.',
			'รายการเว้นระยะอ่านง่ายต่อจากคำอธิบายสิ่งสำคัญที่ผู้ใช้ตั้งไว้'
		),
		patch: {
			theme: 'large-print',
			layout: 'list',
			density: 'spacious',
			details: ['image', 'price', 'summary', 'shipping', 'shop'],
			sections: ['what-matters', 'products']
		}
	},
	{
		id: 'large-comparison',
		title: copy('Large-print comparison', 'เปรียบเทียบด้วยตัวอักษรใหญ่'),
		description: copy(
			'Compare leading choices before a large-print list of specifications and summaries.',
			'เทียบตัวเลือกลำดับต้นก่อนอ่านรายการสเปกและสรุปด้วยตัวอักษรใหญ่'
		),
		patch: {
			theme: 'large-print',
			layout: 'list',
			density: 'spacious',
			details: ['price', 'specs', 'summary'],
			sections: ['compare', 'products']
		}
	},
	{
		id: 'large-deal-review',
		title: copy('Large-print deal review', 'ตรวจดีลแบบตัวอักษรใหญ่'),
		description: copy(
			'Read the optimizer’s receipt, delivery details and voucher information in large text.',
			'อ่านใบคำนวณดีล ข้อมูลจัดส่ง และโค้ดส่วนลดด้วยตัวอักษรใหญ่'
		),
		patch: {
			theme: 'large-print',
			layout: 'list',
			density: 'spacious',
			details: ['price', 'summary', 'vouchers', 'shipping'],
			sections: ['best-deal', 'products']
		}
	},
	{
		id: 'shared-decision',
		title: copy('Compare and share a view', 'เปรียบเทียบแล้วแชร์มุมมอง'),
		description: copy(
			'Compare leading choices, read their reviews, and share the presentation for discussion.',
			'เทียบตัวเลือกลำดับต้น อ่านรีวิว แล้วแชร์รูปแบบการแสดงผลเพื่อช่วยกันเลือก'
		),
		patch: {
			theme: 'standard',
			layout: 'list',
			density: 'comfortable',
			details: ['image', 'price', 'specs', 'rating', 'shop'],
			sections: ['compare', 'reviews', 'share', 'products']
		}
	}
];

/** Returns a fresh validated presentation patch; does not apply it or change the caller's plan. */
export function presetPatch(id: unknown, plan: ShopperPlan): PresetPatch {
	if (typeof id !== 'string') return {};
	const preset = shopPresets.find((entry) => entry.id === id);
	if (!preset) return {};
	// Select fields explicitly so even an accidental future registry field cannot cross this boundary.
	const { theme, layout, density, details, sections } = preset.patch;
	return validateProposal(
		{ intent: 'change', patch: { theme, layout, density, details, sections } },
		plan
	).patch;
}
