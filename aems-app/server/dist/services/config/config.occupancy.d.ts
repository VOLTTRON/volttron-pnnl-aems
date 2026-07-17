export type OccupiedRange = "always_on" | "always_off" | {
    start: string;
    end: string;
};
export type ServiceWindow = "always_on" | "always_off" | {
    start: string;
    end: string;
};
export declare function toMinutes(t?: string | null): number | null;
export declare function toOccupiedRange(occupied?: boolean | null, startTime?: string | null, endTime?: string | null): OccupiedRange;
export declare function toServiceWindow(startTime?: string | null, endTime?: string | null): ServiceWindow;
