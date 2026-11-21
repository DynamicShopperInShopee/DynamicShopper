import {
	liveChoices,
	parseLiveHints,
	readLiveProposal,
	type LiveHint
} from '../../personalization/live';
import { readJson } from './read-json';

const defaultModel = 'gpt-5-mini';
const modelPattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,79}$/;
export type LiveUsage = {
	inputTokens: number;
	cachedInputTokens: number;
	outputTokens: number;
	estimatedUsd: number | null;
};

function isTokenCount(value: unknown): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function readUsage(value: unknown, model: string): LiveUsage | undefined {
	if (!value || typeof value !== 'object') return;
	const usage = value as {
		input_tokens?: unknown;
		input_tokens_details?: { cached_tokens?: unknown };
		output_tokens?: unknown;
	};
	const inputTokens = usage.input_tokens;
	const cachedInputTokens = usage.input_tokens_details?.cached_tokens ?? 0;
	const outputTokens = usage.output_tokens;
	if (
		!isTokenCount(inputTokens) ||
		!isTokenCount(cachedInputTokens) ||
		cachedInputTokens > inputTokens ||
		!isTokenCount(outputTokens)
	)
		return;

	// Standard text token rates per million for GPT-5 mini. Output includes reasoning tokens.
	const estimatedUsd =
		model === defaultModel
			? ((inputTokens - cachedInputTokens) * 0.25 + cachedInputTokens * 0.025 + outputTokens * 2) /
				1e6
			: null;
	return { inputTokens, cachedInputTokens, outputTokens, estimatedUsd };
}

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
	options: {
		apiKey: string;
		model?: string;
		signal?: AbortSignal;
		onUsage?: (usage: LiveUsage) => void;
	},
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
					'When the shopper prioritizes imagery, favor a grid layout or spacious density.',
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
					usage?: unknown;
					output?: { type?: unknown; content?: { type?: unknown; text?: unknown }[] }[];
			  }
			| null
			| undefined;
		if (options.onUsage) {
			const usage = readUsage(result?.usage, model);
			if (usage) {
				try {
					options.onUsage(usage);
				} catch {
					// Local usage logging must not affect the accepted presentation change.
				}
			}
		}
		if (result?.status !== 'completed' || !Array.isArray(result.output)) return null;
		const message = result.output.find((item) => item?.type === 'message');
		if (!Array.isArray(message?.content)) return null;
		const content = message.content.find((part) => part?.type === 'output_text');
		if (typeof content?.text !== 'string') return null;
		const { patch, rejected } = readLiveProposal(JSON.parse(content.text));
		return Object.keys(patch).length || rejected
			? { patch, model, ...(rejected ? { rejected } : {}) }
			: null;
	} catch {
		return null;
	}
}
