# keycloak-password-policy

## 2026-07-28 10:06:27 — Complete

### Change

Added `passwordPolicy` to `docker/keycloak/default-realm.json` (after `failureFactor`):

```
length(8) and upperCase(1) and lowerCase(1) and digits(1) and notUsername and notEmail and passwordHistory(5)
```

### Decisions

- Min length 8 (not 12) — this is a framework skeleton used by downstream teams who should be able to choose their own bar
- No special character requirement — NIST 800-63B discourages mandatory special chars
- No forced expiry — `resetPasswordAllowed` and `verifyEmail` are both `false`; no email flow exists yet
- No explicit hash config — Keycloak 26.x defaults to argon2; passwords are never stored in plaintext

### Build chain

Config-only change. No Prisma, common, server, or client steps required.

### Files changed

| File | Change |
|---|---|
| `docker/keycloak/default-realm.json` | Added `passwordPolicy` key |

### Verification

`docker compose --profile sso up -d` from repo root → Keycloak admin → Realm settings → Security defenses → Password policy should show all 7 constraints.
