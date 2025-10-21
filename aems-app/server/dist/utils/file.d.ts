import { Logger } from "@nestjs/common";
export declare function getObjectKey(file: File | {
    name: string;
}): string;
export declare function getConfigFiles(paths: string[], filter?: string | RegExp, logger?: Logger): Promise<string[]>;
