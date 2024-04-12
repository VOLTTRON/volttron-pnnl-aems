import { builder } from "../builder";

export const UnitsObject = builder.prismaObject("Units", {
  authScopes: { user: true },
  fields: (t) => ({
    // key
    id: t.exposeInt("id", { authScopes: { user: true } }),
    // fields
    name: t.exposeString("name", { authScopes: { user: true } }),
    campus: t.exposeString("campus", { authScopes: { user: true } }),
    building: t.exposeString("building", { authScopes: { user: true } }),
    system: t.exposeString("system", { authScopes: { user: true } }),
    timezone: t.exposeString("timezone", { authScopes: { user: true } }),
    label: t.exposeString("label", { authScopes: { user: true } }),
    coolingCapacity: t.exposeFloat("coolingCapacity", { authScopes: { user: true } }),
    compressors: t.exposeInt("compressors", { authScopes: { user: true } }),
    coolingLockout: t.exposeFloat("coolingLockout", { authScopes: { user: true } }),
    optimalStartLockout: t.exposeFloat("optimalStartLockout", { authScopes: { user: true } }),
    optimalStartDeviation: t.exposeFloat("optimalStartDeviation", { authScopes: { user: true } }),
    earliestStart: t.exposeInt("earliestStart", { authScopes: { user: true } }),
    latestStart: t.exposeInt("latestStart", { authScopes: { user: true } }),
    zoneLocation: t.exposeString("zoneLocation", { authScopes: { user: true } }),
    zoneMass: t.exposeString("zoneMass", { authScopes: { user: true } }),
    zoneOrientation: t.exposeString("zoneOrientation", { authScopes: { user: true } }),
    zoneBuilding: t.exposeString("zoneBuilding", { authScopes: { user: true } }),
    heatPump: t.exposeBoolean("heatPump", { authScopes: { user: true } }),
    heatPumpBackup: t.exposeFloat("heatPumpBackup", { authScopes: { user: true } }),
    economizer: t.exposeBoolean("economizer", { authScopes: { user: true } }),
    heatPumpLockout: t.exposeFloat("heatPumpLockout", { authScopes: { user: true } }),
    coolingPeakOffset: t.exposeFloat("coolingPeakOffset", { authScopes: { user: true } }),
    heatingPeakOffset: t.exposeFloat("heatingPeakOffset", { authScopes: { user: true } }),
    peakLoadExclude: t.exposeBoolean("peakLoadExclude", { authScopes: { user: true } }),
    economizerSetpoint: t.exposeFloat("economizerSetpoint", { authScopes: { user: true } }),
    // metadata
    stage: t.expose("stage", { type: "StageType", authScopes: { user: true } }),
    message: t.exposeString("message", { authScopes: { user: true }, nullable: true }),
    correlation: t.exposeString("correlation", { authScopes: { user: true }, nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime", authScopes: { user: true } }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", authScopes: { user: true } }),
    // foreign keys
    configurationId: t.exposeInt("configurationId", { authScopes: { user: true }, nullable: true }),
    // controlId: t.exposeInt("controlId", { authScopes: { user: true }, nullable: true }),
    // direct relations
    configuration: t.relation("configuration", { authScopes: { user: true }, nullable: true }),
    // control: t.relation("control", { authScopes: { user: true }, nullable: true }),
  }),
});
