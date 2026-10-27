#!/usr/bin/env python3
"""
Deploy the sc-demo dist to GitHub Pages via the GitHub REST API.

Usage (run from repo root):
    python3 scripts/deploy_gh_pages.py

Requires GITHUB_TOKEN env var with at least `repo` scope (no `workflow` scope needed).

What it does:
1. Builds the sc-demo Vite app for production
2. Uploads the dist/public directory as blobs to GitHub
3. Creates an orphan commit on the `pages-deploy` branch
4. Switches GitHub Pages source to that branch (if not already set)

GitHub Pages config: source branch = `pages-deploy`, path = `/`
Repo: https://github.com/JoeNugent512/SNC_Wireframe
Live site: https://joenugent512.github.io/SNC_Wireframe/

Troubleshooting:
- If Pages shows "errored" and the build timestamp is stale (unchanged for 10+ min),
  go to https://github.com/JoeNugent512/SNC_Wireframe/settings/pages, change the
  source branch to something else, click Save, then change it back and Save again.
  This resets GitHub's build pipeline for the repo.
- The GITHUB_TOKEN does NOT need `workflow` scope for this script.
  However, commits that include .github/workflows/*.yml files DO require that scope
  for `git push`. The workflow file (if any) must be removed from local git history
  or the token must be updated.
"""

import os
import json
import base64
import pathlib
import subprocess
import urllib.request
import urllib.error
import datetime
import sys

OWNER  = "JoeNugent512"
REPO   = "SNC_Wireframe"
BRANCH = "pages-deploy"
DIST   = pathlib.Path(__file__).parent.parent / "artifacts/sc-demo/dist/public"
BUILD_CMD = [
    "pnpm", "--filter", "@workspace/sc-demo", "run", "build",
]
BUILD_ENV = {
    **os.environ,
    "PORT": "3000",
    "BASE_PATH": "/SNC_Wireframe/",
    "NODE_ENV": "production",
}


def api(method, path, body=None, token=None):
    url = f"https://api.github.com/repos/{OWNER}/{REPO}{path}"
    headers = {
        "Authorization": f"Bearer {token or os.environ['GITHUB_TOKEN']}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        raise RuntimeError(f"GitHub API {method} {path} → {e.code}: {err[:300]}")


def upload_blob(raw: bytes) -> str:
    try:
        content = raw.decode("utf-8")
        encoding = "utf-8"
    except UnicodeDecodeError:
        content = base64.b64encode(raw).decode()
        encoding = "base64"
    r = api("POST", "/git/blobs", {"content": content, "encoding": encoding})
    return r["sha"]


def main():
    skip_build = "--skip-build" in sys.argv

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("ERROR: GITHUB_TOKEN env var not set.", file=sys.stderr)
        sys.exit(1)

    # --- Build ---
    if skip_build:
        print("Skipping build (--skip-build passed).")
    else:
        print("Building sc-demo for production...")
        result = subprocess.run(BUILD_CMD, env=BUILD_ENV, cwd=pathlib.Path(__file__).parent.parent)
        if result.returncode != 0:
            print("Build failed.", file=sys.stderr)
            sys.exit(1)

    if not DIST.exists():
        print(f"ERROR: dist not found at {DIST}", file=sys.stderr)
        sys.exit(1)

    files = [f for f in DIST.rglob("*") if f.is_file()]
    print(f"Uploading {len(files)} files to GitHub...")

    tree_items = []
    for fp in files:
        rel = fp.relative_to(DIST).as_posix()
        sha = upload_blob(fp.read_bytes())
        tree_items.append({"path": rel, "mode": "100644", "type": "blob", "sha": sha})
        print(f"  {rel}")

    # Always include .nojekyll to skip Jekyll processing
    nojekyll_sha = upload_blob(b"")
    tree_items.append({"path": ".nojekyll", "mode": "100644", "type": "blob", "sha": nojekyll_sha})

    # --- Create orphan commit (no parents) ---
    ts = datetime.datetime.utcnow().isoformat()
    print("Creating git tree...")
    tree = api("POST", "/git/trees", {"tree": tree_items})

    print("Creating orphan commit...")
    commit = api("POST", "/git/commits", {
        "message": f"Deploy {ts}",
        "tree": tree["sha"],
        "parents": [],
        "author": {"name": "deploy-bot", "email": "deploy@replit"},
    })
    print(f"Commit: {commit['sha'][:12]}")

    # --- Force-push branch ---
    try:
        api("PATCH", f"/git/refs/heads/{BRANCH}", {"sha": commit["sha"], "force": True})
        print(f"Updated branch {BRANCH}")
    except RuntimeError:
        api("POST", "/git/refs", {"ref": f"refs/heads/{BRANCH}", "sha": commit["sha"]})
        print(f"Created branch {BRANCH}")

    # --- Ensure Pages is pointed at this branch ---
    try:
        pages = api("GET", "/pages")
        current_branch = pages.get("source", {}).get("branch")
        if current_branch != BRANCH:
            print(f"Switching Pages source from '{current_branch}' to '{BRANCH}'...")
            api("PUT", "/pages", {"source": {"branch": BRANCH, "path": "/"}, "build_type": "legacy"})
        else:
            print(f"Pages already pointing at '{BRANCH}'")
    except RuntimeError as e:
        print(f"Warning: could not check/update Pages config: {e}")

    print()
    print("Deploy complete!")
    print(f"Branch {BRANCH} updated with orphan commit {commit['sha'][:12]}")
    print("GitHub Pages will rebuild in ~1-2 minutes.")
    print("Live site: https://joenugent512.github.io/SNC_Wireframe/")
    print()
    print("If the site does not update within 5 minutes, follow the manual reset steps:")
    print("  https://github.com/JoeNugent512/SNC_Wireframe/settings/pages")
    print("  Toggle the branch source (away then back) and click Save.")


if __name__ == "__main__":
    main()
