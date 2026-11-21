import { z } from 'zod';
import { defaultCatalog, type CatalogPort } from '#lib/harness/catalog-port.ts';
import { mergePlan, standardPlan, validatePatch } from '#lib/harness/plan.ts';
import { findProduct } from '#lib/harness/catalog-port.ts';
import { projectTrace, type Trace } from '#lib/harness/trace.ts';
import type { FallbackReason } from '#lib/harness/types.ts';
import { runAgent, type AgentLimits } from '#lib/server/agent/agent.ts';
import { openAITransport, type ModelTransport } from '#lib/server/agent/transport.ts';

export const MAX_BODY_BYTES = 16 * 1024;

const Body = z.object({
	message: z.string(),
	plan: z.unknown().optional(),
	focus: z.array(z.string().max(64)).max(20).optional(),
	cart: z.array(z.string().max(64)).max(50).optional(),
	viewed: z.array(z.string().max(64)).max(50).optional(),
	forceOffline: z.boolean().optional(),
	poison: z.boolean().optional()
});

export type AssistantResponse = Readonly<{
	envelope: Record<string, unknown> | null;
	citable: readonly string[];
	fallbackReason: FallbackReason | null;
	trace: Trace;
}>;

export type AssistantOptions = Readonly<{
	/** The poisoned model is honoured only in development. */
	dev: boolean;
	apiKey: string | undefined;
	model: string | undefined;
	catalog?: CatalogPort;
	transport?: ModelTransport | null;
	now?: () => number;
	limits?: AgentLimits;
}>;

export type HandlerResult = Readonly<{
	status: number;
	body: AssistantResponse | { error: string };
}>;

const knownIds = (catalog: CatalogPort, ids: readonly string[] | undefined, max: number) =>
	(ids ?? [])
		.filter((id) => !!findProduct(catalog, id))
		.filter((id, index, list) => list.indexOf(id) === index)
		.slice(0, max);

/**
 * POST /api/assistant. Gated before parsing; size and shape checked before the clock starts;
 * the client's plan is re-validated like any untrusted plan. Credentials never leave here:
 * the response carries a validated envelope and a projected trace only.
 */
export async function handleAssistant(
	bodyText: string,
	options: AssistantOptions
): Promise<HandlerResult> {
	if (!options.dev) return { status: 404, body: { error: 'Not found' } };
	if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES)
		return { status: 413, body: { error: 'Request too large' } };

	let json: unknown;
	try {
		json = JSON.parse(bodyText);
	} catch {
		return { status: 400, body: { error: 'Invalid request' } };
	}
	const parsed = Body.safeParse(json);
	if (!parsed.success) return { status: 400, body: { error: 'Invalid request' } };
	const body = parsed.data;
	const message = body.message.normalize('NFC').trim();
	if (message.length === 0) return { status: 400, body: { error: 'Invalid request' } };
	if (message.length > 500) return { status: 413, body: { error: 'Message too long' } };

	const catalog = options.catalog ?? defaultCatalog;
	const plan = mergePlan(
		standardPlan,
		validatePatch(body.plan, standardPlan, catalog, 'local').patch,
		catalog
	);
	const transport =
		options.transport !== undefined
			? options.transport
			: options.apiKey && options.model
				? openAITransport(options.apiKey)
				: null;

	const result = await runAgent(
		{
			message,
			plan,
			focus: knownIds(catalog, body.focus, 3),
			cart: knownIds(catalog, body.cart, 20),
			viewed: knownIds(catalog, body.viewed, 20),
			planBudget: plan.filters.maxPrice
		},
		{
			catalog,
			transport,
			model: options.model ?? null,
			now: options.now ?? Date.now,
			limits: options.limits,
			forceOffline: body.forceOffline === true,
			poisoned: options.dev && body.poison === true
		}
	);

	return {
		status: 200,
		body: {
			envelope: result.envelope,
			citable: result.citable,
			fallbackReason: result.fallbackReason,
			trace: projectTrace(result.trace)
		}
	};
}
