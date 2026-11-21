/**
 * Shopper budgets are read here, locally, and never sent to a model. "งบ 1000", "within 800",
 * "1.5k", "2 พัน", "under 2 thousand" are budgets; "65W", "2 ลิตร", "70 grams", "3 วัน",
 * "below 5 stars" and ages are not; "ไม่ต่ำกว่า 500" and "not less than 1000" are lower bounds
 * and set no cap; "no more than 1500" and "ไม่มากกว่า 800" are caps.
 */

/** The value of a decimal digit in any script (digit blocks are ten wide). */
function digitValue(char: string): number {
	const code = char.codePointAt(0) ?? 0;
	// Mathematical digits sit in five adjacent runs of ten starting at U+1D7CE.
	if (code >= 0x1d7ce && code <= 0x1d7ff) return (code - 0x1d7ce) % 10;
	let zero = code;
	while (zero > code - 9 && /\p{Nd}/u.test(String.fromCodePoint(zero - 1))) zero -= 1;
	return code - zero;
}

/** Every decimal digit in any script becomes ASCII, and thousands separators are removed. */
export function normalizeNumbers(text: string): string {
	return text
		.normalize('NFC')
		.replace(/\p{Nd}/gu, (digit) => (/[0-9]/.test(digit) ? digit : String(digitValue(digit))))
		.replace(/(\d),(?=\d{3}\b)/g, '$1');
}

const THAI = '[\\u0E00-\\u0E7F]';

/**
 * Units that make a number a quantity rather than money. Short Thai units must not run on
 * into another Thai word ("3 วัน" is days; "1290 ตัวไหน" is not a count of pieces).
 */
export const NON_MONEY_UNIT = new RegExp(
	`^(?:w\\b|watts?\\b|วัตต์|ลิตร|l\\b|lit(?:er|re)s?\\b|ml\\b|มล\\.?(?!${THAI})|มิลลิลิตร|g\\b|grams?\\b|กรัม|kg\\b|กิโลกรัม|mah\\b|h\\b|hrs?\\b|hours?\\b|ชั่วโมง|ชม\\.|ชม(?!${THAI})|วัน(?!${THAI})|days?\\b|stars?\\b|ดาว(?!${THAI})|ปี(?!${THAI})|years?\\b|yrs?\\b|%|x\\b|ms\\b|hz\\b|dpi\\b|เดือน|months?\\b|นาที|mins?\\b|minutes?\\b|cm\\b|mm\\b|นิ้ว|inch(?:es)?\\b|ขวบ|people\\b|pieces?\\b|items?\\b|spf\\b|sensor\\b|เซ็นเซอร์|mbps\\b|gb\\b|tb\\b)`,
	'iu'
);

const CURRENCY_AFTER = /^(?:บาท|baht\b|thb\b|฿|bht\b)/iu;
const CURRENCY_BEFORE = /(?:฿|thb)\s*$/iu;
const FILLER = '(?:\\s*(?:around|about|roughly|approximately|ประมาณ|ราวๆ|ราว|แค่|ที่))?';
const cue = (words: string) => new RegExp(`(?:${words})${FILLER}\\s*(?:฿|thb)?\\s*$`, 'iu');

/** Negated forms are read first, so "no more than" is a cap and "not less than" is not. */
const NEGATED_UPPER = cue(
	'no more than|not more than|not over|not above|no higher than|ไม่มากกว่า|ไม่เกิน|ไม่สูงกว่า'
);
const NEGATED_LOWER = cue(
	'not less than|no less than|not under|not below|no lower than|ไม่น้อยกว่า|ไม่ต่ำกว่า'
);
const LOWER_CUE = cue('อย่างน้อย|ขั้นต่ำ|มากกว่า|at least|more than|over|above|minimum|min\\.?|from');
const UPPER_CUE = cue(
	'ต่ำกว่า|น้อยกว่า|ไม่ถึง|ภายใน|งบประมาณ|งบ|ราคา|budget|under|below|within|less than|cheaper than|up to|max(?:imum)?|at most'
);

type Bound = 'upper' | 'lower' | null;
function boundBefore(before: string): Bound {
	if (NEGATED_UPPER.test(before)) return 'upper';
	if (NEGATED_LOWER.test(before)) return 'lower';
	if (LOWER_CUE.test(before)) return 'lower';
	if (UPPER_CUE.test(before)) return 'upper';
	return null;
}

const NUMBER = /(\d+(?:\.\d+)?)\s*(k\b|thousand\b|grand\b|hundred\b|พัน(?!ธ)|หมื่น|แสน|ร้อย)?/giu;

function multiplierOf(suffix: string | undefined): number {
	switch (suffix?.toLowerCase()) {
		case 'k':
		case 'thousand':
		case 'grand':
		case 'พัน':
			return 1000;
		case 'hundred':
		case 'ร้อย':
			return 100;
		case 'หมื่น':
			return 10_000;
		case 'แสน':
			return 100_000;
		default:
			return 1;
	}
}

export type BudgetMatch = Readonly<{ start: number; end: number; amount: number }>;

/** Every amount in the text that reads as an upper price limit. */
export function findBudgets(message: string): BudgetMatch[] {
	const text = normalizeNumbers(message);
	const found: BudgetMatch[] = [];
	for (const match of text.matchAll(NUMBER)) {
		const start = match.index ?? 0;
		const end = start + match[0].length;
		const before = text.slice(Math.max(0, start - 30), start);
		const after = text.slice(end).trimStart();
		const multiplier = multiplierOf(match[2]);
		if (NON_MONEY_UNIT.test(after)) continue;
		const bound = boundBefore(before);
		if (bound === 'lower') continue;
		// "1.5k" and "2 พัน" read as money on their own; a bare number needs a cue.
		const cued =
			multiplier !== 1 ||
			bound === 'upper' ||
			CURRENCY_AFTER.test(after) ||
			CURRENCY_BEFORE.test(before);
		if (!cued) continue;
		const amount = Math.floor(Number(match[1]) * multiplier);
		if (Number.isSafeInteger(amount) && amount >= 1) found.push({ start, end, amount });
	}
	return found;
}

/** The tightest upper limit in the message, in whole baht, or null. */
export function parseBudget(message: string): number | null {
	const amounts = findBudgets(message).map((match) => match.amount);
	return amounts.length === 0 ? null : Math.min(...amounts);
}

/**
 * Model-bound copy of shopper text: every number is masked unless it is a small count or
 * carries a non-money unit, so no amount (budget or otherwise) can reach the model.
 */
export function maskAmounts(text: string): string {
	const normalized = normalizeNumbers(text);
	return normalized
		.replace(NUMBER, (whole, digits: string, suffix: string | undefined, offset: number) => {
			const before = normalized.slice(Math.max(0, offset - 30), offset);
			const after = normalized.slice(offset + whole.length).trimStart();
			const money =
				!!suffix ||
				CURRENCY_AFTER.test(after) ||
				CURRENCY_BEFORE.test(before) ||
				boundBefore(before) !== null;
			if (!money && NON_MONEY_UNIT.test(after)) return whole;
			const value = Number(digits);
			if (!money && Number.isInteger(value) && value <= 10) return whole;
			return '[amount] ';
		})
		.replace(/[\p{Sc}\p{No}\p{Nl}]/gu, '')
		.replace(/\s+/g, ' ')
		.trim();
}
