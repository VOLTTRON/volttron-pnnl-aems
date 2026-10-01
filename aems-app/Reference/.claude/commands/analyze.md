---
description: Run security vulnerability scan and ESLint across all workspaces (or a single named workspace)
---

Run the full static analysis suite: security vulnerability scan followed by ESLint lint checks.

**With no arguments:** scan all four workspaces (prisma → common → server → client).  
**With an argument** (e.g. `/analyze server`): scope both phases to that workspace only.

---

## Phase 1 — Security scan

Run from the repo root:

```
bash scripts/audit.sh
```

- If `osv-scanner` is installed, it scans all four `yarn.lock` files against the OSV/GHSA advisory database (same data Dependabot uses).
- If `osv-scanner` is not installed, print: "osv-scanner not found. Install with: `winget install Google.OSVScanner` or download from https://github.com/google/osv-scanner/releases" — then fall back to `yarn npm audit` in each workspace directory.
- For each vulnerability found, report: GHSA/CVE ID, severity, affected package and version, fix version (if available), and which workspace lockfile it appeared in.
- If no vulnerabilities are found, say so clearly.

When scoping to a single workspace (e.g. `/analyze server`), pass only that workspace's lockfile:
```
osv-scanner --lockfile server/yarn.lock
```

---

## Phase 2 — Lint

Run `yarn lint` in each target workspace. Unlike `/check-all`, **do not stop at the first failure** — collect lint output from all workspaces before summarizing.

Order: prisma → common → server → client (or just the named workspace).

For each workspace, surface only errors and warnings with file:line citations. Suppress clean output.

---

## Summary

After both phases complete, print a grouped summary table:

| Workspace | Vulnerabilities | Lint errors | Lint warnings |
|-----------|----------------|-------------|---------------|
| prisma    | …              | …           | …             |
| common    | …              | …           | …             |
| server    | …              | …           | …             |
| client    | …              | …           | …             |

Then suggest next steps:
- For vulnerabilities with a fix version: `yarn up <package>` inside the affected workspace.
- For lint errors: reference the specific rule and file.
- For TypeScript type errors (not covered here): suggest `/check-all`.
