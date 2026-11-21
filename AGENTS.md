# Rules for contributors and coding agents

Everyone who shapes DynamicShopper, human or AI, should keep these rules. They protect the product's one promise: **the AI may change the presentation, never a fact.** Read [PRODUCT.md](guidelines/PRODUCT.md) and [SYSTEM-DESIGN.md](guidelines/SYSTEM-DESIGN.md) before designing anything, and [DESIGN.md](guidelines/DESIGN.md) before any visual work.

## Product rules

1. **Facts come only from the catalog and the pricing logic.** Price, original price, rating, review count, units sold, shipping, specs, voucher terms and deal amounts are never computed, rounded, restated or invented anywhere else.
2. **Every fact on screen is checkable.** Each one names which fact it is and carries its raw value, and its visible text is a faithful formatting of that value.
3. **Money is whole baht.** Discounts round down. No fractional prices.
4. **The AI only proposes plan changes.** Never markup, never copy blocks, never a product order, never a number.
5. **The AI never sees a price.** Not in its instructions, not in product context, not in what its tools return.
6. **Validate part by part.** A bad part of an AI proposal is dropped on its own and noted; the good parts survive. Allow known values; never try to block bad ones.
7. **The reply guard fails closed.** Any AI sentence with a digit or currency mark is replaced. Never loosen it to make a reply nicer.
8. **Questions cite or decline.** An answer without a valid citation says it cannot confirm.
9. **Offline is a first-class path.** The keyword fallback gives the same kind of answer as the AI. Nothing should depend on the network or an AI key to work.
10. **The agent stays bounded.** Read-only tools, a few rounds, a hard time limit, a small reading budget, every step visible. Any failure falls back.
11. **Ranking is deterministic and explainable.** The explanation reads the same terms the order used and shows no numbers.
12. **One pricing path.** Every deal, everywhere, comes from the same optimizer and the same simulated coin balance.
13. **Sections come from the fixed library.** No section shows anything but catalog facts; each disappears when empty; the product list is always on the page.
14. **Anything from outside is untrusted:** requests, AI output, tool arguments, shared links, saved browser state.
15. **Debug powers are limited.** Force offline is always allowed; the poisoned model is for development only. Credentials never reach the browser; only the model name may appear in X-ray.
16. **A question never changes the store; a deal request never re-ranks it; reset and undo belong to the store itself.**

## Experience rules

- Every AI change is visible ("What changed", chips) and reversible (Undo, Reset).
- Explicit controls always work and are never overridden by inference.
- Thai and English are equal: every string exists in both, written for each language.
- The store stays usable after any message: readable, navigable, never blank.
- Green and red mean state only. A stamp appears only where a check ran and passed.
- New proof surfaces look like receipt slips, with no shadows, gradients, badges or sale banners. Personalized receipt themes keep this visual system.
- At the user's explicit request, the default marketplace storefront may use an orange shopping header, category/sort controls and a photo grid. This exception is scoped to the default storefront; keep DynamicShopper identity, no Shopee marks, and no invented offers or product facts.
- Every theme meets WCAG AA; large print keeps 20px text and 48px targets; reduced motion means no motion.
- Every screen works at laptop (1440×900) and phone (390×844) size with no sideways scroll.

## Ways of working

- **Every rule should be provable.** Each product rule above deserves an automated check that states the behaviour. A broken rule is fixed by first showing it is broken.
- **Keep the golden set honest.** Golden messages are written as real shoppers write, never tuned to what the fallback understands. The fallback's understanding should only ever improve.
- **The core journey always works.** [JOURNEY.md](guidelines/JOURNEY.md) should work end to end, offline included, after every change.
- **Check both storefront entry points.** Verify the public `/` route, its **Shopping assistant** link, and the adaptive `/?view=receipt` route. Keep provider credentials out of production and run the local assistant browser suite with credentials cleared.
- **Small, reviewed changes.** One idea per change, read by someone who did not write it, checked against these rules.
- **Ideas and concerns are written down.** A new idea gets a status (proposed, accepted, dropped) and a one-line reason. Every concern raised is either resolved or written down with a decision.
- **The guidelines move with the product.** A change to behaviour updates these guidelines; a change to the visual system updates [DESIGN.md](guidelines/DESIGN.md).
- **Keys and secrets stay private.**
- **Stay lean.** New third-party libraries need a written reason.

## Team workflow

- Follow the [team development checklist](docs/team-setup.md#from-assignment-to-main) for branch sync, verification, review and release handoffs.
- Pick one [team assignment](README.md#choose-your-team-assignment) per coding session. Work in this repository on your own task branch. Start from the team's agreed baseline. Commit and push small, reviewable increments to that branch.
- Each assignment names its owner, owned paths, consumers and acceptance check. Use Astra for shared design decisions and Sol for scoped implementation. Give agents the relevant guideline, contract, diff and test result.
- The producer and an affected consumer agree on shared contract changes. The integration owner coordinates shared configuration and reconciles these rules at every merge. Include guideline edits in the same PR as the behavior they govern.
- Before merging, sync with main, resolve conflicts with the affected owner, rerun the affected checks and obtain review from someone other than the author. Record what passed on the combined tree.
- After a PR merges, you may reuse your assigned branch. Fetch origin, sync the branch with current main and verify its diff against main is clear before starting the next task. Keep each new task in its own PR.
- Keep keys, private configuration, raw conversations and event access materials out of commits, review evidence and public artifacts. Use synthetic examples for handoffs.

## Before calling anything done

- Does any number on screen come from somewhere other than the catalog or the optimizer? Then it is not done.
- Can a hostile AI output reach the screen through this change? Try it with the poisoned model.
- Does it work offline?
- Does it work in all four themes, in Thai and English, on a phone?
- Is every change the shopper did not make explained and undoable?


## Frontend

Sveltekit, BitsUI, Tailwind

Aim for modularization as much as possible. Do not overload `+page.svelte` with multiple action.

### Declarative with style on repetitive block

When iterating over a list for building block, be declarative. Never apply variable solution to construct Tailwind style. Put Tailwind code in the block itself. For example:

Avoid:

```svelte
<script lang="ts">
	const styleMapping = {
		test: 'bg-black',
		'test-2': 'bg-white'
	};
	const x = ['test', 'test-2'];
</script>

{#each x as key (key)}
	<div class={styleMapping[key]}></div>
{/each}
```

Aim:

```svelte
<div class="bg-black"></div><div class="bg-white"></div>
```

### Modularize/Encapsulate Building Block

NEVER bombard single component / `+page.svelte` with bunch of actions/states that tailors to just one minor part of it. Put it in separate Svelte file and import on parent. For some shared state e.g. open state, where parent also control the visibility of such component as Dialog, Popover or Dropdown Menu of BitsUI, put that state in the parent and pass down to component as `$bindable()`. Form input deserve its dedicated file for state/function management.

Avoid:

```svelte
<script lang="ts">
  let { type } = $props()
  const func = (...) => {...}
  const func2 = (...) => {...}
  const func3 = (...) => {...}
  let x1 = $state('')
  let x2 = $state('')
  let x3 = $state('')
  let shared = $state()
</script>

{#if type === 1}
	<button action={func}>
		<span>{x1}</span>
		<span>{shared}</span>
	</button>
{:else if type === 2}
	<button action={func2}>
		<span>{x2}</span>
		<span>{shared}</span>
	</button>
{:else if type === 3}
	<button action={func3}>
		<span>{x3}</span>
		<span>{shared}</span>
	</button>
{/if}
```

Aim:

```svelte
<script lang="ts">
	let { type } = $props();
	import Button1 from './components/Button1.svelte';
	import Button2 from './components/Button2.svelte';
	import Button3 from './components/Button3.svelte';
	let type = $state(1);
	let shared = $state('');
</script>

{#if type === 1}
	<Button1 bind:{shared} />
{:else if type === 2}
	<Button2 bind:{shared} />
{:else if type === 3}
	<Button3 bind:{shared} />
{/if}
```

where Button1-3 have the structure of

```svelte
<script lang="ts">
  let x = $state('')
  let { shared: $bindable() } = $props();
  const func = () => {}
</script>

<button action={func}>
	<span>{x}</span>
	<span>{shared}</span>
</button>
```

### Route-local utilities

If a helper is only used within one route, keep it colocated instead of promoting it to
`$lib/utils`:

```
src/routes/orders/[id]/
  +page.svelte
  utils.ts       # only imported by this route
  types.ts       # only used by this route
```

Promote to `$lib/utils/*` only once a second, unrelated route needs the same helper —
premature sharing is worse than a little duplication.

Put server only utils in `$lib/server/utils/`

### Data fetching model: SvelteKit `load` + TanStack Query

- **`+page.ts` `load`** for SvelteKit's own navigation cache,
- **TanStack Query** gives you background refetch, stale-time control, mutation
  cache invalidation, and cross-component cache sharing _after_ the page has loaded.

Use Tanstack Query by default for caching of data on dashboard, and page.ts / page.server.ts for page that requires no cache.

```ts
// src/routes/users/+page.ts
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const res = await fetch('/api/users');
	return { users: await res.json() };
};
```

```svelte
<!-- src/routes/users/+page.svelte -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const usersQuery = createQuery({
		queryKey: ['users'],
		queryFn: async () => (await fetch('/api/users')).then((r) => r.json()),
		initialData: data.users
	});
</script>
```

### Global/scoped state — `context.svelte.ts` + `createContext`

```ts
// Example of context.svelte.ts
import { browser } from '$app/environment';
import { page } from '$app/state';
import { createContext } from 'svelte';

export type InviteItem = {
	id: string;
	organization_id: string;
	created_by: string | null;
	expired_at: string;
	status: 'active' | 'inactive' | string;
	created_at: string;
};

export class SettingsContext {
	invites = $state<InviteItem[]>([]);
	creatingInvite = $state(false);
	processingInviteId = $state<string | null>(null);

	get orgId() {
		return page.params.orgId;
	}

	update(invites: InviteItem[]) {
		this.invites = invites;
	}

	buildInviteUrl = (inviteId: string) => {
		if (!browser) return `/invite/${inviteId}`;
		return `${window.location.origin}/invite/${inviteId}`;
	};

	generateInvite = async () => {
		if (this.creatingInvite) return;
		this.creatingInvite = true;

		try {
  		...
		} catch (error) {
			console.error(error);
		} finally {
			this.creatingInvite = false;
		}
	};
}

export const [getSettingsContext, setSettingsContext] = createContext<SettingsContext>();
```

## Backend

Modularize into router, handlers, and db layer

### Router layer

- Wrap the function in `try ... catch { throw error() }`
- Router layer is categorized into two groups: Form Action and endpoints (`+server.ts`, `+page.server.ts`)

### Form submission / Request body

Use `parseFormData` with a Zod schema, both form submission and HTTP requests with body.

```js
export function parseFormData<T extends z.ZodType>(
	formData: FormData,
	schema: T,
	arrayKeys: string[] = []
): z.ZodSafeParseResult<z.infer<T>> {
	return schema.safeParse(formDataToObject(formData, arrayKeys));
}
```

### Handler layer

Handlers are made so executions are independent of where it is placed. It could be in +page.server.ts, and one day it could be in `/api` route.
Moving only handlers are convenient for these migrations. Put handler in `$lib/server/handlers`.

### DB layer

The app uses Drizzle ORM with SQLite: local development uses `better-sqlite3`, and Cloudflare deployments use D1. Define tables with `sqliteTable` in `src/lib/server/db/schema.ts`; use the shared `Database` type and instance from `src/lib/server/db`.

Keep persistence operations in `src/lib/server/db` and call them from higher-level server functions. Prefer Drizzle's typed query builders over handwritten SQL. Keep repository functions focused and accept only the filters or fields the operation needs; do not expose arbitrary table names, columns, or SQL fragments to request data.

```ts
import { eq } from 'drizzle-orm';
import { task } from './schema';
import type { Database } from './index';

export function findTask(db: Database, id: string) {
	return db.select().from(task).where(eq(task.id, id)).get();
}

export function insertTasks(db: Database, rows: (typeof task.$inferInsert)[]) {
	return db.insert(task).values(rows).run();
}

export function updateTaskName(db: Database, id: string, name: string) {
	return db.update(task).set({ name }).where(eq(task.id, id)).run();
}

export function deleteTask(db: Database, id: string) {
	return db.delete(task).where(eq(task.id, id)).run();
}
```

Use schema-derived types such as `$inferSelect` and `$inferInsert` instead of duplicating row shapes. Put explicit, server-controlled conditions on every update and delete; never allow a missing or untrusted filter to affect every row. Prefer simple queries and avoid joins when a simpler query is clear.

Propagate database failures to the server layer and translate them there using the project's custom error classes. Do not silently swallow or disguise constraint errors.

Use Drizzle transactions for operations that must succeed or fail together, after confirming the operation is supported by both the local SQLite driver and D1. For bulk inserts, pass an array of typed rows to `.values(...)`. Keep database-specific behavior behind repository functions so callers do not depend on the selected SQLite driver.
