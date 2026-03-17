# Historian GraphQL API Documentation

## Overview

The Historian GraphQL API provides access to time-series data stored in the VOLTTRON historian database. This API enables the migration from Grafana dashboards to custom frontend views by exposing flexible querying capabilities for historical building automation data.

## Connection Configuration

The API connects to the historian PostgreSQL database using environment variables:

- `HISTORIAN_DATABASE_URL` - Full PostgreSQL connection string (optional)
- `HISTORIAN_DATABASE_HOST` - Database host (default: "historian")
- `HISTORIAN_DATABASE_PORT` - Database port (default: "5432")
- `HISTORIAN_DATABASE_NAME` - Database name (default: "historian")
- `HISTORIAN_DATABASE_USERNAME` - Database username (default: "historian")
- `HISTORIAN_DATABASE_PASSWORD` - Database password

## Data Model

The historian database stores data in two main tables:

- **topics**: Contains topic metadata (topic_id, topic_name)
- **data**: Contains time-series data (ts, topic_id, value_string)

Topic names follow the pattern: `CAMPUS/BUILDING/UNIT/METRIC`
Example: `PNNL/ROB/rtu01/ZoneTemperature`

## GraphQL Queries

### 1. historianCurrentValues

Get the latest (current) values for multiple topic patterns. Ideal for gauges, stats, and current readings.

**Use Cases:**
- Dashboard gauges showing current temperature, humidity, etc.
- Status indicators (fan on/off, occupancy state)
- Current setpoints

**Query:**
```graphql
query GetCurrentValues {
  historianCurrentValues(
    topicPatterns: [
      "PNNL/ROB/%/ZoneTemperature",
      "PNNL/ROB/%/ZoneHumidity",
      "PNNL/ROB/rtu01/SupplyFanStatus"
    ],
    campus: "PNNL",
    building: "ROB",
    unit: "rtu01"
  ) {
    topic
    value
    timestamp
  }
}
```

**Example from Grafana Dashboard:**
```sql
-- Grafana query for Outdoor Air Temperature gauge
SELECT ts as "time", 
  CAST(NULLIF(value_string, 'null') AS double precision) as "OutdoorAirTemperature" 
FROM data NATURAL JOIN topics 
WHERE topic_name LIKE 'PNNL/ROB/%/OutdoorAirTemperature' 
ORDER BY ts DESC LIMIT 1;
```

**GraphQL Equivalent:**
```graphql
query {
  historianCurrentValues(
    topicPatterns: ["PNNL/ROB/%/OutdoorAirTemperature"]
  ) {
    topic
    value
    timestamp
  }
}
```

### 2. historianTimeSeries

Get time-series data for line charts and time-based visualizations.

**Use Cases:**
- Temperature trends over time
- Multiple metrics on same chart
- Historical analysis

**Query:**
```graphql
query GetTimeSeries {
  historianTimeSeries(
    topicPatterns: [
      "PNNL/ROB/rtu01/ZoneTemperature",
      "PNNL/ROB/rtu01/OccupiedCoolingSetPoint",
      "PNNL/ROB/rtu01/OccupiedHeatingSetPoint"
    ],
    startTime: "2026-03-03T00:00:00Z",
    endTime: "2026-03-03T23:59:59Z",
    building: "ROB",
    unit: "rtu01"
  ) {
    topic
    data {
      timestamp
      value
    }
  }
}
```

**Example from Grafana Dashboard:**
```sql
-- Grafana query for Zone Temperature time series
SELECT ts as "time", 
  CAST(NULLIF(value_string, 'null') AS double precision) as "ZoneTemperature" 
FROM data NATURAL JOIN topics 
WHERE topic_name LIKE 'PNNL/ROB/%/rtu01/ZoneTemperature' 
  AND ts >= NOW() - INTERVAL '24 hours' 
  AND ts <= NOW()
ORDER BY ts;
```

### 3. historianAggregated

Get aggregated data with time grouping for performance and downsampling.

**Use Cases:**
- Downsampling large time ranges
- Average/min/max calculations
- Performance optimization

**Query:**
```graphql
query GetAggregated {
  historianAggregated(
    topicPattern: "PNNL/ROB/rtu01/%StageCooling",
    startTime: "2026-03-03T00:00:00Z",
    endTime: "2026-03-03T23:59:59Z",
    interval: "5m",
    aggregation: SUM
  ) {
    timestamp
    value
    topicPattern
  }
}
```

**Example from Grafana Dashboard:**
```sql
-- Grafana query for cooling stage sum with time grouping
SELECT
  $__timeGroup(ts, '1m') AS "time",
  SUM(CAST(NULLIF(value_string, 'null') AS double precision)) AS "CoolingStage"
FROM data
NATURAL JOIN topics
WHERE topic_name LIKE 'PNNL/ROB/rtu01/%StageCooling'
  AND $__timeFilter(ts)
GROUP BY 1
ORDER BY 1;
```

**Aggregation Types:**
- `SUM` - Sum of values
- `AVG` - Average of values
- `MAX` - Maximum value
- `MIN` - Minimum value
- `COUNT` - Count of data points

**Interval Format:**
- `1s`, `30s` - Seconds
- `1m`, `5m`, `15m` - Minutes
- `1h`, `6h` - Hours
- `1d` - Days

### 4. historianMultiUnit

Get data for multiple units in a pivoted format for state timelines and comparisons.

**Use Cases:**
- Occupancy status across multiple RTUs
- Temperature comparisons between units
- Multi-unit state timelines

**Query:**
```graphql
query GetMultiUnit {
  historianMultiUnit(
    topicPattern: "PNNL/ROB/%UNIT%/OccupancyCommand",
    units: ["rtu01", "rtu02", "rtu03", "rtu04", "rtu05"],
    startTime: "2026-03-03T00:00:00Z",
    endTime: "2026-03-03T23:59:59Z",
    interval: "5m",
    campus: "PNNL",
    building: "ROB"
  ) {
    unit
    data {
      timestamp
      value
    }
  }
}
```

**Example from Grafana Dashboard:**
```sql
-- Grafana query for multi-unit occupancy status
SELECT
  $__timeGroup(ts, $__interval) AS time,
  MAX(CASE WHEN upper(split_part(topic_name, '/', 3)) = 'RTU01' 
      THEN CAST(NULLIF(value_string, 'null') AS double precision) END) AS rtu01,
  MAX(CASE WHEN upper(split_part(topic_name, '/', 3)) = 'RTU02' 
      THEN CAST(NULLIF(value_string, 'null') AS double precision) END) AS rtu02,
  MAX(CASE WHEN upper(split_part(topic_name, '/', 3)) = 'RTU03' 
      THEN CAST(NULLIF(value_string, 'null') AS double precision) END) AS rtu03
FROM data
NATURAL JOIN topics
WHERE topic_name LIKE 'PNNL/ROB/%/OccupancyCommand'
  AND $__timeFilter(ts)
GROUP BY 1
ORDER BY 1;
```

### 5. historianCalculated

Get calculated metrics like setpoint errors or rolling averages.

**Use Cases:**
- Temperature setpoint error (actual - setpoint)
- Rolling averages for smoothing
- Derived metrics

**Query for Setpoint Error:**
```graphql
query GetSetpointError {
  historianCalculated(
    calculation: SETPOINT_ERROR,
    topicPatterns: [
      "PNNL/ROB/rtu01/ZoneTemperature",
      "PNNL/ROB/rtu01/EffectiveZoneTemperatureSetPoint"
    ],
    startTime: "2026-03-03T00:00:00Z",
    endTime: "2026-03-03T23:59:59Z",
    building: "ROB",
    unit: "rtu01"
  ) {
    timestamp
    value
    topic
  }
}
```

**Query for Rolling Average:**
```graphql
query GetRollingAverage {
  historianCalculated(
    calculation: ROLLING_AVERAGE,
    topicPatterns: ["PNNL/ROB/meter/Watts"],
    startTime: "2026-03-03T00:00:00Z",
    endTime: "2026-03-03T23:59:59Z",
    options: {
      window: "30 minutes"
    }
  ) {
    timestamp
    value
    topic
  }
}
```

**Example from Grafana Dashboard:**
```sql
-- Grafana query for setpoint error calculation
WITH zone_temps AS (
  SELECT ts, CAST(NULLIF(value_string, 'null') AS double precision) AS temp_value
  FROM data NATURAL JOIN topics
  WHERE topic_name LIKE 'PNNL/ROB/rtu01/ZoneTemperature'
    AND $__timeFilter(ts)
),
zone_setpoints AS (
  SELECT ts, CAST(NULLIF(value_string, 'null') AS double precision) AS sp_value
  FROM data NATURAL JOIN topics
  WHERE topic_name LIKE 'PNNL/ROB/rtu01/EffectiveZoneTemperatureSetPoint'
    AND $__timeFilter(ts)
)
SELECT t.ts AS time, t.temp_value - s.sp_value AS value
FROM zone_temps t
JOIN zone_setpoints s ON t.ts = s.ts
ORDER BY t.ts;
```

**Calculation Types:**
- `SETPOINT_ERROR` - Calculate difference between actual and setpoint (requires 2 topic patterns)
- `ROLLING_AVERAGE` - Calculate rolling average over a time window

## Pattern Matching

Topic patterns support wildcards and placeholders:

- `%` - Wildcard matching any characters
- `%CAMPUS%` - Placeholder replaced by campus parameter
- `%BUILDING%` - Placeholder replaced by building parameter
- `%UNIT%` - Placeholder replaced by unit parameter

**Examples:**
```
"PNNL/ROB/%/ZoneTemperature"           # All units in ROB building
"PNNL/%/%/OutdoorAirTemperature"       # All buildings, all units
"%CAMPUS%/%BUILDING%/%UNIT%/ZoneTemp"  # Use parameters
```

## Dashboard Migration Examples

### Gauge Widget (Outdoor Air Temperature)

**Grafana:**
```json
{
  "type": "gauge",
  "targets": [{
    "rawSql": "SELECT ts as \"time\", CAST(NULLIF(value_string, 'null') AS double precision) as \"OutdoorAirTemperature\" from data natural join topics where topic_name like 'PNNL/ROB/%/OutdoorAirTemperature' AND $__timeFilter(ts) ORDER BY 1;"
  }]
}
```

**React Component:**
```typescript
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_OUTDOOR_TEMP = gql`
  query GetOutdoorTemp {
    historianCurrentValues(
      topicPatterns: ["PNNL/ROB/%/OutdoorAirTemperature"]
    ) {
      value
      timestamp
    }
  }
`;

function OutdoorTempGauge() {
  const { data } = useQuery(GET_OUTDOOR_TEMP, {
    pollInterval: 30000 // Refresh every 30 seconds
  });
  
  const value = data?.historianCurrentValues[0]?.value;
  
  return <GaugeComponent value={value} unit="°F" />;
}
```

### Time Series Chart (RTU Overview)

**React Component:**
```typescript
const GET_RTU_TIMESERIES = gql`
  query GetRTUTimeSeries($startTime: DateTime!, $endTime: DateTime!) {
    historianTimeSeries(
      topicPatterns: [
        "PNNL/ROB/rtu01/ZoneTemperature",
        "PNNL/ROB/rtu01/OccupiedCoolingSetPoint",
        "PNNL/ROB/rtu01/OccupiedHeatingSetPoint",
        "PNNL/ROB/rtu01/SupplyFanStatus"
      ],
      startTime: $startTime,
      endTime: $endTime
    ) {
      topic
      data {
        timestamp
        value
      }
    }
  }
`;

function RTUChart() {
  const { data } = useQuery(GET_RTU_TIMESERIES, {
    variables: {
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date()
    }
  });
  
  return <LineChart data={data?.historianTimeSeries} />;
}
```

### State Timeline (Occupancy Status)

**React Component:**
```typescript
const GET_OCCUPANCY_STATUS = gql`
  query GetOccupancyStatus($startTime: DateTime!, $endTime: DateTime!) {
    historianMultiUnit(
      topicPattern: "PNNL/ROB/%UNIT%/OccupancyCommand",
      units: ["rtu01", "rtu02", "rtu03", "rtu04", "rtu05"],
      startTime: $startTime,
      endTime: $endTime,
      interval: "5m"
    ) {
      unit
      data {
        timestamp
        value
      }
    }
  }
`;

function OccupancyTimeline() {
  const { data } = useQuery(GET_OCCUPANCY_STATUS, {
    variables: {
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date()
    }
  });
  
  return <StateTimeline data={data?.historianMultiUnit} />;
}
```

## Performance Considerations

1. **Use aggregation for large time ranges**: When querying more than 24 hours of data, use `historianAggregated` with an appropriate interval.

2. **Limit topic patterns**: Be specific with topic patterns to reduce database load.

3. **Cache current values**: Use Apollo Client caching or React Query for frequently accessed current values.

4. **Pagination**: For very large datasets, implement cursor-based pagination on the frontend.

5. **WebSocket subscriptions**: For real-time updates, consider using GraphQL subscriptions (future enhancement).

## Error Handling

The API will throw errors for:
- Invalid interval format
- Missing required parameters
- Database connection issues
- Invalid calculation types

Example error response:
```json
{
  "errors": [{
    "message": "Invalid interval format. Use format like '1m', '5m', '1h', etc.",
    "extensions": {
      "code": "BAD_USER_INPUT"
    }
  }]
}
```

## Next Steps

1. **Caching Layer**: Implement Redis caching for frequently accessed data
2. **Subscriptions**: Add GraphQL subscriptions for real-time updates
3. **Batch Loading**: Implement DataLoader for optimized batch queries
4. **Rate Limiting**: Configure query complexity limits
5. **Monitoring**: Add performance monitoring and query analytics
