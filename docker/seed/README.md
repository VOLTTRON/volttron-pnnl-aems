Files, with the extension `.json`, placed in this directory will get seeded at server start.
Modifying the file date will cause a seed file to get re-processed.
Files can be safely deleted after being processed.
JSON should conform to: [/server/src/services/seed#Seeder](../../server/src/services/seed/index.ts)

```json
{
  "type": "upsert",
  "table": "user",
  "id": "id",
  "data": [
    {
      "id": "1",
      "name": "Jane Doe",
      "email": "jane-doe@doe.org",
      "password": "ChAnGe_ThIs_PaSsWoRd_0x2E",
      "role": "user",
      "preferences": {}
    }
  ]
}
```

Geography seeder files, with the extension `.json`, placed in this directory will get seeded at server start.
Modifying the file date will cause a seed file to get re-processed.
Files can be safely deleted after being processed.
Geo boundary files can be downloaded from [geoBoundaries](https://www.geoboundaries.org/) and should be in the format of a FeatureCollection [geojson](https://geojson.org/) file.
GeoJSON feature properties should conform to: [/server/src/services/seed#GeoBoundary](../../server/src/services/seed/index.ts#L10)
Open source maritime boundaries can be downloaded from [Marine Regions](https://www.marineregions.org/) and may need to be converted to the format of a FeatureCollection [geojson](https://geojson.org/) file.

> Note: Very large files may fail which can be avoided by splitting the file into smaller files.

The geography seeder is used to seed the `geography` table with data from a GeoJSON file and must conform to the following interface.

- data: This is a list of filenames for this seeder.
- geography.mapping: This is a mapping of the `geography` table fields to the GeoJSON feature properties.
- geography.defaults: This is a mapping of the `geography` table fields to default values which are used if the field is not present in the GeoJSON feature properties. Missing IDs will get created automatically in the format `{type}-{group}-{name}` using normalized values.

```json
{
  "type": "create",
  "table": "geography",
  "id": "id",
  "geography": {
    "mapping": {
      "id": "shapeID",
      "name": "shapeName",
      "group": "shapeGroup",
      "type": "shapeType"
    },
    "defaults": {
      "type": "Marine Regions"
    }
  },
  "data": [
    {
      "filename": "path/to/file.geojson"
    }
  ]
}
```
