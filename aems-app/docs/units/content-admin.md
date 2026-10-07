# content-admin

**State:** unbuilt

## Contract

The app's administrative content: user records and their linked sign-in accounts, banners, feedback,
comments and uploaded files. Who a caller is belongs to auth. Mirroring roles to Keycloak belongs to
keycloak-admin.
Implemented today in `server/src/graphql/{user,banner,feedback,comment,file,account,current}/`, `server/src/api/file.controller.ts` and `client/src/app/{users,banners,feedback}/`.

## Claims

- A non-admin reads and changes only their own feedback, comments and files. That holds through every
  query and mutation, counts and groupings included. An admin reaches all of them. No API lets a
  non-admin hand a record to another user or attach someone else's file to their feedback.
  **Open:** `feedback/query.service.ts` pageFeedback (line 83), countFeedbacks (158), groupFeedbacks (178) apply no `ctx.user` filter at all; readFeedbacks (141-154) computes a filtered `where` but passes `args.where` to findMany (line 149). Same pattern in `comment/query.service.ts` (page/read/list/count/group all pass `args.where`, no filter) and in `file/query.service.ts` pageFile (93), readFile (119), countFiles (172), groupFiles (196). Does the claim still hold, and if so where should the filter live — in each resolver, as middleware, or in a shared helper?
- A non-admin sees another user only as an id and a name. No GraphQL field exposes an account's
  tokens, and only admins read accounts.
  **Open:** `account/object.service.ts` lines 26-31 expose `refresh_token`, `access_token` and `id_token` as GraphQL fields; `account/query.service.ts` resolvers (pageAccount:84, readAccount:106, readAccounts:132, countAccounts:167, groupAccounts:192) use `authScopes: { user: true }`, not admin; `user/object.service.ts` lines 32-45 expose `email`, `emailVerified`, `role`, `preferences`, `createdAt`, `updatedAt`, `comments`, `accounts`, `banners`, `units` with no field-level auth. Does the claim still hold against this code?
- A user may change their own name, image, preferences and password. Only an admin may change an
  email or a role. No one may update or delete a user who holds a role they could not grant.
  **Open:** `user/mutate.service.ts:179-186` restricts a non-admin to updating `password` and `preferences` only — `name` and `image` are silently dropped from `updateData` rather than written. `deleteUser` (lines 234-259) has no role-grant check at all. Does the claim still hold, and should `name`/`image` be writable by self and `deleteUser` validate the target's role against the caller's grants?
- Passwords are stored as bcrypt hashes and are never returned.
- Deleting a user leaves the feedback assigned to them unassigned, and removes their uploaded files
  from disk.
  **Open:** `prisma/prisma/models/feedback.prisma:16` declares `assignee User? @relation("assignee", ..., onDelete: Cascade)` — deleting the user deletes the assigned feedback rather than nulling `assigneeId`; `user/mutate.service.ts:234-259` deleteUser only calls `prisma.user.delete` and never unlinks the user's files from `FILE_UPLOAD_PATH`. Should assignee be `SetNull` and deleteUser enumerate and unlink the user's files first?
- A banner is shown to every signed-in user until its expiration, or always when it has none. The
  server filters out expired banners.
  **Open:** `banner/query.service.ts` resolvers pageBanner (69), readBanner (87), readBanners (108), countBanners (135) and groupBanners (155) pass only `args.where ?? {}` (or `undefined`) to Prisma — no expiration filter is applied server-side at all. Does the server filter expired banners, and if so in which resolvers?
- Feedback moves through Todo, InProgress and Done. Only an admin changes its status or assignee.
  Unassigned feedback reads with a null assignee.
- An upload takes at most 10 files of 50 MB each, of the allowed types. Each file is stored under a
  server-chosen name inside `FILE_UPLOAD_PATH`. A file that fails is reported with its reason, and
  only the files actually stored are returned.
  **Open:** `server/src/api/file.controller.ts:193-200` runs `cleanupPartialUploads` whenever any file fails — that deletes the records whose ids are already in the `ids` array returned to the client, so "only the files actually stored" ends up as a list pointing at deleted records; `failed.push(file.originalname)` (line 189) records only the name, not the reason the upload failed; the fileFilter at line 118-134 silently drops disallowed mimetypes with `cb(null, false)` rather than reporting them. Should cleanup be scoped to just the failed files, and should `failed` carry a reason?
- Only the server sets `objectKey`, at upload. A download serves only a file inside
  `FILE_UPLOAD_PATH`, as an attachment with a quoted, sanitized filename.
  **Open:** `server/src/api/file.controller.ts:218` resolves the download path as `resolve(process.cwd(), uploadPath, file.objectKey)` with no check that the result stays inside `uploadDir` — a stored objectKey containing `..` would escape the upload directory; line 220 writes `Content-Disposition: attachment; filename=${name}` using the URL `name` param verbatim, without quoting or sanitising. `FileMutation.createFile` and `updateFile` (`graphql/file/mutate.service.ts:34-50, 54-85, 87-123`) expose `objectKey` as a client-settable field on both `FileCreate` and `FileUpdate` inputs. Should the download confine with a resolved-path prefix check and quote/sanitise the filename, and should `objectKey` be removed from `FileCreate`/`FileUpdate`?
- Deleting a file record removes its bytes from disk.
  **Open:** `graphql/file/mutate.service.ts:125-159` deleteFile calls `prisma.file.delete` only; it never reads `objectKey` beforehand nor calls `unlink` on the file inside `FILE_UPLOAD_PATH`, so the bytes are left on disk after the record is gone. Should deleteFile fetch the row, delete the record, then unlink the file (in that order)?

## Dependencies

graphql

## Scenarios

| Name | Proves |
|---|---|
| `own-records-only` | every read and write path refuses another user's feedback, comments and files |
| `user-view-and-tokens-guarded` | others read as id and name only; no token field; accounts admin-only |
| `user-edit-rights` | self-edit limits, admin-only email and role, no edit above one's grants |
| `password-hashed-hidden` | stored as bcrypt; no field returns it |
| `user-delete-cascade-safe` | assigned feedback kept unassigned; the user's files gone from disk |
| `banner-visibility` | shown until expiry, always without one; expired filtered by the server |
| `feedback-workflow` | statuses, admin-only changes, null assignee readable |
| `upload-limits-and-names` | limits and types; server-chosen names; failures reported, only stored returned |
| `download-confined` | an `objectKey` outside the upload path is never served; quoted attachment name |
| `file-delete-removes-bytes` | the bytes go with the record |
