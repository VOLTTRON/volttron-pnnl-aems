Files, with the extension `.json`, placed in this directory will get seeded at server start.
Modifying the file date will cause a seed file to get re-processed.
Files can be safely deleted after being processed.
JSON should conform to: `./app/src/services/types/Seeder`

```ts
interface Seeder {
  type: "upsert" | "create" | "update" | "delete"; // the database operation to perform
  table: string; // the database table name
  id: string; // the field name for the unique id
  data: Record<string, any>[]; // the data to seed
}
```
