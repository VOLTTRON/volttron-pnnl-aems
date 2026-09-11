# develop: breadcrumb-index-bug

## Summary

Fixed a bug where clicking a breadcrumb for an `index: true` route (virtual container nodes like `auth` and `admin`) would navigate to a URL with no corresponding `page.tsx`, producing a "page not found" error. The `auth` route (`path: "auth"`, `index: true`) was the primary case — its breadcrumb link resolved to `/auth` which has no page.

## Change

**`client/src/app/components/common/navbar.tsx`** — `NavbarLeft` breadcrumb builder:

```ts
// Before
onClick: callback(findPath(items.slice(0, i + 1))),

// After
onClick: v.index ? undefined : callback(findPath(items.slice(0, i + 1))),
```

Index routes remain visible in the breadcrumb trail for context but are rendered as non-interactive plain text (Blueprint omits pointer/click behaviour when `onClick` is `undefined`).

## Layers

- Prisma: no changes
- Common: no changes
- Server: no changes
- Client: `navbar.tsx` patched — `yarn check` passed ✓
