# Dependabot Security Fixes

## What This PR Does

Adds Yarn `resolutions` to force minimum safe versions for vulnerable transitive dependencies.

## After Merging

Run `yarn install` in each workspace to regenerate yarn.lock files:

```bash
cd aems-app/client && yarn install
cd aems-app/server && yarn install
cd aems-app/common && yarn install
cd aems-app/prisma && yarn install
```

Then verify the app still builds and tests pass.

## Vulnerabilities Fixed

### Critical (3)
| Package | CVE | Installed | Fixed | Issue |
|---------|-----|-----------|-------|-------|
| fast-xml-parser | CVE-2026-25896 | 4.5.3 | >=4.5.4 | Entity encoding bypass via regex injection |
| sha.js | CVE-2025-9288 | 2.4.11 | >=2.4.12 | Hash rewind via missing type checks |
| form-data | CVE-2025-7783 | 4.0.1 | >=4.0.4 | Predictable multipart boundaries |

### High (resolved by resolutions, ~50 alerts)
| Package | Installed | Fixed | Issue |
|---------|-----------|-------|-------|
| tar | 7.4.3 | >=7.5.2 | Symlink/hardlink path traversal, arbitrary file overwrite (6 CVEs) |
| minimatch | 3.1.2, 5.1.6 | >=10.0.0 | ReDoS via globs/wildcards (3 CVEs) |
| flatted | various | >=3.3.3 | Prototype Pollution in parse() |
| serialize-javascript | various | >=6.0.3 | RCE via RegExp.flags + CPU exhaustion |
| picomatch | various | >=4.0.3 | ReDoS via extglob quantifiers |
| path-to-regexp | 0.1.12 | >=8.3.0 | ReDoS via route parameters |

## Additional Items NOT in This PR (Require Manual Work)

These need code changes, not just version bumps:

1. **Replace `jsonpath` with `jsonpath-plus`** -- jsonpath uses eval() internally, allows arbitrary code injection (HIGH). Unmaintained. Requires code changes in client.

2. **Replace or remove `multer`** -- 7 HIGH DoS vulnerabilities, no upstream fix. Consider `busboy` or `@nestjs/platform-fastify`. Requires code changes in server.

3. **Upgrade `next` from 14.2.33** -- 6 vulnerabilities (3 HIGH, 3 MEDIUM). Upgrade to latest 14.2.x or evaluate Next 15 migration.

4. **Upgrade `undici`** -- 6 vulnerabilities (3 HIGH, 3 MEDIUM). Upgrade to latest 7.x.

5. **Upgrade `@apollo/server`** -- 3 vulnerabilities (1 HIGH, 2 MEDIUM). Upgrade to latest 4.x.

6. **Upgrade `@nestjs/common`** -- Code execution via Content-Type header (MEDIUM). Upgrade to latest 11.x.
