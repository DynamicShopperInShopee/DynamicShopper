import {
	DROP_CODES,
	DROP_PLACES,
	INTENTS,
	type Backend,
	type Drop,
	type FallbackReason,
	type Intent
} from './types.ts';

export const FALLBACK_REASONS: readonly FallbackReason[] = [
	'no_key',
	'forced_offline',
	'api_error',
	'refusal',
	'timeout',
	'deadline',
	'too_many_rounds',
	'output_cut',
	'invalid_output'
];
export const TOOL_KINDS = ['search_catalog', 'read_listing', 'unknown_tool'] as const;
export type ToolKind = (typeof TOOL_KINDS)[number];

export type ToolStep = Readonly<{ kind: ToolKind; results: number; ms: number }>;

/**
 * What X-ray may show. A closed schema of locally formatted values: no raw prompt, no raw
 * model text, no model-chosen keys, no server configuration except the model name.
 */
export type Trace = Readonly<{
	intent: Intent;
	backend: Backend;
	model: string | null;
	fallbackReason: FallbackReason | null;
	rounds: number;
	tools: readonly ToolStep[];
	tokens: Readonly<{ input: number; output: number }>;
	ms: number;
	dropped: readonly Drop[];
	guard: 'passed' | 'replaced';
	changes: number;
	ranked: number;
}>;

/** Three tool rounds of at most three calls each. */
const MAX_TOOLS = 9;
const MAX_DROPS = 40;

const count = (value: unknown, max = 1_000_000) =>
	typeof value === 'number' && Number.isFinite(value)
		? Math.min(max, Math.max(0, Math.round(value)))
		: 0;
const oneOf = <T>(list: readonly T[], value: unknown, otherwise: T): T =>
	(list as readonly unknown[]).includes(value) ? (value as T) : otherwise;
const record = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

/** Model names are shown in X-ray; anything that does not look like a model id is hidden. */
export function safeModelName(value: unknown): string | null {
	return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,64}$/.test(value) ? value : null;
}

/** Rebuild a trace from untrusted input, keeping only allowlisted fields and values. */
export function projectTrace(raw: unknown): Trace {
	const input = record(raw);
	const tokens = record(input.tokens);
	const tools = Array.isArray(input.tools) ? input.tools.slice(0, MAX_TOOLS) : [];
	const dropped = Array.isArray(input.dropped) ? input.dropped.slice(0, MAX_DROPS) : [];
	const backend = oneOf<Backend>(['model', 'offline'], input.backend, 'offline');
	return {
		intent: oneOf<Intent>(INTENTS, input.intent, 'chat'),
		backend,
		model: backend === 'model' ? safeModelName(input.model) : null,
		fallbackReason:
			input.fallbackReason === null || input.fallbackReason === undefined
				? null
				: oneOf<FallbackReason | null>(FALLBACK_REASONS, input.fallbackReason, null),
		rounds: count(input.rounds, 4),
		tools: tools.map((step) => {
			const item = record(step);
			return {
				kind: oneOf<ToolKind>(TOOL_KINDS, item.kind, 'unknown_tool'),
				results: count(item.results, 10),
				ms: count(item.ms, 60_000)
			};
		}),
		tokens: { input: count(tokens.input), output: count(tokens.output) },
		ms: count(input.ms, 60_000),
		dropped: dropped.map((entry) => {
			const item = record(entry);
			return {
				place: oneOf(DROP_PLACES, item.place, 'unknown' as const),
				code: oneOf(DROP_CODES, item.code, 'invalid_shape' as const)
			};
		}),
		guard: oneOf(['passed', 'replaced'] as const, input.guard, 'replaced'),
		changes: count(input.changes, 100),
		ranked: count(input.ranked, 10_000)
	};
}
