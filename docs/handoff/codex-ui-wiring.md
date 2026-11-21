# Codex task · Wire the agent harness into the adaptive UX

Paste everything below the line into Codex as one task.

---

You are wiring DynamicShopper's agent harness into the storefront UI you are designing (the adaptive UX preset on `codex/shopee-adaptive-ux-draft`). The harness is finished and tested on branch `feat/agent-harness`. **Do not change its behaviour.** Your job is the UI that calls it.

## Read first

1. `AGENTS.md` (the product rules; every one applies to the UI).
2. `SPEC.md` (the harness contract, requirements R1–R20).
3. `guidelines/DESIGN.md`, `guidelines/EXPERIENCE.md`, `guidelines/JOURNEY.md`, `guidelines/TRUST-AND-PROOF.md`.
4. `src/lib/personalization/index.ts` (the public API below).

## What you own

- `src/routes/+page.svelte` and new components under `src/routes/` (or `src/lib/components/`), plus a `context.svelte.ts` holding the store state (see AGENTS.md "Global/scoped state").
- UI copy for the new surfaces, in Thai and English.

## What you must not change

- Anything under `src/lib/personalization/`, `src/lib/server/agent/`, `src/lib/server/handlers/`, `src/routes/api/assistant/`, `src/lib/catalog/`, `src/lib/pricing/`. If the UI needs something the API does not give, stop and write the request down; do not work around it.

## The public API

Import only from `#lib/personalization/index.ts` in browser code:

```ts
import {
	defaultCatalog,
	standardPlan,
	personaPatches,
	initialState,
	applyPatch,
	applyPersona,
	undo,
	reset,
	removeChip,
	withContext,
	validatePatch,
	handleTurn,
	rankProducts,
	explainRank,
	pageSections,
	whatChanged,
	prioritySummary,
	partLabels,
	sectionLabels,
	themeLabels,
	priceBasket,
	recordSignal,
	acceptSuggestion,
	dismissSuggestion,
	interviewPatch,
	INTERVIEW,
	projectTrace,
	templates,
	MAX_MESSAGE_LENGTH
} from '#lib/personalization/index.ts';
```

Types you will use: `RemoteAnswer`, `StoreState`, `Plan`, `PlanPatch`, `PlanPart`, `HandledTurn`, `Turn`, `Trace`, `RankedProduct`, `ExplanationBar`, `Suggestion`, `SignalKind`, `InterviewAnswers`, `ChangeLine`, `Citation`.

### One chat message, end to end

```ts
// 1. Ask the local model endpoint (exists only in `vite dev`, or preview with ASSISTANT_LOCAL=1).
//    In the public build it returns 404: treat any non-200 or network error as "no answer".
let remote: RemoteAnswer | undefined;
if (!forceOffline) {
	try {
		const res = await fetch('/api/assistant', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({
				message, // ≤ 500 chars
				history, // last turns: { role: 'shopper' | 'assistant', text }[]; never resend a failed turn
				plan: state.plan,
				focus: state.focus,
				cart: state.cart,
				viewed: state.viewed,
				poison: poisonArmed // dev-only red-team switch; ignored elsewhere
			})
		});
		if (res.ok) remote = await res.json();
	} catch {
		/* network failure: offline below */
	}
}
// 2. The browser validates the answer again and applies it. Never skip this step.
const result: HandledTurn = handleTurn(
	state,
	{ message, remote, forceOffline },
	{
		catalog: defaultCatalog,
		clock: { openedAt, now: Date.now() } // the page's shared clock; same one the deal sections use
	}
);
state = result.state;
```

`result` gives you everything a surface needs:

| Field                                 | Use it for                                                                                                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `turn.reply.text`, `turn.reply.lang`  | The chat bubble. Already guarded; render as **text**, never as HTML.                                                                                                                |
| `backend`, `trace.fallbackReason`     | "Offline mode" badge whenever `backend === 'offline'`, with the reason in X-ray.                                                                                                    |
| `changes`                             | "What changed" receipt. Each line has `text`; a budget line also has `amount` (format it with the catalog's baht formatter) and a search line has `query`. Empty means say nothing. |
| `ranked`                              | The product list, already ordered. Never re-sort it in the UI.                                                                                                                      |
| `turn.citations` (intent `ask`)       | "From the listing" receipt. Print each cited value from the catalog (`resolveFact(productId, 'spec.<key>')` from `#lib/catalog`, `review.0/1`, `summary`), never from the reply.    |
| `deal`, `basket` (intent `find_deal`) | The best-deal receipt, printed line by line from `deal`. `null` means the reply already asks which product.                                                                         |
| `trace`                               | X-ray: intent, backend, model name, tool steps, rounds, token totals, drops (`place` + `code`), guard, changes, ranked count. Only these fields exist.                              |

### Direct controls (always win over inference)

- Persona picker: `applyPersona(state, persona, {}, 'explicit', defaultCatalog)`.
- Language switch, category tabs, search box, theme menu: `applyPatch(state, patch, 'explicit', defaultCatalog)`; validate untrusted input first with `validatePatch(raw, state.plan, defaultCatalog, 'local')`.
- Chips: one per part in `state.explicit` and per difference from `standardPlan`; removing one calls `removeChip(state, part, defaultCatalog)`. Label with `partLabels[part][lang]`.
- Undo: `undo(state)`, disabled when `state.undo.length === 0`. Reset: `reset(state)`, disabled when the plan equals `standardPlan`.
- Every call returns `{ state, changed }`. Feed `changed` to `whatChanged(state.plan, changed, lang, defaultCatalog)` for the receipt.

### Adaptive learning (Codex's interview and suggestions)

- Interview: `const { patch, unsupported } = interviewPatch(answers)` then `applyPatch(state, patch, 'explicit', …)`. Show the preview from `whatChanged` before applying. `unsupported` lists answers with no section in the fixed library (complete-the-set, refills); show them as "coming later", never invent a module.
- Behaviour: call `recordSignal(state, { kind, at: Date.now() }, defaultCatalog)` for `open_compare`, `open_specs`, `open_reviews`, `zoom_text`, `sort_price`, `open_deal`. It never changes the plan. Show `state.suggestions` as offers ("You often compare specs. Put comparison first?"); `acceptSuggestion` applies one undoable step; `dismissSuggestion` hides it for the session.

### Ranking explanation and page sections

- "Why this order?": `explainRank(row)` returns up to three bars with `label` and `width` 1–4. No digits. Not for a lone product, simplified mode or compare panes.
- Render sections from `pageSections(state.plan)` in order. Each section disappears completely when empty. Products is always present.

## Rules the UI must keep (from AGENTS.md)

- Every number on screen comes from the catalog formatter or the optimizer. Never print a number from a reply, a trace label you composed yourself, or a model string.
- Reply text and any model-originated string are rendered as text. No `{@html}`.
- Offline is first class: the whole journey works with the endpoint returning 404 and with "Force offline" on.
- Debug switches (X-ray open, force offline, poison armed) are never saved. Only `plan` and `cart` may persist; on restore, pass each through `validatePatch(…, 'local')` and `withContext`.
- Thai and English for every string; four themes; WCAG AA; large print keeps 20px text and 48px targets; reduced motion means none; 1440×900 and 390×844 with no sideways scroll.
- Green and red mean state only; a stamp appears only where a check ran and passed.

## Acceptance checks

1. `bun run check` and `bun run test:unit --run --project server` stay green (none of the harness tests may be edited or skipped).
2. With no `OPENAI_API_KEY`, walk `guidelines/JOURNEY.md` steps 1–10: every reply shows "Offline mode", and step 3 shows three mice with Aero X first.
3. In `vite dev`, arm "Simulate poisoned model" and send a message: X-ray lists the dropped parts, the guard says replaced, "What changed" is empty, and no price on screen moves.
4. Set a language with the switch, then type "ซื้อให้แม่": the store turns large-print, but the language stays as you set it and X-ray shows `explicit_wins` for language.
5. Trigger the same behaviour three times (for example open compare three times): a suggestion appears, and the plan has not changed until you accept it.

Return the changed files, the commands you ran with their results, and any API gap you hit.
