import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Mutation, typeofObject } from "@local/common";
import { Injectable } from "@nestjs/common";
import {
  ChangeMutation,
  Configuration,
  Control,
  Holiday,
  Location,
  Occupancy,
  Prisma,
  Schedule,
  Setpoint,
  Unit,
} from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";

@Injectable()
export class ChangeService {
  constructor(
    private prismaService: PrismaService,
    private subscriptionService: SubscriptionService,
  ) {}

  private transform(entity: object): JsonObject {
    Object.entries(entity).forEach(([key, value]) => {
      if (value === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete (entity as any)[key];
      } else if (value instanceof Date) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (entity as any)[key] = value.toISOString();
      } else if (typeofObject<JsonObject>(value, (v) => typeof v === "object")) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (entity as any)[key] = this.transform(value);
      }
    });
    return entity;
  }

  async handleChange(
    entity: Partial<Schedule> & Required<Pick<Schedule, "id">>,
    type: "Schedule",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: Partial<Configuration> & Required<Pick<Configuration, "id">>,
    type: "Configuration",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: Partial<Control> & Required<Pick<Control, "id">>,
    type: "Control",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: Partial<Location> & Required<Pick<Location, "id">>,
    type: "Location",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: Partial<Unit> & Required<Pick<Unit, "id">>,
    type: "Unit",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: Partial<Occupancy> & Required<Pick<Occupancy, "id">>,
    type: "Occupancy",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: Partial<Holiday> & Required<Pick<Holiday, "id">>,
    type: "Holiday",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: Partial<Setpoint> & Required<Pick<Setpoint, "id">>,
    type: "Setpoint",
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void>;
  async handleChange(
    entity: object,
    type: Prisma.ModelName,
    mutation: ChangeMutation,
    user: Express.User | string,
  ): Promise<void> {
    const userId = typeof user === "string" ? user : user.id;
    if (type === "Schedule" && typeofObject<Schedule>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "schedule",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    } else if (type === "Configuration" && typeofObject<Configuration>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "configuration",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    } else if (type === "Control" && typeofObject<Control>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "control",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    } else if (type === "Location" && typeofObject<Location>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "location",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    } else if (type === "Unit" && typeofObject<Unit>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "unit",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    } else if (type === "Occupancy" && typeofObject<Occupancy>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "occupancy",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    } else if (type === "Holiday" && typeofObject<Holiday>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "holiday",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    } else if (type === "Setpoint" && typeofObject<Setpoint>(entity)) {
      await this.prismaService.prisma.change
        .create({
          data: {
            key: entity.id,
            data: this.transform(entity),
            mutation: mutation,
            table: "setpoint",
            userId: userId,
          },
        })
        .then(async (change) => {
          await this.subscriptionService.publish("Change", {
            topic: "Change",
            id: change.id,
            mutation: Mutation.Created,
          });
        });
    }
  }
}
