export declare const METADATA_FIELDS: string[];
export declare const TRACKED_MODELS: readonly ["Configuration", "Setpoint", "Schedule", "Occupancy", "Holiday", "Unit", "Control"];
export type TrackedModel = (typeof TRACKED_MODELS)[number];
export interface Marked {
    units: string[];
    controls: string[];
}
type Ids = {
    id: string;
}[];
type Where = Record<string, unknown>;
export interface MarkingClient {
    configuration: {
        findMany(args: {
            where: Where;
            select: {
                id: true;
            };
        }): Promise<Ids>;
    };
    schedule: {
        findMany(args: {
            where: Where;
            select: {
                id: true;
            };
        }): Promise<Ids>;
    };
    occupancy: {
        findMany(args: {
            where: Where;
            select: {
                configurationId: true;
            };
        }): Promise<{
            configurationId: string | null;
        }[]>;
    };
    unit: {
        findMany(args: {
            where: Where;
            select: {
                id: true;
                configurationId: true;
                controlId: true;
            };
        }): Promise<{
            id: string;
            configurationId: string | null;
            controlId: string | null;
        }[]>;
        updateMany(args: {
            where: Where;
            data: Where;
        }): Promise<unknown>;
    };
    control: {
        updateMany(args: {
            where: Where;
            data: Where;
        }): Promise<unknown>;
    };
}
export declare function changesWhatIsSent(operation: string, args: {
    data?: unknown;
}): boolean;
export declare function reach(client: MarkingClient, model: TrackedModel, ids: string[], withConfiguration?: boolean): Promise<Marked>;
export declare function writeAndMark<T>(client: MarkingClient, model: string | undefined, operation: string, args: {
    where?: Where;
    data?: unknown;
}, query: (args: unknown) => Promise<T>): Promise<{
    result: T;
    marked: Marked;
}>;
export {};
