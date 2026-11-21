"""Sync main into the owned branch and assemble open storefront PRs locally."""
import argparse
import datetime
import fcntl
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
import urllib.request

PROJECT = "DynamicShopperInShopee/DynamicShopper"
REMOTE = f"https://github.com/{PROJECT}.git"
OWNED = "feat/catalog-pricing"
LOCAL = "integration/storefront-demo"
LABEL = "com.dynamicshopper.storefront-sync"
ROOT = Path.home() / "Library/Application Support/DynamicShopper/storefront-sync"
REPO = ROOT / "repo.git"
PLIST = Path.home() / "Library/LaunchAgents" / (LABEL + ".plist")
RUNNER = ROOT / "sync-storefront-integration.py"
DOMAIN = f"gui/{os.getuid()}"
GIT_OPTIONS = [
    "-c", "core.hooksPath=/dev/null", "-c", "core.attributesFile=/dev/null",
    "-c", "credential.helper=!f() { if test \"$1\" = get; then /usr/bin/git credential-osxkeychain get; fi; }; f",
    "-c", "http.followRedirects=false", "-c", "protocol.allow=never",
    "-c", "protocol.https.allow=always", "-c", "gc.auto=0",
]
GIT_ENV = {
    "PATH": "/usr/bin:/bin", "HOME": str(Path.home()), "LC_ALL": "C",
    "GIT_CONFIG_GLOBAL": "/dev/null", "GIT_CONFIG_NOSYSTEM": "1",
    "GIT_ATTR_NOSYSTEM": "1", "GIT_NO_REPLACE_OBJECTS": "1",
    "GIT_TERMINAL_PROMPT": "0", "GIT_ASKPASS": "/usr/bin/false",
    "GIT_AUTHOR_NAME": "DynamicShopper branch sync", "GIT_COMMITTER_NAME": "DynamicShopper branch sync",
    "GIT_AUTHOR_EMAIL": "branch-sync@localhost.invalid", "GIT_COMMITTER_EMAIL": "branch-sync@localhost.invalid",
}
# Only PRs touching the storefront or the catalog, pricing and agent paths it consumes.
PATHS = [
    "guidelines/", "docs/superpowers/specs/", "docs/superpowers/plans/", "docs/handoff/",
    "SPEC.md", "PRODUCT.md", "DESIGN.md", "AGENTS.md",
    "src/routes/+page.svelte", "src/routes/+layout.svelte", "src/routes/layout.css",
    ":(top,glob)src/routes/*.svelte", ":(top,glob)src/routes/*.e2e.ts", "src/routes/product/",
    "src/routes/harness/",
    "src/routes/api/assistant/", "src/routes/api/local-assistant/", "src/routes/search-navigation.ts",
    "src/lib/storefront/", "src/lib/personalization/", "src/lib/harness/", "src/lib/harness-ui/",
    "src/lib/server/agent/", "src/lib/server/live-assistant/", "src/lib/server/handlers/assistant.ts",
    "src/lib/catalog/", "src/lib/pricing/", "src/lib/assets/products/",
    "src/lib/store-search.ts", "src/lib/store-catalog.ts",
]


def git(*args, check=True, data=None):
    result = subprocess.run(
        ["/usr/bin/git", *GIT_OPTIONS, *args], cwd=REPO, env=GIT_ENV,
        input=data, capture_output=True, encoding="utf-8", errors="replace", timeout=180,
    )
    if check and result.returncode:
        raise RuntimeError(f"git {args[0]}: {result.stderr.strip()[:1200]}")
    return result


def tip(ref):
    return git("rev-parse", "--verify", ref + "^{commit}").stdout.strip()


def ancestor(older, newer):
    result = git("merge-base", "--is-ancestor", older, newer, check=False)
    if result.returncode not in (0, 1):
        raise RuntimeError("Failed to compare Git histories")
    return result.returncode == 0


def merge(left, right, label, conflicts):
    if ancestor(right, left):
        return left
    if ancestor(left, right):
        return right
    result = git("merge-tree", "--write-tree", "--name-only", "-z", left, right, check=False)
    if result.returncode == 1:
        entries = result.stdout.split("\0\0", 1)[0].split("\0")
        conflicts.append({"source": label, "left": left, "right": right, "files": entries[1:]})
        return None
    if result.returncode:
        raise RuntimeError("Git could not merge " + label)
    tree = result.stdout.split("\0", 1)[0].strip()
    return git("commit-tree", tree, "-p", left, "-p", right, "-m", "Merge " + label).stdout.strip()


def pulls():
    for page in range(1, 101):
        url = f"https://api.github.com/repos/{PROJECT}/pulls?state=open&base=main&per_page=100&page={page}"
        request = urllib.request.Request(url, headers={"User-Agent": LABEL})
        with urllib.request.urlopen(request, timeout=30) as response:
            items = json.load(response)
        if not isinstance(items, list):
            raise RuntimeError("Invalid pull request listing")
        yield from items
        if len(items) < 100:
            return
    raise RuntimeError("Pull request listing exceeded the page limit")


def fetch(*refspecs):
    git("-c", "credential.helper=", "fetch", "--no-tags", "--no-recurse-submodules",
        "--no-write-fetch-head", REMOTE, *refspecs)


def prepare_repo():
    REPO.mkdir(exist_ok=True)
    if not (REPO / "HEAD").exists():
        git("init", "--bare", "--template=")


def read_json(name):
    path = ROOT / name
    return json.loads(path.read_text()) if path.is_file() else {}


def save_json(name, record):
    temporary = ROOT / (name + ".tmp")
    temporary.write_text(json.dumps(record, indent=2) + "\n")
    temporary.replace(ROOT / name)


def publish_complete(candidate, owned, selected):
    complete = {"candidate": candidate, "owned": owned, "selected": selected}
    git("fsck", "--connectivity-only", "--no-dangling", candidate)
    manifest = git("hash-object", "-w", "--stdin", data=json.dumps(complete)).stdout.strip()
    git("update-ref", "--stdin", data=(
        f"update refs/heads/{LOCAL} {candidate}\nupdate refs/sync/manifest {manifest}\n"
        "delete refs/sync/partial\n"
    ))
    save_json("complete.json", complete)


def seed(source, candidate, owned, selected):
    hashes = [candidate, owned, *selected.values()]
    if not source.is_dir() or not all(re.fullmatch(r"[0-9a-f]{40}", sha) for sha in hashes):
        raise ValueError("Seed needs a local checkout and full commit SHAs")
    prepare_repo()
    git("-c", "protocol.file.allow=always", "fetch", "--no-tags", "--no-recurse-submodules",
        "--no-write-fetch-head", str(source.resolve()), candidate)
    if not all(ancestor(sha, candidate) for sha in [owned, *selected.values()]):
        raise ValueError("The reviewed candidate does not include every declared input")
    publish_complete(candidate, owned, selected)


def sync(report):
    prepare_repo()
    fetch("+refs/heads/main:refs/sync/main", f"+refs/heads/{OWNED}:refs/sync/owned")
    main, owned = tip("refs/sync/main"), tip("refs/sync/owned")
    conflicts = report["conflicts"] = []
    merged = merge(owned, main, "origin/main", conflicts)
    report.update(main=main, owned_before=owned)
    if merged is None:
        report["result"] = "owned branch needs conflict resolution"
        return
    if merged != owned:
        # No force, no wildcard, one hard-coded destination. A concurrent push fails safely.
        git("push", "--no-verify", "--porcelain", REMOTE, f"{merged}:refs/heads/{OWNED}")
    report["owned"] = merged
    included = report["included"] = []
    selected = {}
    for pr in sorted(pulls(), key=lambda item: item["number"]):
        head = pr["head"]
        if (pr["base"]["ref"] != "main" or head["ref"] in {OWNED, LOCAL} or
                (head["repo"] or {}).get("full_name") != PROJECT):
            continue
        number, sha = pr["number"], head["sha"]
        if type(number) is not int or number <= 0 or not re.fullmatch(r"[0-9a-f]{40}", sha):
            raise ValueError("Invalid PR identity")
        ref = f"refs/sync/pr/{number}"
        fetch(f"+refs/pull/{number}/head:{ref}")
        if tip(ref) != sha:
            raise RuntimeError(f"PR #{number} changed during discovery. Retry next run.")
        if git("diff", "--name-only", "--no-ext-diff", main + "..." + sha, "--", *PATHS).stdout:
            selected[str(number)] = sha

    report["selected"] = selected
    manifest = git("show-ref", "--verify", "--quiet", "refs/sync/manifest", check=False)
    previous = json.loads(git("cat-file", "blob", "refs/sync/manifest").stdout) if manifest.returncode == 0 else {}
    candidate = merged
    report["candidate"] = previous.get("candidate")
    if previous:
        if tip("refs/heads/" + LOCAL) != previous["candidate"]:
            raise RuntimeError("Candidate ref changed outside the scheduler. Seed its reviewed inputs again.")
        # Keep human resolutions on normal advances. Removing or replacing an input
        # requires a fresh tree so obsolete work cannot leak into the next candidate.
        if (ancestor(previous["owned"], merged) and
                all(n in selected and ancestor(old, selected[n]) for n, old in previous["selected"].items())):
            carried = merge(previous["candidate"], merged, "updated owned branch", conflicts)
            if carried:
                candidate = carried
            else:
                git("update-ref", "refs/sync/partial", merged)
                report.update(partial=merged, result="owned update conflicts with reviewed candidate")
                return
    for number, sha in selected.items():
        next_tip = merge(candidate, sha, "PR #" + number, conflicts)
        if next_tip:
            candidate = next_tip
            included.append(int(number))
    if conflicts:
        git("fsck", "--connectivity-only", "--no-dangling", candidate)
        git("update-ref", "refs/sync/partial", candidate)
        report.update(partial=candidate, result="partial candidate; see conflicts")
    else:
        publish_complete(candidate, merged, selected)
        report.update(candidate=candidate, result="candidate ready")


def run():
    ROOT.mkdir(parents=True, exist_ok=True)
    with (ROOT / "run.lock").open("a") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            return 0
        report = {"time": datetime.datetime.now(datetime.timezone.utc).isoformat()}
        try:
            if (ROOT / "enabled").is_file():
                sync(report)
            else:
                report["result"] = "paused" if (ROOT / "complete.json").is_file() else "waiting for reviewed baseline"
        except Exception as error:
            report.update(result="sync failed", error=str(error))
        save_json("status.json", report)
        return int(report["result"] == "sync failed")


def install():
    ROOT.mkdir(mode=0o700, parents=True, exist_ok=True)
    if Path(__file__).resolve() != RUNNER:
        shutil.copyfile(__file__, ROOT / ".runner.tmp")
        (ROOT / ".runner.tmp").replace(RUNNER)
    PLIST.parent.mkdir(exist_ok=True)
    PLIST.write_bytes(plistlib.dumps({
        "Label": LABEL, "ProgramArguments": ["/usr/bin/python3", "-I", str(RUNNER), "run"],
        "RunAtLoad": True, "StartInterval": 3600,
        "StandardErrorPath": str(ROOT / "launchd-errors.log"),
    }))
    if subprocess.run(["/bin/launchctl", "print", DOMAIN + "/" + LABEL], capture_output=True).returncode == 0:
        subprocess.run(["/bin/launchctl", "bootout", DOMAIN + "/" + LABEL], check=True)
    subprocess.run(["/bin/launchctl", "bootstrap", DOMAIN, str(PLIST)], check=True)


if __name__ == "__main__":
    os.umask(0o077)
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for name in ("install", "enable", "pause", "run", "status"):
        commands.add_parser(name)
    seeding = commands.add_parser("seed")
    seeding.add_argument("--source", type=Path, required=True)
    seeding.add_argument("--candidate", required=True)
    seeding.add_argument("--owned", required=True)
    seeding.add_argument("--pr", action="append", default=[], metavar="NUMBER=SHA")
    args = parser.parse_args()
    command = args.command
    if command == "install":
        install()
    elif command in {"seed", "pause", "enable"}:
        with (ROOT / "run.lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            if command == "seed":
                selected = dict(item.split("=", 1) for item in args.pr)
                if not all(re.fullmatch(r"[1-9][0-9]*", n) for n in selected):
                    parser.error("Invalid PR number")
                seed(args.source, args.candidate, args.owned, selected)
            elif command == "pause":
                (ROOT / "enabled").unlink(missing_ok=True)
            else:
                if not (ROOT / "complete.json").is_file():
                    parser.error("Seed a reviewed baseline before enabling branch sync")
                (ROOT / "enabled").touch()
        if command != "seed":
            subprocess.run(["/bin/launchctl", "kickstart", DOMAIN + "/" + LABEL], check=True)
    elif command == "status":
        print((ROOT / "status.json").read_text(), end="")
    else:
        sys.exit(run())
