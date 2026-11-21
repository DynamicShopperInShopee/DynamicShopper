# PR 18 brand and chat review

Synced the existing preset branch with main at `8633c5a`, retaining the current
catalog, bounded live assistant, offline fallback, pricing and navigation work.
The original shared workspace was not modified.

The public store and receipt view keep an orange header, white DynamicShopper
wordmark and dark orange search action across all four themes. Chat can change
the body presentation. No Shopee mark or new promotion was introduced.

The root interview application forces validated direct answer mapping. It does
not run CNN inference; historical research artifacts remain in the repository.
Inspected teammate conversational work at `6944df7`; that unmerged branch still
calls the previous proposal path and was not imported into this PR.

## Validation

- Brand chat, assistant entry and purchase-decision browser suite: 18 passed at
  390×844 and 1440×900. Chat sends actual messages and checks theme, fixed colors,
  product visibility and horizontal overflow.
- Accessibility plus resolved cart/composition/capacity/Undo/interview regression:
  48 passed, 1 skipped (development-only poisoned model in production build).
  Contrast checks use WCAG 1.4.3 size/weight thresholds, retaining 4.5:1 for small
  text and 3:1 only for qualifying large text.
- Server unit suite: 328 passed, 1 skipped.
- Credential-cleared local assistant suite: 5 passed, including rejected unsafe
  requests, bounded hints, offline fallback and malformed model output.
- Production build, Svelte check (zero errors/warnings), scoped ESLint, formatting
  and git diff check passed.

Live paid-provider behavior was not tested. This is a draft awaiting independent
review; no merge into main or deployment was performed. Prior decision tools,
Smart Basket and the 177-module inspection library remain part of PR 18.
