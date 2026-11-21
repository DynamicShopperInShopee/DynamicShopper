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

| Owner and plan | Skills and tools |
| --- | --- |
| 1 · [Catalog and pricing](superpowers/plans/01-catalog-and-pricing.md) | Superpowers Executing Plans and Test-Driven Development. Use Vitest's `server` project for fact resolution, voucher eligibility and exact totals. |
| 2 · [Personalization and agent](superpowers/plans/02-personalization-and-agent.md) | Superpowers Executing Plans, Test-Driven Development and Systematic Debugging. Use synthetic model responses and the real validator before an optional local live-model rehearsal. |
| 3 · [Storefront and proof](superpowers/plans/03-storefront-and-proof.md) | Superpowers Executing Plans and Verification Before Completion. Impeccable is optional for a visual or accessibility review using the existing receipt design. Use the project's Playwright dependency for rendered facts and mobile checks. |
| 4 · [Integration and release](superpowers/plans/04-integration-and-release.md) | Superpowers Requesting Code Review, Systematic Debugging and Verification Before Completion. Use the existing Git remote and Playwright for the combined journey and signed-out prototype check. |

Give any subagent one task and its relevant paths, test vector and expected output. Parallel reviews can read the same checkout. Parallel writers need distinct paths or separate checkouts and an agreed contract. A handoff contains the baseline SHA, changed paths, the command and actual result, and any open decision.

## Branch and security checks

- Fetch the project's configured `origin`. Switch to your own feature branch and merge `origin/main` there. Sync again before review. Push scoped commits to your own branch and use a reviewed PR for integration.
- Keep Codex scoped to this repo. Use the existing local Git workflow and approve only specific actions needed for a check or push. Keep secrets, personal files and unrelated repositories outside the agent workspace. Keep unrelated connectors disabled for this task.
- After a PR merges, fetch origin and merge `origin/main` into your working branch. Check `git diff --stat origin/main...HEAD` before starting another task, and open a separate PR for that task.
- Review the staged files with `git diff --cached --name-only` and `git diff --cached --check` before committing. Keep the organizer PDF, access materials, private environment files, raw prompts, logs and real conversations out of Git and agent handoffs. Prefer synthetic sentinel values in tests and share test results without dumping process environment or credentials.
- The public prototype runs keyless. For the optional local agent, keep credentials in private server configuration and keep prices out of the entire serialized model request, including history and tool responses. X-ray shows only allowlisted summaries. Force offline is available in every build and the poisoned-response switch belongs to development. Treat model output, shared links and restored state as untrusted inputs.
- If a secret reaches a commit, stop its push or publication and notify the owner privately. Rotate the exposed value if it left the local machine. Coordinate any history cleanup with the repo owner.
