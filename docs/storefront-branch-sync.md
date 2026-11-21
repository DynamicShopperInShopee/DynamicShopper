# Hourly storefront branch sync on macOS

The LaunchAgent fetches the current `main` and `feat/catalog-pricing` at login and once an hour while the user is logged in. It pushes a clean merge of `main` to `feat/catalog-pricing` when that branch needs updating. A conflict stops the push. A concurrent update that prevents a normal push is retried on the next run. Human review controls releases to `main`.

The local `integration/storefront-demo` branch combines the owned branch with relevant open PRs, including drafts. The job reads the public GitHub API, restricts discovery to same-repository PRs targeting `main`, excludes its own branches, and checks each fetched head against the SHA reported by GitHub. It selects PRs that change the storefront, product listings, catalog, pricing, personalization, agent, harness, or their guidelines and feature specs. It considers PRs in ascending number order. This combined branch stays in a private bare repository.

The job preserves reviewed merge resolutions across normal advances to the owned branch or an included PR. A closed PR or rewritten input triggers a fresh build from the owned branch. A conflict leaves the last complete candidate available, records both parent SHAs and the affected paths, and stores the partial result under `refs/sync/partial`. Independent PRs can still join that partial result. Resolve conflicts in a separate local worktree, test the result, and seed the reviewed candidate.

## Inspect and pause

```sh
tracker="$HOME/Library/Application Support/DynamicShopper/storefront-sync"
/usr/bin/python3 -IB "$tracker/sync-storefront-integration.py" status
launchctl print "gui/$(id -u)/com.dynamicshopper.storefront-sync"
git --git-dir="$tracker/repo.git" show-ref
```

`status.json` describes the last run, including the owned and candidate SHAs, selected PR heads, conflicts, and any partial candidate. `complete.json` records the inputs to the last complete or manually seeded candidate. The scheduler checks Git object connectivity. App, browser, and live-model results must come from a separate review run. Candidate code, build scripts, hooks, and package installers never execute in the scheduled job. Public reads use HTTPS without credentials. An owned-branch push can retrieve the existing GitHub credential via Git's macOS helper. The job gives the helper read access for that operation and omits credential contents from reports.

To pause recurring work after any current run finishes:

```sh
/usr/bin/python3 -IB "$tracker/sync-storefront-integration.py" pause
```

## Install and seed a reviewed baseline

Run the fixture from the repository before installing a new runner. It uses disposable local Git repositories and includes an owned-branch conflict, a resolved merge, a later conflicting draft, a closed PR and a rewritten PR.

```sh
/usr/bin/python3 -IB scripts/sync-storefront-integration.test.py
/usr/bin/python3 -IB scripts/sync-storefront-integration.py install
```

Installation copies the reviewed runner into the private state directory and registers `~/Library/LaunchAgents/com.dynamicshopper.storefront-sync.plist`. A new installation starts paused. Reinstalling replaces the installed runner while preserving the current gate. The agent is independent of the active checkout. Future PR edits to the source runner take effect only after an explicit reinstall.

With the job paused, supply the full reviewed candidate commit, the owned branch commit it includes, and every incorporated PR head. The command checks that those inputs are ancestors of the candidate. Replace the shell variables with the worktree path and reviewed commit SHAs from the handoff. Supply one `--pr NUMBER=SHA` argument for each incorporated PR.

```sh
tracker="$HOME/Library/Application Support/DynamicShopper/storefront-sync"
/usr/bin/python3 -IB "$tracker/sync-storefront-integration.py" seed \
  --source "$review_worktree" --candidate "$candidate_sha" --owned "$owned_sha" \
  --pr "12=$harness_head" --pr "13=$listing_head"
/usr/bin/python3 -IB "$tracker/sync-storefront-integration.py" enable
```

After reviewing a new candidate's diff, run the following from the DynamicShopper repository root to create a test worktree under its ignored `.worktrees/` directory. Choose a fresh directory for each active review. The bare repository retains the previous complete ref while a newer candidate has conflicts.

```sh
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 \
  /usr/bin/git -c core.hooksPath=/dev/null --git-dir="$tracker/repo.git" \
  worktree add --detach "$PWD/.worktrees/storefront-review" refs/heads/integration/storefront-demo
```
