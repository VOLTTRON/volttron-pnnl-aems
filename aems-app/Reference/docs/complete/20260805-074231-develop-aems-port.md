# AEMS Port: lodash improvements, auth fix, install-third-party-cert

Porting applicable changes from the AEMS project's recent large update.

## Changes

1. `common/src/utils/lodash.ts` — replace with AEMS version (null-safe pick/omit, sortBy string shorthands, new cloneDeep/merge/uniqWith/clamp exports, better string case functions)
2. `server/src/auth/index.ts:54` — add `.map((r) => r.trim()).filter(Boolean)` after role split
3. `install-third-party-cert.sh` / `.ps1` — new scripts at repo root
4. `docker/proxy/README.md` — fix incorrect Custom Certificates instructions

---

## 2026-08-05T07:42:31Z — Started

## 2026-08-05T07:50:00Z — Complete

All layers passed `yarn check` clean (prisma, common, server, client).

### Files changed
- `common/src/utils/lodash.ts` — replaced with AEMS version
- `server/src/auth/index.ts:54` — added `.map((r) => r.trim()).filter(Boolean)`
- `install-third-party-cert.sh` — new at repo root
- `install-third-party-cert.ps1` — new at repo root
- `docker/proxy/README.md` — corrected Custom Certificates, Certificate Path Mapping, and Manual Renewal sections
