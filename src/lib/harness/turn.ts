import { DEFAULT_COIN_BALANCE, optimizeDeal, type DealReceipt } from '../pricing/index.ts';
import type { Product } from '../catalog/index.ts';
import { findProduct, type CatalogPort } from './catalog-port.ts';
import { parseBudget } from './budget.ts';
import { guardReply, hasThaiScript, template, type TemplateKey } from './guard.ts';
import { whatChanged } from './labels.ts';
import { interpretOffline, type Envelope } from './offline.ts';
import { validatePatch } from './plan.ts';
import { rankProducts, type RankedProduct } from './ranking.ts';
import { applyPatch, applyPersona, reset, undo, type Transition } from './store.ts';
import { FALLBACK_REASONS, projectTrace, type Trace } from './trace.ts';
import {
	INTENTS,
	PERSONAS,
	type Backend,
	type ChangeLine,
	type Citation,
	type Drop,
	type FallbackReason,
	type Intent,
	type Language,
	type Persona,
	type PlanPatch,
	type StoreState,
	type Turn
} from './types.ts';

export const MAX_MESSAGE_LENGTH = 500;
const MAX_DEAL_IDS = 20;
const ENVELOPE_KEYS = new Set(['intent', 'patch', 'persona', 'productIds', 'citations', 'reply']);

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export function cleanMessage(message: unknown): string {
	return typeof message === 'string'
		? message.normalize('NFC').trim().slice(0, MAX_MESSAGE_LENGTH)
		: '';
}

/** Validate one citation against the listing: only products shown this turn, real parts only. */
function validCitation(
	raw: unknown,
	citable: ReadonlySet<string>,
	catalog: CatalogPort
): Citation | null {
	if (!isRecord(raw)) return null;
	const product =
		typeof raw.productId === 'string' && citable.has(raw.productId)
			? findProduct(catalog, raw.productId)
			: undefined;
	if (!product) return null;
	if (raw.kind === 'spec' && catalog.specs[product.category].some((d) => d.key === raw.key))
		return { productId: product.id, kind: 'spec', key: raw.key as string };
	if (raw.kind === 'review' && (raw.key === '0' || raw.key === '1'))
		return { productId: product.id, kind: 'review', key: raw.key };
	if (raw.kind === 'summary') return { productId: product.id, kind: 'summary', key: 'summary' };
	return null;
}

export type ValidatedEnvelope = Readonly<{
	turn: Turn;
	dropped: readonly Drop[];
	guard: 'passed' | 'replaced';
}>;

/**
 * Judge an envelope from either backend part by part. Returns null only when it is wholly
 * unusable (not an object, or no known intent), which sends the turn to the keyword fallback.
 */
export function validateEnvelope(
	raw: unknown,
	state: StoreState,
	catalog: CatalogPort,
	context: Readonly<{ citable: readonly string[]; lang: Language }>
): ValidatedEnvelope | null {
	if (
		!isRecord(raw) ||
		typeof raw.intent !== 'string' ||
		!(INTENTS as readonly string[]).includes(raw.intent)
	)
		return null;
	const dropped: Drop[] = [];
	for (const key of Object.keys(raw))
		if (!ENVELOPE_KEYS.has(key)) dropped.push({ place: 'unknown', code: 'unknown_field' });
	let intent = raw.intent as Intent;

	let persona: Persona | undefined;
	if (intent === 'persona') {
		if ((PERSONAS as readonly unknown[]).includes(raw.persona)) persona = raw.persona as Persona;
		else {
			dropped.push({ place: 'persona', code: 'unknown_value' });
			intent = 'restyle';
		}
	}

	const changesPlan = intent === 'restyle' || intent === 'search' || intent === 'persona';
	let patch: PlanPatch = {};
	if (changesPlan) {
		const result = validatePatch(raw.patch, state.plan, catalog, 'model');
		patch = result.patch;
		dropped.push(...result.dropped);
	} else if (raw.patch !== undefined) {
		// A question, deal, chat, undo or reset never changes the plan, whatever came attached.
		dropped.push({ place: 'intent', code: 'ignored_for_intent' });
	}

	const productIds: string[] = [];
	if (raw.productIds !== undefined) {
		if (intent !== 'find_deal') dropped.push({ place: 'productId', code: 'ignored_for_intent' });
		else if (!Array.isArray(raw.productIds))
			dropped.push({ place: 'productId', code: 'invalid_shape' });
		else
			for (const id of raw.productIds.slice(0, MAX_DEAL_IDS)) {
				const product = findProduct(catalog, id);
				if (!product) dropped.push({ place: 'productId', code: 'unknown_product' });
				else if (!productIds.includes(product.id)) productIds.push(product.id);
			}
	}

	const citations: Citation[] = [];
	if (raw.citations !== undefined) {
		if (intent !== 'ask') dropped.push({ place: 'citation', code: 'ignored_for_intent' });
		else if (!Array.isArray(raw.citations))
			dropped.push({ place: 'citation', code: 'invalid_shape' });
		else {
			const citable = new Set(context.citable);
			for (const item of raw.citations.slice(0, 12)) {
				const citation = validCitation(item, citable, catalog);
				if (!citation) dropped.push({ place: 'citation', code: 'invalid_citation' });
				else if (
					!citations.some(
						(c) =>
							c.productId === citation.productId &&
							c.kind === citation.kind &&
							c.key === citation.key
					)
				)
					citations.push(citation);
			}
		}
	}

	const fallbackKey: TemplateKey =
		intent === 'ask' && citations.length === 0 ? 'ask_decline' : intent;
	const { text, guard } = guardReply(raw.reply, fallbackKey, context.lang);
	// An answer without a valid citation says it cannot confirm, whatever the model wrote.
	const reply = {
		lang: context.lang,
		text: fallbackKey === 'ask_decline' ? template('ask_decline', context.lang) : text
	};

	let turn: Turn;
	switch (intent) {
		case 'restyle':
		case 'search':
			turn = { intent, patch, reply };
			break;
		case 'persona':
			turn = { intent, persona: persona ?? 'standard', patch, reply };
			break;
		case 'find_deal':
			turn = { intent, productIds, reply };
			break;
		case 'ask':
			turn = { intent, citations, reply };
			break;
		default:
			turn = { intent, reply };
	}
	return { turn, dropped, guard };
}

/** Resolve "this": named products, else the product in focus, else the cart. */
export function resolveBasket(named: readonly string[], state: StoreState): string[] {
	if (named.length > 0) return [...named];
	if (state.focus.length > 0) return [state.focus[0]];
	return [...state.cart];
}

export type Clock = Readonly<{ openedAt: number; now: number }>;

/** One pricing path for chat, cards and sections: the shared optimizer and coin balance. */
export function priceBasket(ids: readonly string[], clock: Clock): DealReceipt | null {
	if (ids.length === 0) return null;
	return optimizeDeal(
		ids.map((productId) => ({ productId, quantity: 1 })),
		{ openedAt: clock.openedAt, now: clock.now, coinBalance: DEFAULT_COIN_BALANCE }
	);
}

/** An answer from the server. Untrusted: re-validated here exactly like any model output. */
export type RemoteAnswer = Readonly<{
	envelope?: unknown;
	citable?: unknown;
	fallbackReason?: unknown;
	trace?: unknown;
}>;

export type TurnInput = Readonly<{
	message: unknown;
	remote?: RemoteAnswer;
	forceOffline?: boolean;
}>;

export type TurnDeps = Readonly<{ catalog: CatalogPort; clock: Clock }>;

export type HandledTurn = Readonly<{
	state: StoreState;
	turn: Turn;
	backend: Backend;
	changes: readonly (ChangeLine & { query?: string; amount?: number })[];
	ranked: readonly RankedProduct[];
	basket: readonly string[];
	deal: DealReceipt | null;
	trace: Trace;
}>;

/** What the model and the fallback may cite: the products in focus, else the top three on screen. */
export function shownProducts(state: StoreState, catalog: CatalogPort): Product[] {
	const focus = state.focus.map((id) => findProduct(catalog, id)).filter((p): p is Product => !!p);
	if (focus.length > 0) return focus.slice(0, 3);
	return rankProducts(catalog, state.plan)
		.slice(0, 3)
		.map((row) => row.product);
}

/**
 * One shopper message, end to end, with the same steps online and offline:
 * understand → validate → guard → interpret → price → apply → rank.
 */
export function handleTurn(state: StoreState, input: TurnInput, deps: TurnDeps): HandledTurn {
	const { catalog } = deps;
	const message = cleanMessage(input.message);
	const shown = shownProducts(state, catalog);
	const lang: Language = hasThaiScript(message) ? 'th' : state.plan.language;

	// Understand: the model's envelope if one came back usable, else the keyword fallback.
	const remoteTrace = input.remote?.trace !== undefined ? projectTrace(input.remote.trace) : null;
	let backend: Backend = 'offline';
	let fallbackReason: FallbackReason | null = input.forceOffline ? 'forced_offline' : null;
	let validated: ValidatedEnvelope | null = null;
	if (
		!input.forceOffline &&
		input.remote &&
		input.remote.envelope !== undefined &&
		input.remote.envelope !== null
	) {
		const citable = Array.isArray(input.remote.citable)
			? input.remote.citable.filter((id): id is string => !!findProduct(catalog, id))
			: [];
		validated = validateEnvelope(input.remote.envelope, state, catalog, { citable, lang });
		if (validated) backend = 'model';
		else fallbackReason = 'invalid_output';
	} else if (!input.forceOffline && input.remote) {
		const reason = input.remote.fallbackReason;
		fallbackReason = (FALLBACK_REASONS as readonly unknown[]).includes(reason)
			? (reason as FallbackReason)
			: 'api_error';
	} else if (!input.forceOffline) {
		fallbackReason = 'no_key';
	}
	if (!validated) {
		const envelope: Envelope = interpretOffline(message, state, catalog, shown);
		validated = validateEnvelope(envelope, state, catalog, {
			citable: shown.map((p) => p.id),
			lang: envelope.intent === 'persona' && envelope.persona === 'mom' ? 'th' : lang
		});
		// The keyword parser only emits known intents, so this cannot happen; fail loudly if it does.
		if (!validated) throw new Error('Offline interpreter produced an unusable envelope');
	}

	const dropped: Drop[] = [...validated.dropped];
	let turn = validated.turn;
	let transition: Transition = { state, before: state.plan, changed: [], dropped: [] };

	// Interpret and apply. The shopper's budget is read locally and never comes from a model.
	const budget = parseBudget(message);
	const withBudget = (patch: PlanPatch): PlanPatch =>
		budget === null ? patch : { ...patch, filters: { ...patch.filters, maxPrice: budget } };
	switch (turn.intent) {
		case 'restyle':
		case 'search':
			transition = applyPatch(state, withBudget(turn.patch), 'inferred', catalog);
			break;
		case 'persona':
			transition = applyPersona(state, turn.persona, withBudget(turn.patch), 'inferred', catalog);
			break;
		case 'undo':
			transition = undo(state);
			break;
		case 'reset':
			transition = reset(state);
			break;
		default:
			break;
	}
	dropped.push(...transition.dropped);
	const next = transition.state;
	const replyLang: Language = hasThaiScript(message) ? 'th' : next.plan.language;

	// Price: a deal request never re-ranks or restyles.
	let basket: string[] = [];
	let deal: DealReceipt | null = null;
	if (turn.intent === 'find_deal') {
		basket = resolveBasket(turn.productIds, state);
		deal = priceBasket(basket, deps.clock);
	}

	// Honest replies: say nothing changed when nothing did; ask which product when nothing to price.
	const override = (key: TemplateKey) =>
		({ ...turn, reply: { lang: replyLang, text: template(key, replyLang) } }) as Turn;
	if (
		(turn.intent === 'restyle' || turn.intent === 'search' || turn.intent === 'persona') &&
		transition.changed.length === 0
	)
		turn = override('no_change');
	else if (turn.intent === 'undo' && transition.changed.length === 0 && state.undo.length === 0)
		turn = override('undo_none');
	else if (turn.intent === 'find_deal' && !deal) turn = override('deal_pick');
	else if (backend === 'offline' && turn.reply.lang !== replyLang)
		turn = override(
			turn.intent === 'ask' && turn.citations.length === 0 ? 'ask_decline' : turn.intent
		);

	const ranked = rankProducts(catalog, next.plan);
	const changes = whatChanged(next.plan, transition.changed, replyLang, catalog);
	const trace: Trace = projectTrace({
		intent: turn.intent,
		backend,
		model: backend === 'model' ? remoteTrace?.model : null,
		fallbackReason:
			backend === 'model' ? null : (fallbackReason ?? remoteTrace?.fallbackReason ?? null),
		rounds: remoteTrace?.rounds ?? 0,
		tools: remoteTrace?.tools ?? [],
		tokens: remoteTrace?.tokens ?? { input: 0, output: 0 },
		ms: remoteTrace?.ms ?? 0,
		dropped: [...(backend === 'model' ? [] : (remoteTrace?.dropped ?? [])), ...dropped],
		guard: validated.guard,
		changes: transition.changed.length,
		ranked: ranked.length
	});

	return { state: next, turn, backend, changes, ranked, basket, deal, trace };
}
