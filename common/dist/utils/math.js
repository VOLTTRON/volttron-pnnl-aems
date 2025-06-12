"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.range = exports.invlerp = exports.clamp = exports.lerp = void 0;
const lerp = (min, max, a) => min * (1 - a) + max * a;
exports.lerp = lerp;
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
exports.clamp = clamp;
const invlerp = (min, max, a) => (0, exports.clamp)((a - min) / (max - min));
exports.invlerp = invlerp;
const range = (aMin, aMax, rMin, rMax, a) => aMin === aMax ? rMax : (0, exports.lerp)(rMin, rMax, (0, exports.invlerp)(aMin, aMax, a));
exports.range = range;
//# sourceMappingURL=math.js.map