import { Prisma } from "@prisma/client";
export interface Seeder {
    type: "upsert" | "create" | "update" | "delete";
    table: Prisma.TypeMap["meta"]["modelProps"];
    id: string;
    data: Record<string, any>[];
}
export interface FileSeeder extends Seeder {
    jsonpath: `$.${string}[]`;
    data: Record<"filename", string>[];
}
export interface Mapping {
    id: string;
    name: string;
    group: string;
    type: string;
}
export interface GeographySeeder<M extends Mapping = {
    id: "id";
    name: "name";
    group: "group";
    type: "type";
}> extends FileSeeder {
    table: "geography";
    id: "id";
    geography: {
        mapping: {
            id: M["id"];
            name: M["name"];
            group: M["group"];
            type: M["type"];
        };
        defaults?: Partial<Omit<Record<keyof M, string | number>, "id">>;
        geojson: GeographyGeoJson<M["id"], M["name"], M["group"], M["type"]>;
    };
    jsonpath: "$.features[]";
    data: Record<"filename", string>[];
}
export interface GeographyGeoJson<I extends string, N extends string, G extends string, T extends string> {
    properties: Partial<Record<I | N | G | T, string | number>> & Record<string, any>;
    geometry: GeoJSON.Geometry;
}
