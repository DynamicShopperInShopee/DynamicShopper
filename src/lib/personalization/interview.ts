import choices from './interview-choices.json';
import { type ShopperPlan } from './plan';
import { validateProposal } from './turn';

export const interview = choices.interview;
export type Question = 'goal' | 'evidence' | 'priority' | 'reading';
export type Answers = Partial<Record<Question, string>>;
export function sanitizeAnswers(raw: unknown): Answers {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
	const record = raw as Record<string, unknown>;
	return Object.fromEntries(
		interview.questions.flatMap((q) =>
			q.options.some((option) => option.id === record[q.id]) ? [[q.id, record[q.id]]] : []
		)
	);
}

export function interviewProposal(raw: unknown, plan: ShopperPlan) {
	const answers = sanitizeAnswers(raw);
	const patch: Record<string, unknown> = {};
	if (answers.goal) {
		patch.layout = { browse: 'grid', compare: 'table', shortlist: 'list', gift: 'grid' }[
			answers.goal
		];
		patch.sections = choices.sections[answers.goal as keyof typeof choices.sections];
	}
	if (answers.evidence)
		patch.details = choices.details[answers.evidence as keyof typeof choices.details];
	if (answers.priority)
		patch.priorities = Object.fromEntries(
			['price', 'performance', 'durability', 'design', 'rating', 'value'].map((key) => [
				key,
				key === answers.priority ? 'first' : 'off'
			])
		);
	if (answers.reading) {
		patch.density = answers.reading === 'large' ? 'spacious' : answers.reading;
		if (answers.reading === 'large') patch.theme = 'large-print';
		else if (plan.theme === 'large-print') patch.theme = 'standard';
	}
	if ((patch.theme ?? plan.theme) === 'large-print' && patch.density) patch.density = 'spacious';
	const turn = validateProposal({ intent: 'change', patch }, plan);
	return { answers, patch: turn.patch, dropped: turn.dropped };
}

const names: Record<string, [string, string]> = {
	locale: ['Language', 'ภาษา'],
	en: ['English', 'อังกฤษ'],
	th: ['Thai', 'ไทย'],
	theme: ['Theme', 'ธีม'],
	layout: ['Layout', 'รูปแบบ'],
	density: ['Spacing', 'ระยะห่าง'],
	details: ['Information', 'ข้อมูล'],
	sections: ['Page sections', 'ส่วนต่าง ๆ ของหน้า'],
	priorities: ['Priority', 'สิ่งสำคัญ'],
	standard: ['Paper', 'กระดาษ'],
	minimal: ['Minimal', 'มินิมอล'],
	vibrant: ['Carbon blue', 'น้ำเงิน'],
	'large-print': ['Large text', 'ตัวอักษรใหญ่'],
	grid: ['Picture grid', 'ตารางรูปสินค้า'],
	list: ['Product list', 'รายการสินค้า'],
	table: ['Comparison view', 'มุมมองเปรียบเทียบ'],
	compact: ['Compact', 'กระชับ'],
	comfortable: ['Balanced', 'พอดี ๆ'],
	spacious: ['More space', 'เว้นระยะมากขึ้น'],
	photos: ['Pictures first', 'ดูรูปก่อน'],
	specs: ['Specs first', 'ดูสเปกก่อน'],
	reviews: ['Reviews first', 'ดูรีวิวก่อน'],
	summary: ['Short summaries', 'สรุปสั้น ๆ'],
	browse: ['Browse products', 'ดูสินค้า'],
	compare: ['Compare products', 'เปรียบเทียบสินค้า'],
	shortlist: ['Help choosing', 'ช่วยคัดสินค้า'],
	gift: ['Gift browsing', 'เลือกของขวัญ'],
	value: ['Value first', 'ความคุ้มค่ามาก่อน'],
	performance: ['Performance first', 'ประสิทธิภาพมาก่อน'],
	durability: ['Durability first', 'ความทนทานมาก่อน'],
	rating: ['Buyer ratings first', 'คะแนนผู้ซื้อมาก่อน']
};
export function preferenceName(value: string, lang: 'en' | 'th'): string {
	return names[value]?.[lang === 'en' ? 0 : 1] ?? '';
}

export function describePatch(patch: Partial<ShopperPlan>, lang: 'en' | 'th') {
	return Object.entries(patch).flatMap(([field, value]) => {
		let choice = typeof value === 'string' ? value : '';
		if (field === 'details')
			choice =
				Object.entries(choices.details).find(
					([, v]) => JSON.stringify(v) === JSON.stringify(value)
				)?.[0] ?? '';
		if (field === 'sections')
			choice =
				Object.entries(choices.sections).find(
					([, v]) => JSON.stringify(v) === JSON.stringify(value)
				)?.[0] ?? '';
		if (field === 'priorities')
			choice = Object.entries(value ?? {}).find(([, v]) => v === 1)?.[0] ?? '';
		const text = preferenceName(choice, lang);
		return text
			? [{ field: field as keyof ShopperPlan, label: preferenceName(field, lang), text }]
			: [];
	});
}
