# Historian GraphQL API Implementation

## Overview

This implementation provides a GraphQL API for accessing VOLTTRON historian data, enabling the migration from Grafana dashboards to custom frontend views.

## What Was Implemented

### 1. Database Service (`src/historian/historian.service.ts`)

A PostgreSQL connection service that:
- Connects to the historian database using connection pooling
- Provides methods for querying time-series data
- Handles data type conversions (value_string to numeric)
- Supports pattern matching and filtering

**Key Methods:**
- `getCurrentValues()` - Get latest values for topics
- `getTimeSeries()` - Get time-series data
- `getAggregated()` - Get aggregated data with time grouping
- `getMultiUnit()` - Get multi-unit pivoted data
- `getCalculated()` - Get calculated metrics (setpoint errors, rolling averages)

### 2. GraphQL Schema (`src/graphql/historian/`)

**Object Types:**
- `HistorianDataPoint` - Single data point
- `HistorianTimeSeries` - Time series for a topic
- `HistorianAggregate` - Aggregated data point
- `HistorianMetricCurrent` - Current value
- `HistorianMultiUnitData` - Multi-unit data

**Query Resolvers:**
- `historianCurrentValues` - Current values query
- `historianTimeSeries` - Time series query
- `historianAggregated` - Aggregated data query
- `historianMultiUnit` - Multi-unit data query
- `historianCalculated` - Calculated metrics query

### 3. Module Integration

The `HistorianModule` is integrated into the main `AppModule` and provides:
- Database connection management
- GraphQL resolvers
- Type-safe query interface

## Configuration

Add these environment variables to `.env` or `.env.server`:

```bash
# Historian Database Configuration
HISTORIAN_DATABASE_HOST=historian
HISTORIAN_DATABASE_PORT=5432
HISTORIAN_DATABASE_NAME=historian
HISTORIAN_DATABASE_USERNAME=historian
HISTORIAN_DATABASE_PASSWORD=your_password

# Or use a full connection string
HISTORIAN_DATABASE_URL=postgresql://historian:password@historian:5432/historian
```

## Grafana Dashboard Migration Map

### Dashboard: Unit (rtu01 Overview)

| Grafana Panel | GraphQL Query | Notes |
|--------------|---------------|-------|
| Outdoor Air Temperature (Gauge) | `historianCurrentValues` | Single latest value |
| Zone Humidity (Gauge) | `historianCurrentValues` | Single latest value |
| Zone Temperature (Gauge) | `historianCurrentValues` | Single latest value |
| Setpoints (Stats) | `historianCurrentValues` | Multiple topics |
| Occupancy Command (Stat) | `historianCurrentValues` | Status value |
| Heating Command (Stat) | `historianCurrentValues` | On/off status |
| Supply Fan (Stat) | `historianCurrentValues` | On/off status |
| Cooling Stage (Stat) | `historianAggregated` | SUM aggregation |
| rtu01 Chart (Time Series) | `historianTimeSeries` | Multiple metrics |

### Dashboard: Site Overview

| Grafana Panel | GraphQL Query | Notes |
|--------------|---------------|-------|
| Occupancy Status (Timeline) | `historianMultiUnit` | Multi-unit pivoted data |
| Occupancy Setpoint Error (Timeline) | `historianCalculated` | SETPOINT_ERROR calculation |
| Weather (Time Series) | `historianTimeSeries` | Temperature data |
| Building Power (Time Series) | `historianCalculated` | ROLLING_AVERAGE calculation |

## Usage Examples

### Example 1: Current Temperature Reading

```graphql
query {
  historianCurrentValues(
    topicPatterns: ["PNNL/ROB/rtu01/ZoneTemperature"]
  ) {
    topicName
    value
    timestamp
  }
}
```

### Example 2: 24-Hour Temperature History

```graphql
query {
  historianTimeSeries(
    topicPatterns: ["PNNL/ROB/rtu01/ZoneTemperature"],
    startTime: "2026-03-03T00:00:00Z",
    endTime: "2026-03-03T23:59:59Z"
  ) {
    topicName
    data {
      timestamp
      value
    }
  }
}
```

### Example 3: Multi-Unit Occupancy Status

```graphql
query {
  historianMultiUnit(
    topicPattern: "PNNL/ROB/%UNIT%/OccupancyCommand",
    units: ["rtu01", "rtu02", "rtu03", "rtu04", "rtu05"],
    startTime: "2026-03-03T00:00:00Z",
    endTime: "2026-03-03T23:59:59Z",
    interval: "5m"
  ) {
    unit
    data {
      timestamp
      value
    }
  }
}
```

## Testing

To test the implementation:

1. **Start the services:**
   ```bash
   cd aems-app
   ./start-services.sh  # or start-services.ps1 on Windows
   ```

2. **Access GraphQL Playground:**
   ```
   https://your-domain/graphql
   ```

3. **Run sample queries** from the documentation

4. **Verify data** matches Grafana dashboards

## Frontend Integration

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: '/graphql',
    credentials: 'include',
  }),
  cache: new InMemoryCache(),
});
```

### React Hook Example

```typescript
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_ZONE_TEMP = gql`
  query GetZoneTemp {
    historianCurrentValues(
      topicPatterns: ["PNNL/ROB/rtu01/ZoneTemperature"]
    ) {
      value
      timestamp
    }
  }
`;

function TemperatureDisplay() {
  const { data, loading, error } = useQuery(GET_ZONE_TEMP, {
    pollInterval: 30000, // Refresh every 30 seconds
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const temp = data?.historianCurrentValues[0]?.value;
  return <div>{temp}°F</div>;
}
```

## Performance Optimization

### Current Implementation
- ✅ Connection pooling (20 connections)
- ✅ Type-safe queries
- ✅ Pattern matching optimization
- ✅ Date truncation for aggregation

### Future Enhancements
- [ ] Redis caching layer for frequently accessed data
- [ ] DataLoader for batch query optimization
- [ ] GraphQL subscriptions for real-time updates
- [ ] Query result caching
- [ ] Materialized views for common aggregations

## Architecture

```
┌─────────────────────────────────────────┐
│         Frontend (React/Next.js)        │
│         Apollo Client / React Query     │
└─────────────────┬───────────────────────┘
                  │ GraphQL Queries
                  ▼
┌─────────────────────────────────────────┐
│         NestJS Server (GraphQL)         │
│  ┌─────────────────────────────────┐   │
│  │  Historian GraphQL Resolvers    │   │
│  └──────────────┬──────────────────┘   │
│                 │                        │
│  ┌──────────────▼──────────────────┐   │
│  │   Historian Service (pg Pool)   │   │
│  └──────────────┬──────────────────┘   │
└─────────────────┼───────────────────────┘
                  │ SQL Queries
                  ▼
┌─────────────────────────────────────────┐
│      Historian Database (PostgreSQL)     │
│  ┌───────────┐      ┌───────────────┐  │
│  │  topics   │      │     data      │  │
│  └───────────┘      └───────────────┘  │
└─────────────────────────────────────────┘
```

## Files Created

```
aems-app/server/
├── src/
│   ├── historian/
│   │   ├── historian.service.ts     # Database service
│   │   └── historian.module.ts      # NestJS module
│   └── graphql/
│       └── historian/
│           ├── object.service.ts    # GraphQL types
│           └── query.service.ts     # GraphQL resolvers
└── docs/
    └── historian-graphql-api.md     # API documentation
```

## Migration Checklist

- [x] Historian database service with connection pooling
- [x] GraphQL schema (types, queries, enums)
- [x] Current values query (for gauges/stats)
- [x] Time series query (for charts)
- [x] Aggregated query (for downsampling)
- [x] Multi-unit query (for timelines)
- [x] Calculated metrics (setpoint error, rolling average)
- [x] Module integration
- [x] API documentation
- [ ] Redis caching layer
- [ ] Performance testing with production data
- [ ] Frontend component migration
- [ ] GraphQL subscriptions for real-time updates

## Next Steps

1. **Test with Real Data**: Verify queries work with actual historian data
2. **Implement Caching**: Add Redis caching for frequently accessed metrics
3. **Frontend Migration**: Start migrating Grafana panels to React components
4. **Performance Tuning**: Monitor query performance and optimize as needed
5. **Add Subscriptions**: Implement real-time updates using GraphQL subscriptions

## Support

For detailed API documentation, see: `docs/historian-graphql-api.md`

For questions or issues, contact the development team.
