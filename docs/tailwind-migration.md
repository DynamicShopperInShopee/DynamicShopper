# Tailwind migration

Goal: every style that Tailwind utilities can express lives in `class` attributes.
Only CSS that Tailwind cannot express — theme token definitions, `@font-face`,
asset sprite mappings, keyframes — stays in a stylesheet.

## Milestones

| #   | Scope                                                              | Status |
| --- | ------------------------------------------------------------------ | ------ |
| 1   | Audit style sources and define conversion rules                    | done   |
| 2   | Shared tokens and global base styles in `layout.css` / `theme.css` | done   |
| 3   | Small and medium components (under 100 CSS lines)                  | done   |
| 4   | Storefront components (100–200 CSS lines)                          | done   |
| 5   | Product route components                                           | done   |
| 6   | Default storefront `src/routes/+page.svelte`                       | done   |
| 7   | Harness page `src/routes/harness/+page.svelte`                     | done   |
| 8   | Remove every `<style>` element, run check, build and e2e           | done   |

## Conversion rules

1. **Move declarations into the markup.** A rule on `.slip` becomes a class on the
   element that carries `class="slip"`.
2. **Arbitrary values keep the design tokens.** Use `text-[var(--ink)]`,
   `bg-[var(--surface,#fff)]`, `rounded-[var(--radius)]`, `min-h-[var(--tap)]`.
   Never hard-code a colour that already has a token.
3. **Scoped element selectors belong on the elements in this component.** Svelte
   scopes `h2 {}` to its own markup. Convert it by putting the utilities on each
   `h2` in that file. Do **not** use a parent `[&_h2]:…` variant for a scoped
   element rule, because that would leak into child components.
4. **`:global(...)` becomes an arbitrary descendant variant.**
   `.price :global(strong)` → `[&_strong]:text-[…]` on the `.price` element.
   `.card-body :global(.shop)` → `[&_.shop]:mt-[0.2rem]` on the card body.
   `:global(body)` moves to `src/routes/layout.css`.
5. **States become variants.** `:hover` → `hover:`, `:focus-visible` →
   `focus-visible:`, `:disabled` → `disabled:`, `[aria-pressed='true']` →
   `aria-pressed:`, `[aria-expanded='true']` → `aria-expanded:`,
   `[open]` → `open:`, `::backdrop` → `backdrop:`.
6. **`[hidden]` needs an explicit variant.** `X[hidden] { display: none }` →
   add `[&[hidden]]:hidden` to the element (utilities otherwise override the
   browser's `hidden` behaviour).
7. **Ancestor state uses a named group.** Add `group/store` to the element that
   owns the state and use `group-data-[theme='large']/store:…`,
   `group-data-[density='compact']/store:…`,
   `group-data-[trace-open='true']/store:…`,
   `group-[.event-demo]/store:…`. Add a `data-*` attribute only for state the
   component already knows; never change logic.
8. **Media queries use responsive variants.** `@media (max-width: 760px)` →
   `max-[760px]:`. `@media (min-width: 1024px)` → `min-[1024px]:`.
9. **Pseudo-element content uses `before:`/`after:`**, for example
   `after:absolute after:inset-0 after:content-['']`.
10. **Dynamic class names stay as `class:` directives.** Never build a class
    string from a lookup object (repository rule).
11. **No `<style>` element may remain in a component.** Convert everything a
    utility can express. Anything that genuinely cannot be a utility
    (`@font-face`, inherited custom-property token blocks, `@keyframes`,
    sprite/asset URL maps, a cross-component `:global` selector) moves to a
    shared stylesheet (`theme.css` / `layout.css` / an asset CSS file), never
    stays inline in the component.
12. **No visual change.** Same spacing, sizes, colours, breakpoints and states.
    Do not rename classes that a test or other file targets without checking.

## Token locations

- `src/routes/layout.css` — Tailwind import plus `@layer base` resets that are
  truly global (`body` margin, focus-visible ring on interactive controls).
- `src/lib/storefront/theme.css` — receipt theme tokens (`[data-storefront-theme]`)
  and the default storefront token aliases (`.store[data-theme]`).
- `src/lib/assets/products/*.css` — product photo sprite maps (not convertible).
- `src/lib/assets/fonts/plex.css` — `@font-face` (not convertible).

## Integration decisions and verification

- Accepted: keep reusable theme custom properties in `theme.css` and put component
  presentation in literal Tailwind classes. Existing measured, runtime ranking-bar
  widths may remain as style directives; no Svelte `<style>` element remains.
- Resolved: preserve inclusive media boundaries with arbitrary media variants and
  use explicit length hints for variable font sizes. Keep selector specificity
  where the original cascade distinguishes marketplace and receipt layouts.
- Resolved: Svelte server rendering can double-escape ampersands in literal class
  attributes used with class directives or bound selects. Selector utilities use
  literal class arrays or multiline literals so server and browser classes agree.
- Resolved: component tests load the same Tailwind stylesheet and theme tokens as
  the application. The Cart trigger retains the 44px/48px theme target.
- Existing lint concerns: two CriteriaOverview script rules (reactive Map and
  FormData stringification), the root category callback typing rule, and the
  listing-header navigation rule remain. Their script ASTs are unchanged from
  the baseline; the migration introduces no new lint errors.
- Independent component and integration reviews covered the storefront, product
  pages, harness, comparison and search controls against the pre-migration tree.
- Validation: Node production build; Svelte check with zero errors and warnings;
  377 unit/component tests passed, with the opt-in live API test skipped.
- Full offline production browser suite: 148 passed; the development-only poison
  check is skipped in production and passed separately on a keyless development server.
- Phone and laptop snapshots of the public storefront, receipt view, harness and
  both cooker listings matched the baseline. Additional component comparisons
  covered all themes, both languages, open sheets and exact responsive boundaries.

Temporary comparison runners and images live outside the repository. Dependencies
were restored from the existing lockfile; no library was added.
