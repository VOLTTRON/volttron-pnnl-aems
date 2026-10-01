# ext-geography

**State:** unbuilt

## Contract

Maps, geocoding and the wiki, reached through the server so that access is checked before any request
leaves it; and the geography data behind locations. It does not run the tile, geocoding or wiki
services themselves.

## Claims

- `/ext/` forwards to the map tile server, Nominatim and the wiki only after the caller's roles are
  checked, although the tile server itself has no authentication.
- `/ext/` never answers 502 or 503 while its profile is running.
- Geography columns are PostGIS types read and written through raw SQL.
- Database views are read-only.

## Dependencies

auth

## Scenarios

| Name | Proves |
|---|---|
| `ext-checks-roles-first` | role check before forwarding |
| `ext-routes-answer` | no 502/503 |
| `geography-raw-sql` | PostGIS read and write |
| `views-read-only` | views refuse writes |
