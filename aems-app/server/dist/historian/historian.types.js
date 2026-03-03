"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalculationType = exports.AggregationType = void 0;
var AggregationType;
(function (AggregationType) {
    AggregationType["SUM"] = "SUM";
    AggregationType["AVG"] = "AVG";
    AggregationType["MAX"] = "MAX";
    AggregationType["MIN"] = "MIN";
    AggregationType["COUNT"] = "COUNT";
})(AggregationType || (exports.AggregationType = AggregationType = {}));
var CalculationType;
(function (CalculationType) {
    CalculationType["SETPOINT_ERROR"] = "SETPOINT_ERROR";
    CalculationType["ROLLING_AVERAGE"] = "ROLLING_AVERAGE";
})(CalculationType || (exports.CalculationType = CalculationType = {}));
//# sourceMappingURL=historian.types.js.map