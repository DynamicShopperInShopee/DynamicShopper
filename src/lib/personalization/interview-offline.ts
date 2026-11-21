import { interview, type Answers, type Question } from './interview';

type Locale = 'en' | 'th';

export type OfflineInterviewState = {
	answers: Answers;
	step: number;
	complete: boolean;
	reply: string;
};

const order = interview.questions.map((question) => question.id as Question);

// Extra words a shopper might type instead of the exact option label. They only
// help recognize an authored option; an unknown answer never invents one.
const synonyms: Record<string, string[]> = {
	browse: ['browse', 'look around', 'looking', 'browsing', 'ดูก่อน', 'เดินดู', 'ดูสินค้า'],
	compare: ['compare', 'comparison', 'side by side', 'เทียบ', 'เปรียบเทียบ'],
	shortlist: ['choose', 'pick', 'shortlist', 'help me choose', 'คัด', 'ช่วยเลือก', 'ช่วยคัด'],
	gift: ['gift', 'present', 'ของขวัญ', 'ของฝาก'],
	photos: ['photo', 'photos', 'picture', 'pictures', 'image', 'images', 'รูป', 'รูปสินค้า'],
	specs: ['spec', 'specs', 'specification', 'specifications', 'สเปก', 'รายละเอียด'],
	reviews: ['review', 'reviews', 'feedback', 'รีวิว', 'รีวิวผู้ซื้อ'],
	summary: ['summary', 'summaries', 'short', 'brief', 'สรุป', 'สรุปสั้น'],
	value: ['value', 'price', 'cheap', 'budget', 'คุ้ม', 'คุ้มค่า', 'ราคา', 'ถูก'],
	performance: ['performance', 'speed', 'fast', 'power', 'ประสิทธิภาพ', 'เร็ว'],
	durability: ['durability', 'durable', 'quality', 'ทน', 'ทนทาน', 'คุณภาพ'],
	rating: ['rating', 'ratings', 'stars', 'score', 'คะแนน', 'ดาว'],
	comfortable: ['balanced', 'comfortable', 'normal', 'พอดี', 'ปกติ'],
	compact: ['compact', 'dense', 'tight', 'กระชับ'],
	spacious: ['spacious', 'space', 'roomy', 'เว้นระยะ', 'ห่าง'],
	large: ['large', 'large text', 'large print', 'bigger text', 'big text', 'ตัวใหญ่', 'ตัวอักษรใหญ่']
};

const finishWords = [
	'finish',
	'done',
	"that's all",
	'that is all',
	'no more',
	'enough',
	'stop',
	'จบ',
	'เสร็จ',
	'พอแล้ว',
	'แค่นี้'
];
const skipWords = ['skip', 'next', 'pass', 'ข้าม', 'ถัดไป'];

const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, ' ');

function questionPrompt(step: number, locale: Locale) {
	const question = interview.questions[step];
	if (!question) return '';
	const options = question.options.map((option) => option[locale]).join(', ');
	return locale === 'th' ? `${question.th} (${options})` : `${question.en} (${options})`;
}

function summary(locale: Locale) {
	return locale === 'th'
		? 'ขอบคุณ ฉันบันทึกความชอบของคุณแล้ว ตรวจมุมมองที่เสนอ แล้วกดใช้ได้เลย'
		: 'Thanks, I have your preferences. Review the proposed view, then apply it if it looks right.';
}

function recognized(locale: Locale) {
	return locale === 'th' ? 'รับทราบ' : 'Got it.';
}

function cannotMatch(locale: Locale) {
	return locale === 'th'
		? 'ขออภัย ยังจับคู่คำตอบกับตัวเลือกไม่ได้'
		: 'Sorry, I could not match that to an option.';
}

function matchOption(step: number, message: string): string | null {
	const question = interview.questions[step];
	if (!question) return null;
	const text = normalize(message);
	let best: { id: string; length: number } | null = null;
	for (const option of question.options) {
		const phrases = [option.id, option.en, option.th, ...(synonyms[option.id] ?? [])];
		for (const phrase of phrases) {
			const normalized = normalize(phrase);
			if (!normalized || !text.includes(normalized)) continue;
			if (!best || normalized.length > best.length)
				best = { id: option.id, length: normalized.length };
		}
	}
	return best?.id ?? null;
}

export function startOfflineInterview(locale: Locale): OfflineInterviewState {
	return { answers: {}, step: 0, complete: false, reply: questionPrompt(0, locale) };
}

export function continueOfflineInterview(
	state: OfflineInterviewState,
	message: string,
	locale: Locale
): OfflineInterviewState {
	if (state.complete) return state;
	const text = normalize(message);
	const finish = finishWords.some((word) => text.includes(normalize(word)));
	if (finish) {
		return { ...state, complete: true, reply: summary(locale) };
	}
	const skip = skipWords.some((word) => text.includes(normalize(word)));
	const choice = skip ? null : matchOption(state.step, message);
	if (!choice && !skip) {
		return {
			...state,
			reply: `${cannotMatch(locale)} ${questionPrompt(state.step, locale)}`
		};
	}
	const answers = choice
		? { ...state.answers, [interview.questions[state.step].id]: choice }
		: state.answers;
	const step = state.step + 1;
	if (step >= order.length) {
		return { answers, step, complete: true, reply: summary(locale) };
	}
	const next = questionPrompt(step, locale);
	return {
		answers,
		step,
		complete: false,
		reply: choice ? `${recognized(locale)} ${next}` : next
	};
}
