import build from "pino-abstract-transport";
import { Transform } from "node:stream";
declare const transport: (options: {
    levels?: Record<string, any>;
}) => Promise<(Transform & build.OnUnknown) | undefined>;
export default transport;
//# sourceMappingURL=index.d.ts.map