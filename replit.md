# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

---

## S&C Demo App

**Location**: `artifacts/sc-demo/`  
**Stack**: React + Vite + Wouter + Tailwind + shadcn/ui  
**Dev command**: `pnpm --filter @workspace/sc-demo run dev`

### GitHub Pages Deployment

**Live site**: https://joenugent512.github.io/SNC_Wireframe/  
**GitHub repo**: https://github.com/JoeNugent512/SNC_Wireframe  
**Pages source branch**: `pages-deploy` (orphan branch, built output only)  
**Pages path**: `/`

#### How to deploy (every session, after code changes)

Run the permanent deploy script from the repo root:

```bash
python3 scripts/deploy_gh_pages.py
```

This script:
1. Builds `sc-demo` for production (`BASE_PATH=/SNC_Wireframe/`)
2. Uploads all dist files to GitHub via REST API (no `git push` needed)
3. Force-pushes an orphan commit to the `pages-deploy` branch
4. Verifies Pages is pointed at `pages-deploy`

Requires `GITHUB_TOKEN` env var (already set in Replit secrets). The token needs `repo` scope but does NOT need `workflow` scope.

#### If the live site does not update after deploying

GitHub Pages sometimes gets stuck in an "errored" state. To reset it manually:

1. Go to https://github.com/JoeNugent512/SNC_Wireframe/settings/pages
2. Change **Branch** to `None` → click **Save**
3. Change **Branch** back to `pages-deploy` → click **Save**
4. Wait 2-3 minutes for the build to complete

This resets GitHub's build pipeline for the repo.

#### Known issue: git push to GitHub main is blocked

The local repo has a commit (`cc0bdd2`) that added a `.github/workflows/` file. GitHub requires the `workflow` scope on the token to push any commit that touches `.github/workflows/`. The current `GITHUB_TOKEN` does not have this scope.

**Impact**: `git push` to GitHub main fails. Source code on GitHub is behind local Replit.  
**Deployment is unaffected** — `scripts/deploy_gh_pages.py` uses the REST API directly.

**To fix permanently**: Go to https://github.com/settings/tokens, find the token used for `GITHUB_TOKEN` in Replit secrets, and add the `workflow` scope. Then future `git push` commands will work again.
