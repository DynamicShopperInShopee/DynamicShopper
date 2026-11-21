import OpenAI from 'openai';
import type {
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionMessageParam
} from 'openai/resources/chat/completions';

/** Provider-neutral shapes. The agent loop and its tests only ever see these. */
export type ToolCall = Readonly<{ id: string; name: string; arguments: string }>;

export type ModelMessage =
	| Readonly<{ role: 'system' | 'user'; content: string }>
	| Readonly<{ role: 'assistant'; content: string | null; toolCalls?: readonly ToolCall[] }>
	| Readonly<{ role: 'tool'; toolCallId: string; content: string }>;

export type ToolSpec = Readonly<{
	name: string;
	description: string;
	parameters: Record<string, unknown>;
}>;

export type ModelRequest = Readonly<{
	model: string;
	messages: readonly ModelMessage[];
	tools: readonly ToolSpec[];
	maxOutputTokens: number;
}>;

export type Usage = Readonly<{ input: number; output: number }>;

export type ModelResponse =
	| Readonly<{ kind: 'tool_calls'; calls: readonly ToolCall[]; usage: Usage }>
	| Readonly<{ kind: 'final'; text: string; usage: Usage }>
	| Readonly<{ kind: 'refusal'; usage: Usage }>
	| Readonly<{ kind: 'length'; usage: Usage }>;

export interface ModelTransport {
	complete(request: ModelRequest, signal: AbortSignal): Promise<ModelResponse>;
}

/** Map the neutral request onto OpenAI Chat Completions. Pure, so tests can inspect it. */
export function toOpenAIParams(request: ModelRequest): ChatCompletionCreateParamsNonStreaming {
	const messages: ChatCompletionMessageParam[] = request.messages.map((message) => {
		switch (message.role) {
			case 'assistant':
				return {
					role: 'assistant',
					content: message.content,
					...(message.toolCalls && message.toolCalls.length > 0
						? {
								tool_calls: message.toolCalls.map((call) => ({
									id: call.id,
									type: 'function' as const,
									function: { name: call.name, arguments: call.arguments }
								}))
							}
						: {})
				};
			case 'tool':
				return { role: 'tool', tool_call_id: message.toolCallId, content: message.content };
			default:
				return { role: message.role, content: message.content };
		}
	});
	return {
		model: request.model,
		store: false,
		messages,
		tools: request.tools.map((tool) => ({
			type: 'function' as const,
			function: {
				name: tool.name,
				description: tool.description,
				parameters: tool.parameters,
				strict: true
			}
		})),
		tool_choice: 'auto',
		parallel_tool_calls: false,
		response_format: { type: 'json_object' },
		max_completion_tokens: request.maxOutputTokens
	};
}

/**
 * OpenAI transport. Retries are off so the agent's own deadlines stay honest; the abort
 * signal cuts a slow call. Errors propagate and the agent turns them into a fallback.
 */
export function openAITransport(apiKey: string): ModelTransport {
	const client = new OpenAI({
		apiKey,
		baseURL: 'https://api.openai.com/v1',
		logLevel: 'off',
		maxRetries: 0
	});
	return {
		async complete(request, signal) {
			const completion = await client.chat.completions.create(toOpenAIParams(request), { signal });
			const usage = {
				input: completion.usage?.prompt_tokens ?? 0,
				output: completion.usage?.completion_tokens ?? 0
			};
			const choice = completion.choices[0];
			if (!choice) return { kind: 'length', usage };
			if (choice.message.refusal || choice.finish_reason === 'content_filter')
				return { kind: 'refusal', usage };
			if (choice.finish_reason === 'length') return { kind: 'length', usage };
			const calls = (choice.message.tool_calls ?? []).flatMap((call) =>
				call.type === 'function'
					? [{ id: call.id, name: call.function.name, arguments: call.function.arguments }]
					: []
			);
			if (calls.length > 0) return { kind: 'tool_calls', calls, usage };
			return { kind: 'final', text: choice.message.content ?? '', usage };
		}
	};
}
