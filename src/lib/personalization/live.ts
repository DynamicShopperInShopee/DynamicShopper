import { densities, layouts, locales, themes, type ShopperPlan } from './plan';

export const liveChoices = { theme: themes, layout: layouts, density: densities, locale: locales };

// Send only these fixed labels. A match never contributes its text to the request.
const hintPatterns = [
	[
		'playful',
		/\b(?:playful|cheerful|colou?rful|vibrant|fun vibe)\b|จอย[ๆ ]|จอยจอย|ขอจอย|สีสด|สีสัน|ดูสนุก/u
	],
	[
		'overwhelmed',
		/\b(?:overwhelming|too busy|too crowded|too much going on|visual clutter)\b|ตาลาย|รกตา|แน่นไป|เยอะจน/u
	],
	[
		'older-reader',
		/\b(?:grandmother|grandfather|grandma|grandpa|older readers?|elderly)\b|คุณยาย|คุณย่า|คุณตา|คุณปู่|ผู้สูงอายุ|คนแก่/u
	],
	[
		'specs',
		/\b(?:specs? (?:first|table|side by side)|technical specs|compare (?:the )?specs)\b|สเป[กค]ก่อน|ดูสเป[กค]|เทียบสเป[กค]/u
	],
	[
		'quick-scan',
		/\b(?:at a glance|quick scan|scan quickly|skim quickly)\b|ดูไว[ๆ ]|กวาดตา|ดูแวบเดียว|ดูผ่าน[ๆ ]/u
	],
	[
		'imagery',
		/\b(?:photos? do the talking|picture[- ]led|photo[- ]first|bigger images|visual style)\b|เน้นรูป|ดูรูปก่อน|รูปใหญ่/u
	],
	['minimal', /\b(?:minimal|minimalist|clean layout|plain layout)\b|มินิมอล|เรียบ[ๆ ]|เรียบง่าย/u],
	[
		'large-text',
		/\b(?:larger? (?:print|text|font)|big(?:ger)? (?:text|font)|small print|squint)\b|ตัวหนังสือใหญ่|ตัวอักษรใหญ่|อ่านไม่ชัด/u
	],
	['list-view', /\b(?:list view|show as a list)\b|แบบรายการ/u],
	['grid-view', /\b(?:grid view|show as a grid)\b|แบบตารางการ์ด/u],
	['compact', /\bcompact\b|แบบกะทัดรัด/u],
	['thai', /\b(?:in thai|thai language)\b|ภาษาไทย/u],
	['english', /\b(?:in english|english language)\b|ภาษาอังกฤษ/u]
] as const;

export type LiveHint = (typeof hintPatterns)[number][0];

export function projectLiveHints(message: string): readonly LiveHint[] {
	const text = message.slice(0, 1000).normalize('NFKC').toLowerCase();
	return hintPatterns.filter(([, pattern]) => pattern.test(text)).map(([hint]) => hint);
}

export function parseLiveHints(value: unknown): readonly LiveHint[] | null {
	if (!Array.isArray(value) || value.length > hintPatterns.length) return null;
	const input = new Set<unknown>(value);
	const hints = hintPatterns.flatMap(([hint]) => (input.has(hint) ? [hint] : []));
	return hints.length === value.length ? hints : null;
}

export function readLivePatch(value: unknown): Partial<ShopperPlan> {
	return readLiveProposal(value).patch;
}

export function readLiveProposal(value: unknown): {
	patch: Partial<ShopperPlan>;
	rejected: boolean;
} {
	if (value === null || typeof value !== 'object' || Array.isArray(value))
		return { patch: {}, rejected: true };
	const input = value as Record<string, unknown>;
	const patch = Object.fromEntries(
		Object.entries(liveChoices).flatMap(([field, allowed]) => {
			const proposed = Object.hasOwn(input, field) ? input[field] : undefined;
			return allowed.some((choice) => proposed === choice) ? [[field, proposed]] : [];
		})
	);
	const rejected = Object.entries(input).some(
		([field, proposed]) =>
			!Object.hasOwn(liveChoices, field) || (proposed !== null && !Object.hasOwn(patch, field))
	);
	return { patch, rejected };
}
