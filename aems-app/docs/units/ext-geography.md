# ext-geography

**State:** built

## Contract

Maps, geocoding and the wiki, reached through the server so that access is checked before any request
leaves it; and the geography data behind locations. It does not run the tile, geocoding or wiki
services themselves.

## Claims

- `/ext/` forwards to the map tile server, Nominatim and the wiki only after the caller's roles are
  checked, although the tile server itself has no authentication.
- Each `EXT_*_AUTHORIZED` URL in `docker/.env.server` names the `hostname:` of a compose service in
  the profile that serves it, at the port that service declares it listens on (a `--port` argument
  or `expose:`).
- Geography columns are PostGIS types read and written through raw SQL.

## Dependencies

auth

## Scenarios

| Name | Proves |
|---|---|
| `ext-checks-roles-first` | role check before forwarding |
| `ext-targets-match-compose` | each authorized URL names a profiled compose host and its declared port |
| `geography-raw-sql` | PostGIS read and write |
