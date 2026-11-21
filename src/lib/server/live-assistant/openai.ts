import {
	liveChoices,
	parseLiveHints,
	readLiveProposal,
	type LiveHint
} from '../../personalization/live';
import { readJson } from './read-json';

const defaultModel = 'gpt-5-mini';
const modelPattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/;
const schema = {
	type: 'object',
	additionalProperties: false,
	required: Object.keys(liveChoices),
	properties: Object.fromEntries(
		Object.entries(liveChoices).map(([key, values]) => [
			key,
			{ type: ['string', 'null'], enum: [...values, null] }
		])
	)
};

export async function requestLivePatch(
	hints: readonly LiveHint[],
	options: { apiKey: string; model?: string; signal?: AbortSignal },
	provider: typeof fetch = fetch
) {
	const validatedHints = parseLiveHints(hints);
	if (!validatedHints?.length || options.signal?.aborted) return null;
	const configuredModel = options.model?.trim();
	const model =
		configuredModel && configuredModel !== options.apiKey && modelPattern.test(configuredModel)
			? configuredModel
			: defaultModel;
	const timeout = AbortSignal.timeout(6500);
	try {
		const response = await provider('https://api.openai.com/v1/responses', {
			method: 'POST',
			redirect: 'error',
			headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				store: false,
				instructions: [
					'Suggest store presentation changes based solely on these finite preference hints.',
					'Favor readability for older readers, minimal clutter for quick scanning, and comparison tables for specs.',
					'Give explicit language and layout hints precedence. Return null for fields the hints do not support.'
				].join(' '),
				input: JSON.stringify(validatedHints),
				max_output_tokens: 512,
				...(model === defaultModel ? { reasoning: { effort: 'minimal' } } : {}),
				text: { format: { type: 'json_schema', name: 'shopper_plan_patch', strict: true, schema } }
			}),
			signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
		});
		if (!response.ok) {
			void response.body?.cancel().catch(() => {});
			return null;
		}

		const result = (await readJson(response.body, 32768)) as
			| {
					status?: unknown;
					output?: { type?: unknown; content?: { type?: unknown; text?: unknown }[] }[];
			  }
			| null
			| undefined;
		if (result?.status !== 'completed' || !Array.isArray(result.output)) return null;
		const message = result.output.find((item) => item?.type === 'message');
		if (!Array.isArray(message?.content)) return null;
		const content = message.content.find((part) => part?.type === 'output_text');
		if (typeof content?.text !== 'string') return null;
		const { patch, rejected } = readLiveProposal(JSON.parse(content.text));
		return Object.keys(patch).length > 0
			? { patch, model, ...(rejected ? { rejected } : {}) }
			: null;
	} catch {
		return null;
	}
}
