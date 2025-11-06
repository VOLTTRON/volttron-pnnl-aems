# Database Seeding Configuration

<p align="center">
  <strong>Database initialization and seeding configuration for the Skeleton App</strong>
</p>

<p align="center">
  <a href="https://www.postgresql.org/" target="_blank">
    <img src="https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql" alt="PostgreSQL Version" />
  </a>
  <a href="https://postgis.net/" target="_blank">
    <img src="https://img.shields.io/badge/PostGIS-3+-4169E1?logo=postgresql" alt="PostGIS Version" />
  </a>
  <a href="https://geojson.org/" target="_blank">
    <img src="https://img.shields.io/badge/GeoJSON-supported-green.svg" alt="GeoJSON Support" />
  </a>
</p>

---

## Overview

This directory contains database seeding configuration files that are automatically processed when the server starts. The seeding service supports multiple data formats and specialized processing for geospatial data, with memory-efficient streaming for large datasets.

## How Seeding Works

### Automatic Processing

- **File Detection**: JSON files (`.json` extension) in this directory are automatically detected
- **Timestamp Checking**: Files are re-processed only when modified (based on file modification time)
- **Safe Deletion**: Files can be safely deleted after successful processing
- **Error Handling**: Failed seeding operations are logged with detailed error information

### Service Configuration

The seeding service is controlled by environment variables:

```bash
# Enable/disable seeding service
INSTANCE_TYPE=seed              # Run seeding service
INSTANCE_TYPE=^seed             # Run seeding once then shutdown
INSTANCE_TYPE=""                # Disable seeding service

# Seeding configuration
SERVICE_SEED_DATA_PATH=../docker/seed    # Path to seed files
SERVICE_SEED_BATCH_SIZE=100              # Batch size for processing
```

## Seeder File Formats

### Standard Seeder Format

Traditional format for small to medium datasets loaded directly into memory:

```json
{
  "type": "upsert",
  "table": "user",
  "id": "id",
  "data": [
    {
      "id": "admin",
      "name": "Administrator",
      "email": "admin@example.com",
      "password": "$2b$12$hashedpassword",
      "role": "admin",
      "preferences": {
        "theme": "dark",
        "notifications": true
      }
    },
    {
      "id": "user",
      "name": "Regular User",
      "email": "user@example.com",
      "password": "$2b$12$hashedpassword",
      "role": "user",
      "preferences": {}
    }
  ]
}
```

**Standard Seeder Properties:**
- `type`: Operation type (`create`, `upsert`, `update`)
- `table`: Target database table name
- `id`: Primary key field name
- `data`: Array of records to insert/update

### File Seeder Format

For processing large external JSON files with streaming and JSONPath queries:

```json
{
  "type": "create",
  "table": "location",
  "id": "id",
  "jsonpath": "$.locations[]",
  "data": [
    { "filename": "large-locations.json" },
    { "filename": "additional-locations.json" }
  ]
}
```

**File Seeder Properties:**
- `jsonpath`: JSONPath expression to extract data from files
- `data`: Array of file references instead of inline data
- Supports memory-efficient streaming of large files

### Geography Seeder Format

Specialized format for processing GeoJSON files with field mapping and automatic ID generation:

```json
{
  "table": "geography",
  "type": "create",
  "id": "id",
  "geography": {
    "mapping": {
      "id": "shapeID",
      "name": "shapeName",
      "group": "shapeGroup", 
      "type": "shapeType"
    },
    "defaults": {
      "type": "boundary",
      "group": "administrative"
    }
  },
  "jsonpath": "$.features[]",
  "data": [
    { "filename": "countries.geojson" },
    { "filename": "states.geojson" },
    { "filename": "cities.geojson" }
  ]
}
```

**Geography Seeder Properties:**
- `geography.mapping`: Maps GeoJSON properties to database fields
- `geography.defaults`: Default values for missing fields
- Automatic ID generation using normalized values
- Specialized GeoJSON processing with PostGIS integration

## Operation Types

### Create Operations

Insert new records, skip if already exists:

```json
{
  "type": "create",
  "table": "comment",
  "id": "id",
  "data": [
    {
      "id": "comment-1",
      "message": "Welcome to the application!",
      "userId": "admin"
    }
  ]
}
```

### Upsert Operations

Insert new records or update existing ones:

```json
{
  "type": "upsert",
  "table": "banner",
  "id": "id",
  "data": [
    {
      "id": "welcome-banner",
      "message": "Welcome to Skeleton App!",
      "expiration": "2024-12-31T23:59:59.000Z"
    }
  ]
}
```

### Update Operations

Update existing records only:

```json
{
  "type": "update",
  "table": "user",
  "id": "id",
  "data": [
    {
      "id": "admin",
      "preferences": {
        "theme": "light",
        "notifications": false
      }
    }
  ]
}
```

## JSONPath Support

The seeding service supports JSONPath expressions for extracting specific data from complex JSON structures:

### Common JSONPath Expressions

| Expression | Description | Example Use Case |
|------------|-------------|------------------|
| `$.features[]` | Extract all features from GeoJSON | Geography data processing |
| `$.data[]` | Extract all items from data array | API response processing |
| `$.users[]` | Extract all user objects | User data import |
| `$.locations[].address` | Extract address from locations | Address normalization |

### JSONPath Examples

**GeoJSON Feature Extraction:**
```json
{
  "jsonpath": "$.features[]",
  "data": [{ "filename": "countries.geojson" }]
}
```

**Nested Object Processing:**
```json
{
  "jsonpath": "$.users[].profile",
  "data": [{ "filename": "user-profiles.json" }]
}
```

**Array Element Selection:**
```json
{
  "jsonpath": "$.data[0].records[]",
  "data": [{ "filename": "paginated-data.json" }]
}
```

## Geography Data Processing

### Field Mapping

Maps GeoJSON properties to database fields using configurable mapping:

```json
{
  "geography": {
    "mapping": {
      "id": "ISO_A2",        // Use ISO_A2 property as ID
      "name": "NAME",        // Use NAME property as name
      "type": "TYPE",        // Use TYPE property as type
      "group": "CONTINENT"   // Use CONTINENT property as group
    }
  }
}
```

### Automatic ID Generation

When no ID is found in the mapped field, generates normalized IDs:

```javascript
// Example: "country-europe-france"
const id = `${normalize(type)}-${normalize(group)}-${normalize(name)}`;
```

**Normalization Process:**
- Unicode normalization (NFD)
- Convert to lowercase
- Remove spaces and special characters
- Keep only letters and numbers

### Default Values

Provides fallback values for missing fields:

```json
{
  "geography": {
    "defaults": {
      "type": "country",
      "group": "world"
    }
  }
}
```

## Data Sources

### Geographic Data Sources

**Administrative Boundaries:**
- [geoBoundaries](https://www.geoboundaries.org/) - Global administrative boundaries
- [Natural Earth](https://www.naturalearthdata.com/) - Public domain map dataset
- [OpenStreetMap](https://www.openstreetmap.org/) - Collaborative mapping data

**Maritime Boundaries:**
- [Marine Regions](https://www.marineregions.org/) - Marine and maritime boundaries
- [VLIZ](https://www.vliz.be/) - Marine data and information services

**Data Format Requirements:**
- GeoJSON FeatureCollection format
- Valid GeoJSON geometry objects
- Consistent property naming across features

### User Data Sources

**Authentication Data:**
- Hashed passwords using bcrypt (salt rounds: 12)
- Valid email addresses
- Role assignments: `admin`, `user`, `moderator`

**Example Password Hashing:**
```bash
# Generate bcrypt hash for password
node -e "console.log(require('@node-rs/bcrypt').hashSync('your-password', 12))"
```

## Performance Considerations

### Memory Efficiency

**Streaming Processing:**
- Large files processed without loading entire contents into memory
- Constant memory usage regardless of file size
- Suitable for multi-gigabyte datasets

**Batch Processing:**
- Configurable batch sizes for database operations
- Optimized for bulk insert performance
- Automatic transaction management

### Processing Speed

**Incremental Processing:**
- Only modified files are re-processed
- Timestamp-based change detection
- Parallel processing of multiple files

**Database Optimization:**
- Bulk insert operations where possible
- Efficient upsert queries using PostgreSQL features
- Index-aware processing for large datasets

## Troubleshooting

### Common Issues

#### File Processing Errors

```bash
# Check seeding service logs
docker compose logs services

# Verify file format and syntax
cat seed-file.json | jq .

# Check file permissions
ls -la docker/seed/
```

#### Memory Issues with Large Files

```bash
# Use file seeder format for large datasets
# Split large files into smaller chunks
# Monitor container memory usage
docker stats skeleton-services
```

#### GeoJSON Processing Issues

```bash
# Validate GeoJSON format
cat geography.geojson | jq '.features[0]'

# Check property mapping
# Ensure mapped properties exist in GeoJSON features
# Verify geometry validity
```

### Database Issues

#### Constraint Violations

```bash
# Check for duplicate IDs
# Verify foreign key relationships
# Review table constraints

# Example: Check user references
SELECT * FROM "User" WHERE id NOT IN (SELECT DISTINCT "userId" FROM "Comment");
```

#### PostGIS Geometry Errors

```bash
# Validate geometry in PostgreSQL
SELECT ST_IsValid(geojson::geometry) FROM "Geography" WHERE NOT ST_IsValid(geojson::geometry);

# Fix invalid geometries
UPDATE "Geography" SET geojson = ST_MakeValid(geojson::geometry)::json WHERE NOT ST_IsValid(geojson::geometry);
```

## Best Practices

### File Organization

- Use descriptive filenames with timestamps: `20240101-users.json`
- Group related data in separate files
- Keep file sizes manageable (< 100MB for standard seeders)
- Use file seeders for datasets > 100MB

### Data Quality

- Validate JSON syntax before deployment
- Use consistent data formats across files
- Include all required fields for database constraints
- Test seeding with sample data first

### Security

- Hash passwords before including in seed files
- Avoid sensitive data in seed files
- Use environment variables for secrets
- Review seed data for production deployments

### Performance

- Use appropriate operation types (create vs upsert)
- Batch related operations in single files
- Consider database indexes for large datasets
- Monitor seeding performance and memory usage

---

<p align="center">
  <strong>Database Seeding for Skeleton App</strong><br>
  <em>Automated data initialization with streaming support</em>
</p>
