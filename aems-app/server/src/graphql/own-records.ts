// Compose a non-admin caller's own `where` with an ownership filter so the
// caller sees and touches only their own rows. Admin reads pass through
// unchanged; a non-admin's filter is AND-ed with `{ userId: ctx.user.id }` so
// the caller's where only narrows the result, never widens it. A caller with
// no id (anonymous or malformed context) gets a filter that matches nothing.
import { Context } from ".";

export function narrowToOwner<W>(where: W | null | undefined, ctx: Context): W | undefined {
  if (ctx.user?.authRoles.admin) return (where ?? undefined) as W | undefined;
  const ownerFilter = { userId: ctx.user?.id ?? "__anonymous__" } as unknown as W;
  if (where === null || where === undefined) return ownerFilter;
  return { AND: [where, ownerFilter] } as unknown as W;
}
