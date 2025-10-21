import { set } from "lodash";

import { Aggregate, GroupBy } from "./types";

const transformAggregate = <T extends string>(aggregate?: Aggregate<T> | null): GroupBy<T> => {
    const temp: GroupBy<T> = {};
    [
        { src: "average" as keyof Aggregate<T>, dst: "_avg" as keyof GroupBy<T> },
        { src: "count" as keyof Aggregate<T>, dst: "_count" as keyof GroupBy<T> },
        { src: "maximum" as keyof Aggregate<T>, dst: "_max" as keyof GroupBy<T> },
        { src: "minimum" as keyof Aggregate<T>, dst: "_min" as keyof GroupBy<T> },
        { src: "sum" as keyof Aggregate<T>, dst: "_sum" as keyof GroupBy<T> },
    ].forEach(({ src, dst }) => {
        const fields = aggregate?.[src];
        if (fields) {
            temp[dst] = fields.reduce((a, v) => set(a, v, true), {} as { [k in T]: boolean | null });
        }
    });
    return temp;
};

export { transformAggregate };