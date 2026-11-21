# Editing the interview reading choice

Baseline: `6775f46`. Separate from automatic interview completion PR #29; this change does not merge or depend on that branch.

Problem: after selecting Large text, editing the interview to Balanced, Compact or More space left the shop in large-print mode. Its accessibility rule also forced spacious spacing, overriding the shopper's new answer.

Decision: an explicit non-large reading answer leaves large-print mode for the standard theme and applies the chosen spacing. Skipping preserves the current mode. Other themes are unaffected. This direct preference edit makes no model calls and adds no theme chooser.

Checks: three mapping regressions failed before the fix. Full server suite then passed 363 tests with one opt-in live test skipped. A credential-cleared local browser journey passed: Large text → edit Compact → standard/compact → Undo restores large/spacious. Scoped ESLint and diff checks passed. Broader production/type/accessibility checks remain pending for this independent branch.

The browser test supports both the current main preview gate and PR #29's automatic completion so either PR may be reviewed independently. No provider, pricing, catalog or main route implementation changed.

User instruction: leave the PR unmerged and do not deploy.
