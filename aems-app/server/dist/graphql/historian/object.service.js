"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorianObject = void 0;
const common_1 = require("@nestjs/common");
const builder_service_1 = require("../builder.service");
const pothos_decorator_1 = require("../pothos.decorator");
const common_2 = require("@local/common");
const metrics_1 = require("../../historian/metrics");
const graphql_1 = require("graphql");
let HistorianObject = class HistorianObject {
    constructor(builder) {
        this.AggregationType = builder.enumType(common_2.AggregationType, {
            name: "AggregationType",
            description: "Type of aggregation to apply to historian data",
        });
        this.CalculationType = builder.enumType(common_2.CalculationType, {
            name: "CalculationType",
            description: "Type of calculation to perform on historian data",
        });
        this.UnitMetric = builder.enumType(metrics_1.UnitMetric, {
            name: "UnitMetric",
            description: "Available metrics for unit/system data (HVAC equipment)",
        });
        this.WeatherMetric = builder.enumType(metrics_1.WeatherMetric, {
            name: "WeatherMetric",
            description: "Available metrics for weather data",
        });
        this.HistorianDataPoint = builder.addScalarType("HistorianDataPoint", new graphql_1.GraphQLScalarType({ name: "HistorianDataPoint" }));
        this.HistorianTimeSeries = builder.addScalarType("HistorianTimeSeries", new graphql_1.GraphQLScalarType({ name: "HistorianTimeSeries" }));
        this.HistorianAggregate = builder.addScalarType("HistorianAggregate", new graphql_1.GraphQLScalarType({ name: "HistorianAggregate" }));
        this.HistorianMetricCurrent = builder.addScalarType("HistorianMetricCurrent", new graphql_1.GraphQLScalarType({ name: "HistorianMetricCurrent" }));
        this.HistorianMultiSystemData = builder.addScalarType("HistorianMultiSystemData", new graphql_1.GraphQLScalarType({ name: "HistorianMultiSystemData" }));
        this.HistorianReplicationInfo = builder.addScalarType("HistorianReplicationInfo", new graphql_1.GraphQLScalarType({ name: "HistorianReplicationInfo" }));
        this.PublisherInfo = builder.addScalarType("PublisherInfo", new graphql_1.GraphQLScalarType({ name: "PublisherInfo" }));
        this.SubscriberSetupSql = builder.addScalarType("SubscriberSetupSql", new graphql_1.GraphQLScalarType({ name: "SubscriberSetupSql" }));
        this.MonitoringSql = builder.addScalarType("MonitoringSql", new graphql_1.GraphQLScalarType({ name: "MonitoringSql" }));
        this.ReplicationSlot = builder.addScalarType("ReplicationSlot", new graphql_1.GraphQLScalarType({ name: "ReplicationSlot" }));
    }
};
exports.HistorianObject = HistorianObject;
exports.HistorianObject = HistorianObject = __decorate([
    (0, common_1.Injectable)(),
    (0, pothos_decorator_1.PothosObject)(),
    __metadata("design:paramtypes", [builder_service_1.SchemaBuilderService])
], HistorianObject);
//# sourceMappingURL=object.service.js.map