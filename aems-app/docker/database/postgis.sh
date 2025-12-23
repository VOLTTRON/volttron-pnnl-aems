#!/bin/bash
set -e

# PostGIS initialization script for PostgreSQL
# This script sets up PostGIS and related spatial extensions
# PostGIS packages are pre-installed in the Docker image

echo "Starting PostGIS initialization..."

# Function to run SQL commands
run_sql() {
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        $1
EOSQL
}

# Create PostGIS extensions
echo "Creating PostGIS extensions..."
run_sql "
    -- Create PostGIS extension
    CREATE EXTENSION IF NOT EXISTS postgis;
    
    -- Create PostGIS topology extension
    CREATE EXTENSION IF NOT EXISTS postgis_topology;
    
    -- Create PostGIS raster extension (if available)
    DO \$\$
    BEGIN
        CREATE EXTENSION IF NOT EXISTS postgis_raster;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'PostGIS raster extension not available: %', SQLERRM;
    END
    \$\$;
    
    -- Create PostGIS SFCGAL extension for 3D operations (if available)
    DO \$\$
    BEGIN
        CREATE EXTENSION IF NOT EXISTS postgis_sfcgal;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'PostGIS SFCGAL extension not available: %', SQLERRM;
    END
    \$\$;
    
    -- Create UUID extension (useful for spatial applications)
    CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
    
    -- Create btree_gist extension (useful for spatial indexing)
    CREATE EXTENSION IF NOT EXISTS btree_gist;
    
    -- Create pg_trgm extension (useful for text search in spatial apps)
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    
    -- Create unaccent extension (useful for geocoding)
    CREATE EXTENSION IF NOT EXISTS unaccent;
"

# Set up spatial reference systems and common spatial functions
echo "Setting up spatial reference systems and utilities..."
run_sql "
    -- Ensure common spatial reference systems are available
    -- EPSG:4326 (WGS84) - World Geodetic System 1984
    -- EPSG:3857 (Web Mercator) - Spherical Mercator projection used by web mapping
    -- These are typically included with PostGIS, but we verify they exist
    
    -- Create a function to safely insert SRID if it doesn't exist
    CREATE OR REPLACE FUNCTION insert_srid_if_not_exists(
        p_auth_name text,
        p_auth_srid integer,
        p_srtext text,
        p_proj4text text
    )
    RETURNS void AS \$\$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM spatial_ref_sys WHERE auth_name = p_auth_name AND auth_srid = p_auth_srid) THEN
            INSERT INTO spatial_ref_sys (auth_name, auth_srid, srtext, proj4text)
            VALUES (p_auth_name, p_auth_srid, p_srtext, p_proj4text);
        END IF;
    EXCEPTION
        WHEN others THEN
            -- Ignore errors (SRID might already exist)
            NULL;
    END;
    \$\$ LANGUAGE plpgsql;
"

# Create helpful spatial utility functions
echo "Creating spatial utility functions..."
run_sql "
    -- Function to get bounding box of all geometries in a table
    CREATE OR REPLACE FUNCTION get_table_extent(
        schema_name text,
        table_name text,
        geom_column text DEFAULT 'geom'
    )
    RETURNS geometry AS \$\$
    DECLARE
        extent_geom geometry;
        sql_query text;
    BEGIN
        sql_query := format('SELECT ST_Extent(%I) FROM %I.%I', geom_column, schema_name, table_name);
        EXECUTE sql_query INTO extent_geom;
        RETURN extent_geom;
    END;
    \$\$ LANGUAGE plpgsql;
    
    -- Function to create spatial index if it doesn't exist
    CREATE OR REPLACE FUNCTION create_spatial_index_if_not_exists(
        schema_name text,
        table_name text,
        geom_column text DEFAULT 'geom'
    )
    RETURNS void AS \$\$
    DECLARE
        index_name text;
    BEGIN
        index_name := format('%s_%s_gist', table_name, geom_column);
        
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = schema_name 
            AND tablename = table_name 
            AND indexname = index_name
        ) THEN
            EXECUTE format('CREATE INDEX %I ON %I.%I USING GIST (%I)', 
                index_name, schema_name, table_name, geom_column);
        END IF;
    END;
    \$\$ LANGUAGE plpgsql;
"

# Set up permissions for spatial extensions
echo "Setting up permissions..."
run_sql "
    -- Grant usage on spatial extensions to public
    GRANT USAGE ON SCHEMA public TO PUBLIC;
    GRANT ALL ON SCHEMA public TO \"$POSTGRES_USER\";
    
    -- Grant execute permissions on spatial functions
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;
"

# Display PostGIS version information
echo "Displaying PostGIS installation information..."
run_sql "
    -- Display PostGIS version
    SELECT PostGIS_Version() as postgis_version;
    
    -- Display available extensions
    SELECT name, default_version, installed_version 
    FROM pg_available_extensions 
    WHERE name LIKE '%postgis%' OR name IN ('uuid-ossp', 'btree_gist', 'pg_trgm', 'unaccent')
    ORDER BY name;
    
    -- Display spatial reference systems count
    SELECT COUNT(*) as srid_count FROM spatial_ref_sys;
"

echo "PostGIS initialization completed successfully!"
echo ""
echo "Available spatial extensions:"
echo "- PostGIS: Core spatial functionality"
echo "- PostGIS Topology: Topological spatial analysis"
echo "- PostGIS Raster: Raster spatial data support"
echo "- PostGIS SFCGAL: 3D spatial operations"
echo "- UUID-OSSP: UUID generation functions"
echo "- btree_gist: Additional indexing options"
echo "- pg_trgm: Text similarity and indexing"
echo "- unaccent: Text normalization for geocoding"
echo ""
echo "Common EPSG codes available:"
echo "- 4326: WGS84 (latitude/longitude)"
echo "- 3857: Web Mercator (web mapping)"
echo ""
echo "Utility functions created:"
echo "- get_table_extent(schema, table, geom_column): Get bounding box"
echo "- create_spatial_index_if_not_exists(schema, table, geom_column): Create spatial index"