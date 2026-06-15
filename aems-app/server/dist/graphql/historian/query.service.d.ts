import { SchemaBuilderService } from "../builder.service";
import { HistorianService } from "@/historian/historian.service";
import { HistorianObject } from "./object.service";
export declare class HistorianQuery {
    constructor(builder: SchemaBuilderService, historianService: HistorianService, historianObject: HistorianObject);
}
