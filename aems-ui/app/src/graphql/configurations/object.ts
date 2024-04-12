import { builder } from "../builder";

export const ConfigurationsObject = builder.prismaObject("Configurations", {
  authScopes: { user: true },
  fields: (t) => ({
    // key
    id: t.exposeInt("id", { authScopes: { user: true } }),
    // fields
    label: t.exposeString("label", { authScopes: { user: true } }),
    // metadata
    stage: t.expose("stage", { type: "StageType", authScopes: { user: true } }),
    message: t.exposeString("message", { authScopes: { user: true }, nullable: true }),
    correlation: t.exposeString("correlation", { authScopes: { user: true }, nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime", authScopes: { user: true } }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", authScopes: { user: true } }),
    // foreign keys
    // setpointId: t.exposeInt("setpointId", { authScopes: { user: true }, nullable: true }),
    // mondayScheduleId: t.exposeInt("mondayScheduleId", { authScopes: { user: true }, nullable: true }),
    // tuesdayScheduleId: t.exposeInt("tuesdayScheduleId", { authScopes: { user: true }, nullable: true }),
    // wednesdayScheduleId: t.exposeInt("wednesdayScheduleId", { authScopes: { user: true }, nullable: true }),
    // thursdayScheduleId: t.exposeInt("thursdayScheduleId", { authScopes: { user: true }, nullable: true }),
    // fridayScheduleId: t.exposeInt("fridayScheduleId", { authScopes: { user: true }, nullable: true }),
    // saturdayScheduleId: t.exposeInt("saturdayScheduleId", { authScopes: { user: true }, nullable: true }),
    // sundayScheduleId: t.exposeInt("sundayScheduleId", { authScopes: { user: true }, nullable: true }),
    // holidayScheduleId: t.exposeInt("holidayScheduleId", { authScopes: { user: true }, nullable: true }),
    // direct relations
    // setpoint: t.relation("setpoint", { authScopes: { user: true }, nullable: true }),
    // mondaySchedule: t.relation("mondaySchedule", { authScopes: { user: true }, nullable: true }),
    // tuesdaySchedule: t.relation("tuesdaySchedule", { authScopes: { user: true }, nullable: true }),
    // wednesdaySchedule: t.relation("wednesdaySchedule", { authScopes: { user: true }, nullable: true }),
    // thursdaySchedule: t.relation("thursdaySchedule", { authScopes: { user: true }, nullable: true }),
    // fridaySchedule: t.relation("fridaySchedule", { authScopes: { user: true }, nullable: true }),
    // saturdaySchedule: t.relation("saturdaySchedule", { authScopes: { user: true }, nullable: true }),
    // sundaySchedule: t.relation("sundaySchedule", { authScopes: { user: true }, nullable: true }),
    // holidaySchedule: t.relation("holidaySchedule", { authScopes: { user: true }, nullable: true }),
  }),
});
