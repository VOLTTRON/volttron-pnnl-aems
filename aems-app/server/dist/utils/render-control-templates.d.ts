import { Logger } from "@nestjs/common";
export declare function renderControlTemplates(control: unknown, templatePaths: string[], logger?: Logger): Promise<Record<string, unknown>>;
