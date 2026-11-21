import artifact from './cnn-weights.json';
import { type ShopperPlan } from './plan';
import { validateProposal } from './turn';

export const interview = artifact.interview;
export type Question = 'goal' | 'evidence' | 'priority' | 'reading';
export type Answers = Partial<Record<Question, string>>;
export type ProposalSources = Partial<Record<keyof ShopperPlan, 'cnn' | 'answer'>>;
export type Backend = 'cnn' | 'direct' | 'incomplete' | 'unavailable';
export type Head = keyof typeof artifact.heads;
export type Prediction = {
	logits: Record<Head, number[]>;
	labels: Record<Head, string>;
	themeScore: number;
};
const questions: Question[] = ['goal', 'evidence', 'priority', 'reading'];
const weights = artifact.weights as Record<string, unknown>;

export function sanitizeAnswers(raw: unknown): Answers {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
	const record = raw as Record<string, unknown>;
	return Object.fromEntries(
		interview.questions.flatMap((q) =>
			q.options.some((option) => option.id === record[q.id]) ? [[q.id, record[q.id]]] : []
		)
	);
}

function vector(raw: unknown, size: number): number[] {
	if (
		!Array.isArray(raw) ||
		raw.length !== size ||
		!raw.every((n) => typeof n === 'number' && Number.isFinite(n))
	)
		throw new Error('Invalid model tensor');
	return raw as number[];
}

// PyTorch Conv1d uses cross-correlation: kernel position k reads p + k - padding.
function conv(input: number[][], name: string, channels: number): number[][] {
	const w = weights[`${name}.weight`] as unknown[][];
	const b = vector(weights[`${name}.bias`], channels);
	if (!Array.isArray(w) || w.length !== channels) throw new Error('Invalid convolution');
	return w.map((raw, out) => {
		if (!Array.isArray(raw) || raw.length !== input.length) throw new Error('Invalid channels');
		const kernels = raw.map((kernel) => vector(kernel, 3));
		return Array.from({ length: 4 }, (_, p) => {
			let sum = b[out];
			for (let c = 0; c < input.length; c++)
				for (let k = 0; k < 3; k++) sum += kernels[c][k] * (input[c][p + k - 1] ?? 0);
			return Math.max(0, sum);
		});
	});
}

function linear(input: number[], name: string, size: number): number[] {
	const w = weights[`${name}.weight`];
	const b = vector(weights[`${name}.bias`], size);
	if (!Array.isArray(w) || w.length !== size) throw new Error('Invalid dense layer');
	return w.map((row, i) =>
		vector(row, input.length).reduce((sum, value, j) => sum + value * input[j], b[i])
	);
}

/** Runs the exported trained CNN, not a lookup of precomputed answer combinations. */
export function inferInterview(raw: unknown): Prediction {
	const answers = sanitizeAnswers(raw);
	if (Object.keys(answers).length !== 4) throw new Error('Incomplete interview');
	const input = Array.from({ length: 20 }, () => [0, 0, 0, 0]);
	interview.questions.forEach((q, p) => {
		input[16 + p][p] = 1;
		input[4 * p + q.options.findIndex((o) => o.id === answers[q.id as Question])][p] = 1;
	});
	const combined = conv(conv(input, 'conv1', 16), 'conv2', 24);
	const latent = linear(combined.flat(), 'dense', 32).map((n) => Math.max(0, n));
	const logits = Object.fromEntries(
		Object.entries(artifact.heads).map(([key, values]) => [
			key,
			vector(linear(latent, `heads.${key}`, values.length), values.length)
		])
	) as Prediction['logits'];
	const labels = Object.fromEntries(
		Object.entries(artifact.heads).map(([key, values]) => {
			const scores = logits[key as Head];
			return [key, values[scores.indexOf(Math.max(...scores))]];
		})
	) as Prediction['labels'];
	const maximum = Math.max(...logits.theme);
	const exp = logits.theme.map((n) => Math.exp(n - maximum));
	return { logits, labels, themeScore: Math.max(...exp) / exp.reduce((a, b) => a + b, 0) };
}

export function interviewProposal(
	raw: unknown,
	plan: ShopperPlan,
	options: { directOnly?: boolean; themeLocked?: boolean; infer?: typeof inferInterview } = {}
) {
	const answers = sanitizeAnswers(raw);
	const patch: Record<string, unknown> = {};
	const sources: ProposalSources = {};
	const rejected: string[] = [];
	if (answers.goal) {
		patch.layout = { browse: 'grid', compare: 'table', shortlist: 'list', gift: 'grid' }[
			answers.goal
		];
		patch.sections = artifact.sections[answers.goal as keyof typeof artifact.sections];
	}
	if (answers.evidence)
		patch.details = artifact.details[answers.evidence as keyof typeof artifact.details];
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
	}
	for (const field of Object.keys(patch)) sources[field as keyof ShopperPlan] = 'answer';
	let backend: Backend = options.directOnly ? 'direct' : 'incomplete';
	let prediction: Prediction | null = null;
	if (!options.directOnly && questions.every((q) => answers[q])) {
		try {
			prediction = (options.infer ?? inferInterview)(answers);
			backend = 'cnn';
			// Decode independent classification heads into fixed presentation recipes.
			// A rejected head keeps its direct-answer fallback; other heads still apply.
			for (const head of ['layout', 'details', 'sections'] as const) {
				const label = prediction.labels[head];
				if (!(artifact.heads[head] as readonly string[]).includes(label)) {
					rejected.push(head);
					continue;
				}
				patch[head] =
					head === 'details'
						? artifact.details[label as keyof typeof artifact.details]
						: head === 'sections'
							? artifact.sections[label as keyof typeof artifact.sections]
							: label;
				sources[head] = 'cnn';
			}
			if (
				!options.themeLocked &&
				!patch.theme &&
				prediction.themeScore >= 0.8 &&
				prediction.labels.theme !== 'large-print'
			) {
				patch.theme = prediction.labels.theme;
				sources.theme = 'cnn';
			}
		} catch {
			backend = 'unavailable';
		}
	}
	// Theme accessibility constraints apply regardless of the source of the proposal.
	if ((patch.theme ?? plan.theme) === 'large-print' && patch.density) patch.density = 'spacious';
	const turn = validateProposal({ intent: 'change', patch }, plan);
	return {
		answers,
		backend,
		prediction,
		patch: turn.patch,
		sources,
		dropped: [...rejected, ...turn.dropped]
	};
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
				Object.entries(artifact.details).find(
					([, v]) => JSON.stringify(v) === JSON.stringify(value)
				)?.[0] ?? '';
		if (field === 'sections')
			choice =
				Object.entries(artifact.sections).find(
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
