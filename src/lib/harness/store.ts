import { findProduct, type CatalogPort } from './catalog-port.ts';
import {
	changedParts,
	mergePlan,
	patchParts,
	personaPatches,
	sameValue,
	standardPartPatch,
	standardPlan,
	withoutParts
} from './plan.ts';
import type {
	Drop,
	Persona,
	Plan,
	PlanPart,
	PlanPatch,
	Source,
	StoreState,
	UndoEntry
} from './types.ts';

export const MAX_UNDO = 20;
export const MAX_FOCUS = 3;
export const MAX_CART = 20;
export const MAX_VIEWED = 20;

export function initialState(plan: Plan = standardPlan): StoreState {
	return {
		plan,
		explicit: [],
		undo: [],
		focus: [],
		cart: [],
		viewed: [],
		signals: [],
		suggestions: [],
		dismissed: []
	};
}

export type Transition = Readonly<{
	state: StoreState;
	before: Plan;
	changed: readonly PlanPart[];
	dropped: readonly Drop[];
}>;

const sortedParts = (parts: Iterable<PlanPart>) => [...new Set(parts)].sort();

function pushUndo(state: StoreState): readonly UndoEntry[] {
	const entry: UndoEntry = { plan: state.plan, explicit: state.explicit };
	return [...state.undo, entry].slice(-MAX_UNDO);
}

/**
 * Apply one validated patch as one transaction. An inferred patch may not touch a part the
 * shopper set directly. A change that leaves the plan identical records no undo step.
 */
export function applyPatch(
	state: StoreState,
	patch: PlanPatch,
	source: Source,
	catalog: CatalogPort
): Transition {
	const dropped: Drop[] = [];
	let effective = patch;
	if (source === 'inferred') {
		const blocked = patchParts(patch).filter((part) => state.explicit.includes(part));
		for (const part of blocked) dropped.push({ place: part, code: 'explicit_wins' });
		effective = withoutParts(patch, blocked);
	}
	let next = mergePlan(state.plan, effective, catalog);
	if (
		source === 'inferred' &&
		changedParts(state.plan, next).some((part) => state.explicit.includes(part))
	) {
		// Only a category change cascades into other parts (search words, specs). If that would
		// undo something the shopper set directly, the inferred category change is refused.
		dropped.push({ place: 'filters.category', code: 'explicit_wins' });
		effective = withoutParts(effective, ['filters.category']);
		next = mergePlan(state.plan, effective, catalog);
	}
	const changed = changedParts(state.plan, next);
	if (changed.length === 0) return { state, before: state.plan, changed, dropped };
	const explicit =
		source === 'explicit'
			? sortedParts([...state.explicit, ...patchParts(effective)])
			: state.explicit;
	return {
		state: { ...state, plan: next, explicit, undo: pushUndo(state) },
		before: state.plan,
		changed,
		dropped
	};
}

/** A persona is the standard presentation plus what defines it, applied as one step. */
export function applyPersona(
	state: StoreState,
	persona: Persona,
	extra: PlanPatch,
	source: Source,
	catalog: CatalogPort
): Transition {
	const base = personaPatches[persona];
	const combined: PlanPatch = {
		...base,
		...extra,
		priorities: { ...base.priorities, ...extra.priorities },
		filters: extra.filters
	};
	if (!extra.filters) delete (combined as { filters?: unknown }).filters;
	return applyPatch(state, combined, source, catalog);
}

export function undo(state: StoreState): Transition {
	const last = state.undo.at(-1);
	if (!last) return { state, before: state.plan, changed: [], dropped: [] };
	return {
		state: { ...state, plan: last.plan, explicit: last.explicit, undo: state.undo.slice(0, -1) },
		before: state.plan,
		changed: changedParts(state.plan, last.plan),
		dropped: []
	};
}

export function reset(state: StoreState): Transition {
	// Reset on the standard store changes nothing (spec state table).
	if (sameValue(state.plan, standardPlan))
		return { state, before: state.plan, changed: [], dropped: [] };
	return {
		state: { ...state, plan: standardPlan, explicit: [], undo: pushUndo(state) },
		before: state.plan,
		changed: changedParts(state.plan, standardPlan),
		dropped: []
	};
}

/** Removing a chip undoes exactly that one thing and hands it back to inference. */
export function removeChip(state: StoreState, part: PlanPart, catalog: CatalogPort): Transition {
	const next = mergePlan(state.plan, standardPartPatch(part), catalog);
	const changed = changedParts(state.plan, next);
	const explicit = state.explicit.filter((item) => item !== part && !changed.includes(item));
	if (changed.length === 0)
		return { state: { ...state, explicit }, before: state.plan, changed, dropped: [] };
	return {
		state: { ...state, plan: next, explicit, undo: pushUndo(state) },
		before: state.plan,
		changed,
		dropped: []
	};
}

const knownIds = (catalog: CatalogPort, ids: readonly unknown[], max: number) =>
	ids
		.filter((id): id is string => !!findProduct(catalog, id))
		.filter((id, index, list) => list.indexOf(id) === index)
		.slice(-max);

/** Untrusted id lists (from the page or saved state) are reduced to known, unique, capped ids. */
export function withContext(
	state: StoreState,
	context: Readonly<{
		focus?: readonly unknown[];
		cart?: readonly unknown[];
		viewed?: readonly unknown[];
	}>,
	catalog: CatalogPort
): StoreState {
	return {
		...state,
		focus: context.focus ? knownIds(catalog, context.focus, MAX_FOCUS) : state.focus,
		cart: context.cart ? knownIds(catalog, context.cart, MAX_CART) : state.cart,
		viewed: context.viewed ? knownIds(catalog, context.viewed, MAX_VIEWED) : state.viewed
	};
}
