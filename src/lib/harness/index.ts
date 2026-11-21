/**
 * Public API of the personalization engine and AI harness (browser-safe, no network).
 * The UI imports only from here. Server-only agent code lives in `$lib/server/agent`.
 */
export * from './types.ts';
export { defaultCatalog, type CatalogPort } from './catalog-port.ts';
export {
	standardPlan,
	personaPatches,
	validatePatch,
	mergePlan,
	matchProducts,
	activeCategory,
	pageSections,
	standardPartPatch,
	LEVEL_WEIGHT
} from './plan.ts';
export {
	initialState,
	applyPatch,
	applyPersona,
	undo,
	reset,
	removeChip,
	withContext,
	type Transition
} from './store.ts';
export {
	rankProducts,
	explainRank,
	type RankedProduct,
	type RankTerm,
	type ExplanationBar
} from './ranking.ts';
export { parseBudget, maskAmounts } from './budget.ts';
export { guardReply, template, templates, FORBIDDEN_REPLY } from './guard.ts';
export { interpretOffline, type Envelope } from './offline.ts';
export {
	handleTurn,
	validateEnvelope,
	resolveBasket,
	priceBasket,
	shownProducts,
	cleanMessage,
	MAX_MESSAGE_LENGTH,
	type HandledTurn,
	type TurnInput,
	type TurnDeps,
	type RemoteAnswer,
	type Clock
} from './turn.ts';
export { whatChanged, prioritySummary, partLabels, sectionLabels, themeLabels } from './labels.ts';
export {
	recordSignal,
	acceptSuggestion,
	dismissSuggestion,
	interviewPatch,
	INTERVIEW,
	SUGGESTION_THRESHOLD,
	type InterviewAnswers
} from './signals.ts';
export { projectTrace, FALLBACK_REASONS, type Trace, type ToolStep } from './trace.ts';
export { runGoldenSet, type GoldenSummary } from './accuracy.ts';
