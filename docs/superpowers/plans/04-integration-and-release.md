# Integration and release implementation plan

**Owner 4** · `feat/integration-release` · **Reviewers** Owner 3 for the journey and each producer for its contract.

**Goal.** Give three feature owners a shared starting point and give judges a working, keyless prototype with reproducible evidence. You own the handoffs and release candidate. The repository owner handles public visibility and the team submits the form.

**Architecture and stack.** Keep the existing SvelteKit, Bun, TypeScript, Vitest and Playwright toolchain. Unit tests live under `src/**/*.spec.ts`, browser component tests under `src/**/*.svelte.spec.ts`, and end-to-end tests end in `.e2e.ts`. Use the shared contracts for cross-owner tests. The public frontend uses the offline pipeline. The optional live agent runs locally.

Read [the approved design](../specs/2026-11-21-two-shopper-design.md), [AGENTS.md](../../../AGENTS.md), [System design](../../../guidelines/SYSTEM-DESIGN.md) and [Journey](../../../guidelines/JOURNEY.md). Use Executing Plans in one Sol session. Escalate cross-owner design decisions to Astra with the contract diff and a failing example.

## Start in your own checkout

> I am Owner 4. Execute docs/superpowers/plans/04-integration-and-release.md in this repo on feat/integration-release. Start with the shared contract and keyless boot. Coordinate one producer and one consumer per contract, commit and push each reviewed increment, and report the merge SHA and exact tests. Use synthetic data. Keep production publishing, visibility changes and form submission with the team.

Run `git fetch origin`, then `git switch --track origin/feat/integration-release` on first checkout, or `git switch feat/integration-release` if it exists. Run `git status --short --branch`. Start at the pushed planning commit. Confirm the documentation PR lands before merging dependent product PRs. Use a short baseline PR first. After its merge, sync this branch with main before starting the next increment. Give owners the actual baseline SHA in the PR and their assignments. For repos using squash merges, start the next PR from updated main, with a fresh branch if needed.

**Owned paths.** `src/lib/contracts.ts`, `src/lib/fixtures/`, `src/hooks.server.ts`, runtime types and configuration, `tests/e2e/`, root README and contributor rules, and submission evidence. Owners 1–3 own product code, including UI routes and the local AI route. Resolve a failing integration assertion with the owner of the failing behavior.

## Global constraints

Work only in this repository. Keep secrets, organizer materials and raw conversations out of Git and handoffs. On a fresh machine provision dependencies with `bun install --frozen-lockfile` and the required Playwright browsers before disconnecting. Use actual runtime checks for all claims. Preserve the auth demo's existing paths. Verify product behavior with no DB setup, AI key or third-party asset requests.

## Review focus

Watch for eager server imports that break anonymous startup, bilingual panes with no shared anchor, golden labels accidentally trained to match the parser, production debug capabilities reachable by request, and private release links. Each has a dedicated gate below.

### Task 1: Publish the shared contract

- [ ] Collect producer input for catalog fact identity, localized formatting and pricing from Owner 1. Collect plan, turn and ranking shapes from Owner 2. Ask Owner 3 to demonstrate how a bilingual fact element and compare pane consume them. Use named exports in `src/lib/contracts.ts`; keep these shared types free of server imports.
- [ ] Write `src/lib/fixtures/contract-sample.spec.ts`. Require a bilingual HomeKrua cooker with id `cooker-one-button`, price 690, capacity 1.8 L, shipping 50 and one unit in the basket. At the agreed opening time with the catalog vouchers and shared coin balance, expect SAVE50 and SHIP40, coins 65 and total 585. Include a Thai style request and a proposal containing both a valid minimal theme and an unknown section. Specify the surviving field and a safe dropped-field reason. Use examples as test inputs and expectations only.
- [ ] Run `bun run test:unit --run src/lib/fixtures/contract-sample.spec.ts`. See it fail on the missing fixture. Add `src/lib/fixtures/contract-sample.ts` and compile the example against the shared types. Repeat the command and run `bun run check`; record passing results or an identified starter failure separately. This fixture test proves the contract can be consumed. Owner 1 separately proves that the actual optimizer produces the expected receipt.
- [ ] Obtain producer and consumer review on type names, reference clock and fixture identity. Commit and push the baseline as a small PR. Share its merged SHA. Owners may prepare independent failing tests, layout work and golden messages while this lands. Integrate real imports against the same revision.

### Task 2: Boot the storefront without private infrastructure

- [ ] In `tests/e2e/keyless-boot.e2e.ts`, exercise anonymous storefront startup with no AI key, configured DB or auth secret. Set the test server's database path to an unusable synthetic path in a separate failure test to catch eager connection attempts. Capture the current failure or unexpected DB initialization. Use an explicit preview base URL in `playwright.config.ts` for relative navigation.
- [ ] Limit auth/DB initialization in `src/hooks.server.ts` to the routes that actually need it. Inspect the Better Auth handler paths and demo actions before scoping it. Keep both page actions and auth API entry points working. The current hook statically imports private env values. Build from a clean checkout without a .env file. If startup or build requires those values, resolve them as optional runtime configuration inside the gated auth path. Load the adapter there if its import initializes private infrastructure. Coordinate any app-local type changes with the callers.
- [ ] Run `bun run build` from the keyless clean checkout, then `./node_modules/.bin/playwright test tests/e2e/keyless-boot.e2e.ts`. Confirm the storefront returns success without creating a database and loads its own assets. In the separate configured auth demo environment, verify the login page and session-dependent redirect still work. Keep specific reproduction commands in README alongside existing demo setup instructions. Commit, push and request Owner 3 review.

### Task 3: Define independent golden cases and release checks

- [ ] Before inspecting parser output, author about sixty labeled Thai, English, mixed-language, slang and adversarial messages in `src/lib/fixtures/golden-turns.ts`. Each has a stable ID, language/group, starting state, shopper message, expected intent/plan changes or a safety-only expectation. Review the Thai wording with a teammate. Give Owner 2 the fixture and its revision for the actual evaluator. Corrections require a documented label error.
- [ ] Write `tests/e2e/journey.e2e.ts` against [Journey](../../../guidelines/JOURNEY.md). On the two-shopper path, search the same category, select the two presets, assert the shared cooker's rendered bilingual price independently, verify capacity on both listings, then compare receipts for the same quantity, balance and clock. Exercise question/decline, ranked mice, gift/compare composition, deal, Undo, Reset and Force offline. Verify public mode remains usable with outbound model traffic blocked. In a separate local development run verify the simulated hostile response and the unchanged catalog facts.
- [ ] Run `./node_modules/.bin/playwright test tests/e2e/journey.e2e.ts`; see the expected missing behavior before its owner lands the feature. Record feature dependencies in the draft PR. Once the real feature merges, rerun on that SHA. A missing surface is a release finding. On public build, exercise the would-be model endpoint directly using synthetic input and confirm no model request or development override takes effect.
- [ ] Exercise the full theme × language × viewport matrix at 1440×900 and 390×844 in `tests/e2e/accessibility.e2e.ts`. Check available controls, keyboard focus restoration, reduced motion, no page overflow, measured contrast and the 20px/48px large-print floors. Compare labels against bilingual fixtures. Keep screenshots in release evidence only when helpful and free of private content.
- [ ] Run `bun run check`, `bun run lint`, `bun run test:unit --run`, `bun run build` and `./node_modules/.bin/playwright test` on the combined candidate. Align test fixture imports and docs with any agreed contract change. Ask a different person to review and rerun the affected checks after conflict resolution. Push and record actual results, including skipped live-model runs. Keep the last passing SHA visible to all owners.

### Task 4: Rehearse and prepare one submission

- [ ] Run the six-minute script in the design on the release candidate and rehearse the fallback with internet access disabled after opening the local app. Use the keyless public prototype in a fresh browser. Demonstrate the optional local agent separately. If time tightens, freeze on the last verified commit, record missing steps, and present only what the audience can reproduce.
- [ ] Replace starter-only front-page instructions in README with the actual supported setup and a writeup covering the problem, solution, AI-Native Products & Operations direction, beneficiaries and how Codex contributed. Link one real reviewed change to its tests. Label the catalog as simulated. Record the team's new-repo declaration, actual dependencies, the verified on-site contribution and baseline. Preserve auth-demo instructions in their own section.
- [ ] Stage the prototype URL, repository link, writeup and declarations for the single Google Form. Check release contents and history for credentials, raw conversation dumps and personal activation materials using a local scan that reports filenames or counts. Escalate any hit privately to the owner before publication. The authorized publisher and repo owner handle external visibility and publishing. Reopen both public links signed out before **17:00 Bangkok on 21 November 2026**. Record who submitted and when after team confirmation.
- [ ] Hand off the candidate SHA, actual run results, signed-out link results, limits and presenter notes. Allow six minutes plus two minutes of Q&A in round one, and six plus four in the final. Completion means the team can reproduce the evidence and confirm the form submission.
