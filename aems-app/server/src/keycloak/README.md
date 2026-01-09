# Keycloak Role Synchronization

This module synchronizes user roles and unit assignments from the application database to Keycloak client roles for Grafana dashboard access control.

## Overview

The Keycloak Role Sync system ensures that when users are assigned roles or units in the AEMS application, their Grafana dashboard access permissions are automatically updated in Keycloak in real-time.

### Key Features

- **Event-Driven Architecture**: Uses the existing pub/sub subscription service to listen for user updates
- **Real-Time Sync**: Automatically syncs Keycloak roles when users are updated via GraphQL mutations
- **Role-Based Access**: 
  - Users with `admin` role get access to ALL dashboard viewer roles
  - Users with `user` role get access only to their assigned units and building overviews
  - Users without `user` or `admin` roles have all Grafana roles removed
- **Internal API**: Provides REST endpoints for manual sync operations (Docker internal network only)

## Architecture

### Components

1. **KeycloakSyncService** - Main service that:
   - Extends BaseService with service name "grafana" (only runs on services container)
   - Runs startup sync of all users on initialization (@Timeout)
   - Subscribes to User update events via SubscriptionService
   - Parses dashboard configuration files to discover available roles
   - Syncs user roles to Keycloak via Admin API
   - Caches admin tokens and client UUIDs for performance

2. **InternalNetworkGuard** - Security guard that:
   - Restricts access to internal endpoints
   - Only allows requests from Docker internal networks (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
   - Blocks external access attempts

3. **KeycloakInternalController** - REST controller that:
   - Provides manual sync endpoints
   - Protected by InternalNetworkGuard
   - Supports single-user and bulk sync operations

### Event Flow

#### Startup Sync (One-time)
```
Services container starts
    ↓
KeycloakSyncService.task() runs (@Timeout 1000ms)
    ↓
Loads dashboard roles from config files
    ↓
Subscribes to User events
    ↓
Syncs ALL users in database to Keycloak
    ↓
Service ready for real-time updates
```

#### Real-Time Sync (Continuous)
```
User updates role/units via GraphQL
    ↓
UserMutation publishes to SubscriptionService (Redis)
    ↓
KeycloakSyncService receives event (on services container)
    ↓
Service queries user's role and units
    ↓
Determines required Keycloak roles
    ↓
Calls Keycloak Admin API to sync roles
    ↓
Logs success/failure
```

## Role Assignment Logic

### Admin Users
- Receive ALL available Grafana viewer roles across all dashboards
- Can view any unit or building site dashboard
- Do NOT receive Grafana Admin role (Grafana is read-only)

### Regular Users
- Receive roles only for their assigned units:
  - `grafana-view-unit-{campus}_{building}_{unitname}` for each assigned unit
  - `grafana-view-site-{campus}_{building}` for each building containing their units
- Building site roles are automatically added when user has any unit in that building

### No Access Users
- Users without `user` or `admin` role
- All Grafana client roles are removed
- Cannot access any Grafana dashboards

## Configuration

### Environment Variables

Required in `.env` or Docker environment:

```bash
# Keycloak Admin Credentials
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=your_admin_password

# Keycloak Configuration
KEYCLOAK_REALM=default
KEYCLOAK_CLIENT_ID=grafana-oauth
KEYCLOAK_ISSUER_URL=http://localhost:8080/auth/sso/realms/default

# Grafana Dashboard Config Path
GRAFANA_CONFIG_PATH=/path/to/configs

# Instance Type (service must include 'grafana' or '*' to run)
INSTANCE_TYPE=services
```

**Important**: The KeycloakSyncService only runs on instances where `INSTANCE_TYPE` includes 'grafana' or '*' (and not '!grafana'). This is typically the services container where Grafana configuration files are mounted.

### Dashboard Configuration Files

The service reads dashboard URL configuration files in the format:
`{CAMPUS}--{BUILDING}_dashboard_urls.json` (new format with double-dash separator)

**Note**: The service also supports the legacy format `{CAMPUS}_{BUILDING}_dashboard_urls.json` for backward compatibility.

Example file structure:
```json
{
  "RTU Overview - Unit1": {
    "url": "https://grafana.example.com/d/abc123",
    "keycloak_role": "grafana-view-unit-campus_building_unit1",
    "role_created": true
  },
  "Site Overview": {
    "url": "https://grafana.example.com/d/xyz789",
    "keycloak_role": "grafana-view-site-campus_building",
    "role_created": true
  }
}
```

## Usage

### Automatic Sync

#### Startup Sync
When the services container starts, ALL users are automatically synced. This handles:
- Database changes made via scripts (e.g., `update-user-role.ps1`)
- Manual database modifications
- Drift between database and Keycloak state

Check logs after services restart:
```bash
docker logs skeleton-services | grep KeycloakSyncService
```

Expected output:
```
[KeycloakSyncService] Initializing KeycloakSyncService...
[KeycloakSyncService] Loaded X Grafana roles from Y campus/building configs
[KeycloakSyncService] Successfully subscribed to User events
[KeycloakSyncService] Performing startup sync of all users...
[KeycloakSyncService] Found Z users to sync
[KeycloakSyncService] Startup sync results: X succeeded, Y failed
[KeycloakSyncService] Startup sync completed
```

#### Real-Time Sync
Roles are automatically synced whenever users are updated via GraphQL:

```graphql
mutation {
  updateUser(
    where: { id: "user123" }
    update: { 
      role: "admin user"
      units: { 
        connect: [{ id: "unit456" }]
        disconnect: [{ id: "unit789" }]
      }
    }
  ) {
    id
    email
    role
  }
}
```

The KeycloakSyncService automatically:
1. Receives the User update event
2. Queries the updated user with units
3. Calculates required Keycloak roles
4. Syncs roles via Keycloak Admin API

### Manual Sync (Internal Endpoints)

For manual operations or troubleshooting, use the internal REST endpoints.

**Important**: These endpoints are only accessible from within the Docker network.

#### Sync Single User

```bash
# From within Docker container
curl -X POST http://server:3000/internal/keycloak/sync-roles \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Response:
```json
{
  "success": true,
  "message": "Synced roles for user@example.com",
  "result": {
    "email": "user@example.com",
    "added": ["grafana-view-unit-campus_building_unit1"],
    "removed": ["grafana-view-unit-campus_building_unit2"],
    "total": 3
  }
}
```

#### Sync All Users

```bash
# From within Docker container
curl -X POST http://server:3000/internal/keycloak/sync-all
```

Response:
```json
{
  "success": true,
  "message": "Synced 50 users, 2 failures",
  "total": 52,
  "succeeded": 50,
  "failed": 2,
  "details": [
    {
      "email": "user1@example.com",
      "status": "success"
    },
    {
      "email": "user2@example.com",
      "status": "failed",
      "error": "User not found in Keycloak"
    }
  ]
}
```

## Error Handling

### User Not in Keycloak
- **Behavior**: Sync is skipped with a warning
- **Reason**: User will be created in Keycloak on first login
- **Action**: No intervention needed; sync will occur on next update after login

### Role Not Found in Keycloak
- **Behavior**: Error logged, sync continues with other roles
- **Reason**: Dashboard configuration may be out of sync
- **Action**: Run Grafana setup script to create missing roles

### Keycloak API Failure
- **Behavior**: Error logged, mutation still succeeds
- **Reason**: Network issues or Keycloak unavailable
- **Action**: Use manual sync endpoint after issue resolved

### Invalid Dashboard Config
- **Behavior**: Warning logged, roles list incomplete
- **Reason**: Malformed JSON or missing keycloak_role field
- **Action**: Fix dashboard configuration file format

## Monitoring & Debugging

### Log Levels

The service logs at different levels:

- **INFO**: Startup, subscription registration, sync operations
- **DEBUG**: Role calculations, individual role assignments
- **WARN**: Skipped syncs, missing users, missing configs
- **ERROR**: API failures, parsing errors, unexpected exceptions

### Key Log Messages

```
[KeycloakSyncService] Initializing KeycloakSyncService...
[KeycloakSyncService] Loaded 25 Grafana roles from 3 campus/building configs
[KeycloakSyncService] Successfully subscribed to User events for Keycloak role sync
[KeycloakSyncService] User updated: user@example.com, syncing Keycloak roles...
[KeycloakSyncService] Syncing roles for user@example.com: +2 -1
[KeycloakSyncService] Successfully synced Keycloak roles for user@example.com
```

### Troubleshooting

**Roles not syncing?**
1. Check **services container** logs (not server): `docker logs skeleton-services | grep KeycloakSyncService`
2. Verify service initialized: Look for "Loaded X Grafana roles from Y campus/building configs"
3. Verify KEYCLOAK_ADMIN credentials are correct in `.env`
4. Ensure dashboard config files exist in mounted volume
5. Check KEYCLOAK_ISSUER_URL is set correctly
6. Verify Keycloak is accessible from services container

**User can't access dashboards?**
1. Verify user has `user` or `admin` role in database
2. Check user is assigned to units (for non-admin users)
3. Verify user exists in Keycloak (logged in at least once)
4. Use manual sync endpoint to force re-sync
5. Check Keycloak roles in admin console

**Getting 403 on internal endpoints?**
1. Verify request is from Docker internal network
2. Check InternalNetworkGuard logs for IP address
3. Ensure proper X-Forwarded-For headers in proxy setup

## Development

### Testing

To test the sync service:

1. Start the application with Keycloak and Grafana
2. Create/update a user with GraphQL:
   ```graphql
   mutation {
     updateUser(
       where: { email: "test@example.com" }
       update: { role: "user", units: { connect: [{ id: "unit1" }] } }
     ) {
       id
       email
       role
     }
   }
   ```
3. Check server logs for sync messages
4. Verify roles in Keycloak admin console at:
   `https://{HOSTNAME}/auth/sso/admin/master/console/#/default/users/{userId}/role-mapping`

### Manual Testing of Internal Endpoints

From within a Docker container (server or services):

```bash
# Test sync single user
docker exec -it skeleton-services sh -c \
  "curl -X POST http://server:3000/internal/keycloak/sync-roles \
   -H 'Content-Type: application/json' \
   -d '{\"email\": \"test@example.com\"}'"

# Or from server container
docker exec -it skeleton-server sh -c \
  "curl -X POST http://localhost:3000/internal/keycloak/sync-roles \
   -H 'Content-Type: application/json' \
   -d '{\"email\": \"test@example.com\"}'"

# Test sync all users (triggers re-sync of everyone)
docker exec -it skeleton-services sh -c \
  "curl -X POST http://server:3000/internal/keycloak/sync-all"
```

**Note**: After using `update-user-role.ps1` script (which bypasses GraphQL), you can either:
1. Restart the services container to trigger startup sync
2. Use the manual sync endpoint above
3. Update the user again via GraphQL to trigger real-time sync

## Security Considerations

- **Internal-Only Endpoints**: The REST endpoints are protected by InternalNetworkGuard and cannot be accessed from external networks
- **Admin Token Caching**: Admin tokens are cached with 30-second buffer before expiry to reduce API calls
- **Error Isolation**: Sync failures do not prevent database updates from succeeding
- **Read-Only Grafana**: Users only receive viewer roles, not editor or admin roles in Grafana

## Integration with Grafana

The synced Keycloak roles work in conjunction with:

1. **Grafana OAuth Configuration** (`.env.grafana`):
   - Grafana authenticates users via Keycloak OAuth
   - User roles from Keycloak are mapped to Grafana roles

2. **GrafanaRewriteMiddleware** (server-side):
   - Validates user has appropriate role before proxying requests
   - Admin role grants access to all dashboards
   - User role checks unit assignments

This two-layer approach ensures:
- Quick access control at the application proxy level
- Proper authentication when accessing Grafana directly
- Consistent permissions across all access methods

## Future Enhancements

Potential improvements:
- Add role assignment history/audit log
- Implement retry logic with exponential backoff for API failures
- Support for custom role mapping configurations
- Dashboard folder-level permissions in Grafana
- Real-time sync status dashboard in admin UI
