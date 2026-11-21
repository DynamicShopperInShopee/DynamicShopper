# DynamicShopper team setup

Use one checkout of DynamicShopper and one working branch per owner. Keep your existing branch or create one from `origin/main`. Open only that checkout in Codex. Each person starts with their assignment's prompt, [AGENTS.md](../AGENTS.md) and the guidelines linked from their plan.

## Required tools

Install Git, Node.js, Bun and your preferred Codex client. Use Git access scoped to the DynamicShopper repository. Record the Node and Bun versions that pass the checks on the shared baseline in the integration PR so the team can reproduce that setup. No additional Codex plugin or external account connection is required for the keyless workflow.

```sh
git fetch origin
git status --short --branch
node --version
bun --version
bun install --frozen-lockfile
```

Owners 3 and 4 provision Chromium once with `./node_modules/.bin/playwright install chromium` before browser tests. Run `./node_modules/.bin/playwright test` to reuse installed browsers during the offline rehearsal. Owner 1 can run the catalog/pricing server tests without a browser. Owner 2 can run the fallback and agent tests with synthetic responses and a fake transport. Use just the setup needed for your current task.

## Suggested Codex skills

Use Sol for implementation and Astra for a shared contract, an ambiguous failure or a cross-branch review. If Superpowers is available in your Codex client, its skills below match the team's existing plans. The plans also list the test and review steps directly.

| Owner and plan                                                                     | Skills and tools                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 · [Catalog and pricing](superpowers/plans/01-catalog-and-pricing.md)             | Superpowers Executing Plans and Test-Driven Development. Use Vitest's `server` project for fact resolution, voucher eligibility and exact totals.                                                                                            |
| 2 · [Personalization and agent](superpowers/plans/02-personalization-and-agent.md) | Superpowers Executing Plans, Test-Driven Development and Systematic Debugging. Use synthetic model responses and the real validator before an optional local live-model rehearsal.                                                           |
| 3 · [Storefront and proof](superpowers/plans/03-storefront-and-proof.md)           | Superpowers Executing Plans and Verification Before Completion. Impeccable is optional for a visual or accessibility review using the existing receipt design. Use the project's Playwright dependency for rendered facts and mobile checks. |
| 4 · [Integration and release](superpowers/plans/04-integration-and-release.md)     | Superpowers Requesting Code Review, Systematic Debugging and Verification Before Completion. Use the existing Git remote and Playwright for the combined journey and signed-out prototype check.                                             |

Give any subagent one task and its relevant paths, test vector and expected output. Parallel reviews can read the same checkout. Parallel writers need distinct paths or separate checkouts and an agreed contract. A handoff contains the baseline SHA, changed paths, the command and actual result, and any open decision.

## From assignment to main

1. **Sync and check ownership.** On your assigned branch, run `git fetch --prune origin`, `git status --short --branch`, and `git merge origin/main`. Review `git diff --stat origin/main...HEAD` and the open PRs. If another PR touches the same route, name the shared paths and agree on who lands first. Resolve a contract change with its producer and one affected consumer before implementing against it.
2. **Define an observable result.** Write the shopper task, what the change should improve, and the acceptance check in your assignment or PR. For a bug, reproduce it on the agreed baseline before the fix. Give one scoped job to each implementing agent, then have a separate reviewer inspect the resulting diff.
3. **Run the closest checks while developing.** Use focused unit tests for domain changes. For interface changes, reproduce the case in the browser at laptop and phone sizes. Verify the same catalog facts, offline behavior, both languages, and recovery with Undo where applicable. Update the associated guideline and the README if entry points or commands change.
4. **Push and review the combined result.** Commit the feature, its tests and relevant docs together in reviewable increments. Push to your assigned branch and open or update its draft PR against `main`. Record the base and head SHAs, commands and actual results, known baseline failures, conflicting paths, and rollout state. Use the repository's Codex review for additional feedback and have a teammate review the changes. Sync with main and rerun the affected checks on the final combined tree before merging.
5. **Verify the served revision.** The integration owner checks the remote preview for the PR head and the production deployment for the merged SHA. A local Wrangler dry run verifies the deployable bundle. The remote build result and a signed-out smoke test verify the hosted artifact. For a preview failure, record its SHA and share the minimal relevant build error after redaction.

### Verification commands

Run the relevant subset on each small change and use the full set for the release candidate. The production browser tests cover `/` and `/?view=receipt`. The local assistant Playwright configuration clears provider credentials and uses synthetic responses.

```sh
bun run check
./node_modules/.bin/vitest run
OPENAI_API_KEY='' OPENAI_MODEL='' ./node_modules/.bin/playwright test
./node_modules/.bin/playwright test --config playwright.local.config.ts
CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false OPENAI_API_KEY='' OPENAI_MODEL='' bun run build:d1
CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV=false ./node_modules/.bin/wrangler deploy --dry-run
```

For a UI review, capture one before-and-after shopper task on mobile and desktop. For an opt-in live OpenAI check, use the separate loopback procedure in the [README](../README.md#optional-local-openai-test). Record the reported tokens and estimate alongside the observed presentation result when relevant.

## Branch and security checks

The [hourly storefront branch sync](storefront-branch-sync.md) documents how to inspect the Mac tracker, pause it, and test its local integration candidate.

- Fetch the project's configured `origin`. Switch to your own feature branch and merge `origin/main` there. Sync again before review. Push scoped commits to your own branch and use a reviewed PR for integration.
- Keep Codex scoped to this repo. Use the existing local Git workflow and approve only specific actions needed for a check or push. Keep secrets, personal files and unrelated repositories outside the agent workspace. Keep unrelated connectors disabled for this task.
- After a PR merges, fetch origin and merge `origin/main` into your working branch. Check `git diff --stat origin/main...HEAD` before starting another task, and open a separate PR for that task.
- Review the staged files with `git diff --cached --name-only` and `git diff --cached --check` before committing. Keep the organizer PDF, access materials, private environment files, raw prompts, logs and real conversations out of Git and agent handoffs. Prefer synthetic sentinel values in tests and share test results without dumping process environment or credentials.
- The public storefront runs offline or uses its bounded, server-side OpenAI connection. For the optional local agent, keep credentials in private server configuration and keep prices out of the entire serialized model request, including history and tool responses. X-ray shows only allowlisted summaries. Force offline is available in every build and the poisoned-response switch belongs to development. Treat model output, shared links and restored state as untrusted inputs.
- If a secret reaches a commit, stop its push or publication and notify the owner privately. Rotate the exposed value if it left the local machine. Coordinate any history cleanup with the repo owner.
