"""Offline fixture for the recurring job. Uses only disposable local Git repositories."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

MODULE = Path(__file__).with_name("sync-storefront-integration.py")
spec = importlib.util.spec_from_file_location("tracker", MODULE)
tracker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(tracker)


class SyncTest(unittest.TestCase):
    def setUp(self):
        area = tempfile.TemporaryDirectory(prefix="dynamicshopper-sync-")
        self.addCleanup(area.cleanup)
        root = Path(area.name)
        self.checkout = root / "checkout"
        self.origin = root / "origin.git"
        self.state = root / "state"
        self.state.mkdir()
        self.checkout.mkdir()
        self.prs = []
        scoped = patch.multiple(
            tracker, ROOT=self.state, REPO=self.state / "repo.git", REMOTE=str(self.origin),
            GIT_OPTIONS=[*tracker.GIT_OPTIONS, "-c", "protocol.file.allow=always"],
            pulls=lambda: iter(self.prs),
            review_checks=lambda number, sha: {"review": [], "checks": [], "status": "pending"},
        )
        scoped.start()
        self.addCleanup(scoped.stop)
        self.git("init", "--bare", self.origin)
        self.git("init", "-b", "main")
        self.git("remote", "add", "origin", self.origin)
        self.commit("README.md", "base")
        self.git("branch", tracker.OWNED)
        self.git("switch", tracker.OWNED)
        self.owned = self.commit("owner.txt", "owned")
        self.git("switch", "main")
        self.main = self.commit("platform.txt", "main")
        self.git("push", "origin", "main", tracker.OWNED)

    def git(self, *args):
        return subprocess.run(
            ["/usr/bin/git", "-c", "protocol.file.allow=always", "-c", "user.name=Fixture",
             "-c", "user.email=fixture@localhost.invalid", "-c", "core.hooksPath=/dev/null", *args],
            cwd=self.checkout, env=tracker.GIT_ENV, capture_output=True, text=True, check=True,
        ).stdout.strip()

    def commit(self, path, content):
        target = self.checkout / path
        target.parent.mkdir(exist_ok=True, parents=True)
        target.write_text(content + "\n")
        self.git("add", path)
        self.git("commit", "-m", "Update " + path)
        return self.git("rev-parse", "HEAD")

    def pull(self, number, path, content, fork=False):
        self.git("switch", "-C", "feature", self.main)
        sha = self.commit(path, content)
        self.git("push", "origin", f"{sha}:refs/pull/{number}/head")
        self.prs.append({
            "number": number, "base": {"ref": "main"}, "draft": True,
            "head": {"repo": {"full_name": "example/fork" if fork else tracker.PROJECT},
                     "sha": sha, "ref": "feature"},
        })
        return sha

    def sync(self):
        report = {}
        tracker.sync(report)
        return report

    def test_reviewed_resolutions_survive_advances_and_conflicts(self):
        harness = "src/lib/harness/store.ts"
        listing = "src/lib/storefront/receipt.ts"
        first = self.pull(12, harness, "harness")
        other = self.pull(13, listing, "listing")
        conflict = self.pull(14, harness, "another implementation")
        self.pull(15, "unrelated.txt", "outside scope")
        self.pull(16, harness, "fork", fork=True)
        tracker.prepare_repo()
        hooks = tracker.REPO / "hooks"
        hooks.mkdir()
        pre_push = hooks / "pre-push"
        pre_push.write_text("#!/bin/sh\nexit 1\n")
        pre_push.chmod(0o700)

        initial = self.sync()
        owned = self.git("--git-dir", self.origin, "rev-parse", "refs/heads/" + tracker.OWNED)
        self.assertEqual(self.git("--git-dir", self.origin, "rev-parse", "main"), self.main)
        self.assertEqual(self.git("--git-dir", self.origin, "rev-parse", owned + "^1"), self.owned)
        self.assertEqual(self.git("--git-dir", self.origin, "rev-parse", owned + "^2"), self.main)
        self.assertFalse(self.git("--git-dir", self.origin, "for-each-ref", "refs/heads/integration/"))
        self.assertEqual(set(initial["selected"]), {"12", "13", "14"})
        self.assertIsNone(initial["candidate"])
        self.assertEqual(initial["conflicts"][0]["files"], [harness])
        self.assertEqual(tracker.tip("refs/sync/partial"), initial["partial"])

        self.git("fetch", "origin", tracker.OWNED)
        self.git("switch", "-C", "reviewed", owned)
        self.git("merge", "--no-edit", first, other)
        self.git("merge", "--no-commit", "--no-ff", "-X", "ours", conflict)
        reviewed = self.commit(harness, "human resolution")
        tracker.seed(self.checkout, reviewed, owned, initial["selected"])
        self.assertEqual(self.sync()["candidate"], reviewed)

        self.git("switch", "-C", "advance", first)
        advanced = self.commit("src/lib/harness/next.ts", "new work")
        self.git("push", "origin", advanced + ":refs/pull/12/head")
        self.prs[0]["head"]["sha"] = advanced
        self.git("switch", "main")
        self.main = self.commit("onmain.txt", "updated main")
        self.git("push", "origin", "main")
        carried = self.sync()["candidate"]
        self.assertEqual(self.git("--git-dir", tracker.REPO, "show", carried + ":" + harness), "human resolution")
        self.assertEqual(self.git("--git-dir", tracker.REPO, "show", carried + ":onmain.txt"), "updated main")
        self.assertTrue(tracker.ancestor(advanced, carried))

        self.pull(17, harness, "conflicting new PR")
        self.pull(18, "guidelines/JOURNEY.md", "new experience")
        pending = self.sync()
        self.assertEqual(pending["candidate"], carried)
        self.assertNotEqual(pending["partial"], carried)
        self.assertEqual(tracker.tip("refs/heads/" + tracker.LOCAL), carried)
        self.assertIn("18", pending["selected"])
        self.assertEqual(
            self.git("--git-dir", tracker.REPO, "show", pending["partial"] + ":guidelines/JOURNEY.md"),
            "new experience",
        )

        self.prs[:] = [pr for pr in self.prs if pr["number"] in (13, 18)]
        rebuilt = self.sync()["candidate"]
        self.assertFalse(self.git("--git-dir", tracker.REPO, "ls-tree", rebuilt, "src/lib/harness/"))
        self.git("switch", "-C", "rewrite", self.main)
        rewritten = self.commit("src/lib/storefront/replaced.ts", "replaced")
        # Simulate a collaborator rewriting their source PR in the disposable origin.
        self.git("push", "origin", "--delete", "refs/pull/13/head")
        self.git("push", "origin", rewritten + ":refs/pull/13/head")
        self.prs[0]["head"]["sha"] = rewritten
        self.assertFalse(self.git("--git-dir", tracker.REPO, "ls-tree", self.sync()["candidate"], listing))

    def test_owned_conflict_never_updates_the_remote(self):
        self.git("switch", tracker.OWNED)
        owned = self.commit("collision.txt", "owned work")
        self.git("push", "origin", tracker.OWNED)
        self.git("switch", "main")
        main = self.commit("collision.txt", "main work")
        self.git("push", "origin", "main")
        report = self.sync()
        self.assertEqual(report["conflicts"][0]["files"], ["collision.txt"])
        self.assertEqual(self.git("--git-dir", self.origin, "rev-parse", tracker.OWNED), owned)
        self.assertEqual(self.git("--git-dir", self.origin, "rev-parse", "main"), main)

    def test_activity_includes_drafts_and_other_bases_even_when_owned_branch_conflicts(self):
        self.git("switch", tracker.OWNED)
        self.commit("collision.txt", "owner")
        self.git("push", "origin", tracker.OWNED)
        self.git("switch", "main")
        self.commit("collision.txt", "collaborator")
        self.git("push", "origin", "main")
        self.pull(21, "docs/a.md", "fixture", fork=True)
        self.prs[0]["base"]["ref"] = "feature"
        report = self.sync()
        self.assertEqual(report["pr_activity"], {"21": ["opened"]})
        self.assertEqual(self.sync()["pr_activity"], {})
        self.prs[0].update(draft=False, updated_at="2026-11-21T00:00:00Z", body="private prose")
        with patch.object(tracker, "review_checks", return_value={
            "review": [[123, "CHANGES_REQUESTED"]], "checks": [[456, "completed", "failure"]], "status": "failure"
        }):
            changed = self.sync()
        self.assertEqual(set(changed["pr_activity"]["21"]), {"draft", "updated", "review", "checks", "status"})
        self.assertNotIn("private prose", (self.state / "pr-activity.json").read_text())
        self.prs.clear()
        self.assertEqual(self.sync()["pr_activity"], {"21": ["closed"]})

    def test_paused_job_performs_no_git_or_network_operations(self):
        with patch.object(tracker, "sync", side_effect=AssertionError("Unexpected sync")):
            self.assertEqual(tracker.run(), 0)
        self.assertFalse(tracker.REPO.exists())
        self.assertEqual(tracker.read_json("status.json")["result"], "waiting for reviewed baseline")


if __name__ == "__main__":
    unittest.main()
