# content-admin

**State:** unbuilt

## Contract

The app's administrative content: user records and their linked sign-in accounts, banners, feedback,
comments and uploaded files. Who a caller is belongs to auth. Mirroring roles to Keycloak belongs to
keycloak-admin.

Implemented today in `server/src/graphql/{user,banner,feedback,comment,file,account,current}/`, `server/src/api/file.controller.ts` and `client/src/app/{users,banners,feedback}/`.

## Claims

- A non-admin reads and changes only their own feedback, comments and files. That holds through every
  query and mutation, counts, groupings and the subscriptions they back included, and a caller's own
  `where` only narrows it. An admin reaches all of them. No API lets a non-admin hand a record to
  another user or attach someone else's file to their feedback.
- A non-admin sees another user only as an id and a name, and their own record in full. No GraphQL
  field exposes an account's tokens, and only admins read or change accounts.
- A user may change their own name, image, preferences and password, and none of the four is dropped.
  Only an admin may change an email or a role. No one may update or delete a user who holds a role
  they could not grant.
- Passwords are stored as bcrypt hashes and are never returned.
- Deleting a user leaves the feedback assigned to them unassigned, and removes their uploaded files
  from disk; a file already missing does not stop the delete.
- A banner is shown to every signed-in user until its expiration, or always when it has none. The
  server filters out expired banners.
- Feedback moves through Todo, InProgress and Done. Only an admin changes its status or assignee.
  Unassigned feedback reads with a null assignee.
- An upload takes at most 10 files of 50 MB each, of the allowed types. Each file is stored under a
  server-chosen name inside `FILE_UPLOAD_PATH`. A file refused for its type or size, or that fails to
  store, is reported by name with its reason; the other files stay stored, and exactly those are
  returned.
- Only the server sets `objectKey`, at upload: no GraphQL input accepts one. A download serves only a
  file whose resolved path lies inside `FILE_UPLOAD_PATH`, as an attachment with a quoted, sanitized
  filename.
- Deleting a file record removes its bytes from disk; bytes already missing do not stop the delete.

## Dependencies

graphql

## Scenarios

| Name | Proves |
|---|---|
| `own-records-only` | every read, write and subscription path refuses another user's feedback, comments and files, whatever `where` is passed |
| `user-view-and-tokens-guarded` | others read as id and name only, self in full; no token field; accounts admin-only |
| `user-edit-rights` | all four self-edits written; admin-only email and role; no edit or delete above one's grants |
| `password-hashed-hidden` | stored as bcrypt; no field returns it |
| `user-delete-cascade-safe` | assigned feedback kept unassigned; the user's files gone from disk; a missing file does not block it |
| `banner-visibility` | shown until expiry, always without one; expired filtered by the server |
| `feedback-workflow` | statuses, admin-only changes, null assignee readable |
| `upload-limits-and-names` | limits and types; server-chosen names; a refused or failed file reported with its reason, the rest stored and returned |
| `download-confined` | no input sets `objectKey`; a path resolving outside the upload path is never served; quoted attachment name |
| `file-delete-removes-bytes` | the bytes go with the record; missing bytes do not block it |
