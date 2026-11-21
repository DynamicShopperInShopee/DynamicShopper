import { z } from 'zod';
import { INTERVIEW } from '#lib/harness/signals.ts';
import { readText } from '#lib/server/live-assistant/read-json.ts';

const MAX_BYTES = 12_000;
const Answer = z.record(z.string(), z.unknown());
const RequestBody = z.object({
	locale: z.enum(['en', 'th']),
	history: z.array(z.object({ role: z.enum(['assistant', 'user']), content: z.string().max(500) })).max(12),
	message: z.string().trim().min(1).max(500)
});
const outputSchema = {
	type: 'object', additionalProperties: false, required: ['reply', 'complete', 'answers'],
	properties: {
		reply: { type: 'string' }, complete: { type: 'boolean' },
		answers: { type: 'object', additionalProperties: false, required: Object.keys(INTERVIEW),
			properties: Object.fromEntries(Object.entries(INTERVIEW).map(([key, values]) => [key, { type: ['string', 'null'], enum: [...values, null] }])) }
	}
} as const;

export async function handleInterview(
	request: Request,
	options: { apiKey?: string; model?: string },
	provider: typeof fetch = fetch
) {
	let body: unknown;
	try { body = JSON.parse((await readText(request.body, MAX_BYTES)) ?? 'null'); } catch { return Response.json({ error: 'invalid-request' }, { status: 400 }); }
	const parsed = RequestBody.safeParse(body);
	if (!parsed.success) return Response.json({ error: 'invalid-request' }, { status: 400 });
	const apiKey = options.apiKey?.trim();
	if (!apiKey) return Response.json({ error: 'unavailable' }, { status: 503 });
	const lang = parsed.data.locale === 'th' ? 'Thai' : 'English';
	const enumText = Object.entries(INTERVIEW).map(([key, values]) => `${key}: ${values.join(', ')}`).join('\n');
	const instructions = `You are a friendly shopping preference interviewer. Continue a natural, concise back-and-forth in ${lang}. Ask at most one useful follow-up question per reply. Ask about preferences for presentation only: goal, what matters, detail level, and optional help/accessibility. Do not ask for or discuss products, catalog, prices, or personal demographics. Maintain the supplied answer object, filling fields only when the shopper clearly expressed an allowed option; never invent an answer. Allowed values:\n${enumText}\nSet complete=true when enough is known or the shopper asks to finish; otherwise ask a follow-up. When complete, briefly summarize and say the shopper can review the proposed view.`;
	try {
		const response = await provider('https://api.openai.com/v1/responses', {
			method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ model: options.model || 'gpt-5-mini', store: false, instructions,
				input: [...parsed.data.history, { role: 'user', content: parsed.data.message }], max_output_tokens: 350,
				text: { format: { type: 'json_schema', name: 'interview_turn', strict: true, schema: outputSchema } } }),
			signal: AbortSignal.timeout(8000)
		});
		if (!response.ok) return Response.json({ error: 'unavailable' }, { status: 502 });
		const result = await response.json() as { status?: string; output?: { type?: string; content?: { type?: string; text?: string }[] }[] };
		const text = result.output?.find((item) => item.type === 'message')?.content?.find((item) => item.type === 'output_text')?.text;
		if (result.status !== 'completed' || !text) return Response.json({ error: 'unavailable' }, { status: 502 });
		const candidate = JSON.parse(text) as unknown;
		const parsedOutput = z.object({ reply: z.string().min(1).max(500), complete: z.boolean(), answers: Answer }).safeParse(candidate);
		if (!parsedOutput.success) return Response.json({ error: 'unavailable' }, { status: 502 });
		const rawAnswers = parsedOutput.data.answers;
		if (Object.keys(rawAnswers).length !== Object.keys(INTERVIEW).length || Object.keys(INTERVIEW).some((key) => !Object.hasOwn(rawAnswers, key)))
			return Response.json({ error: 'unavailable' }, { status: 502 });
		const answers = Object.fromEntries(Object.entries(INTERVIEW).map(([key, values]) => {
			const value = rawAnswers[key];
			return [key, value === null || (typeof value === 'string' && (values as readonly string[]).includes(value)) ? value : null];
		}));
		const reply = /[\d฿$€£¥]/u.test(parsedOutput.data.reply)
			? (parsed.data.locale === 'th' ? 'ขออภัย ฉันช่วยปรับรูปแบบหน้าร้านจากความชอบของคุณได้เท่านั้น' : 'I can help shape the shop around your preferences. What would you like the page to feel like?')
			: parsedOutput.data.reply;
		return Response.json({ ...parsedOutput.data, reply, answers }, { headers: { 'cache-control': 'no-store' } });
	} catch { return Response.json({ error: 'unavailable' }, { status: 502 }); }
}
