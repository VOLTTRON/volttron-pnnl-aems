 
 
 
 

import { BackupObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";
import { BackupArchiveService } from "@/services/backup/backup-archive.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn((name: string) => name),
    objectRef: jest.fn(() => ({ implement: jest.fn(() => ({})) })),
    DateTime: "DateTime",
    Json: "Json",
  } as unknown as SchemaBuilderService;
}

function makeArchive(): BackupArchiveService {
  return {
    getAvailability: jest.fn(),
    getRunAvailability: jest.fn(),
  } as unknown as BackupArchiveService;
}

describe("BackupObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new BackupObject(builder, makeArchive())).not.toThrow();
  });

  it("registers all enum types", () => {
    const builder = makeBuilder();
    new BackupObject(builder, makeArchive());
    const enumCalls = (builder.enumType as jest.Mock).mock.calls.map((c: any[]) => c[0] as string);
    expect(enumCalls).toEqual(
      expect.arrayContaining([
        "BackupDestinationType",
        "BackupRunStatus",
        "BackupRunTrigger",
        "BackupComponentType",
        "BackupComponentStatus",
        "BackupKeyAlgorithm",
        "BackupArchiveAvailability",
        "BackupPolicyFields",
        "BackupDestinationFields",
        "BackupRunFields",
        "BackupComponentFields",
        "BackupRunDestinationFields",
        "BackupKeyFields",
      ]),
    );
  });

  it("calls builder.prismaObject for all Prisma models", () => {
    const builder = makeBuilder();
    new BackupObject(builder, makeArchive());
    const modelNames = (builder.prismaObject as jest.Mock).mock.calls.map((c: any[]) => c[0] as string);
    expect(modelNames).toEqual(
      expect.arrayContaining([
        "BackupPolicy",
        "BackupDestination",
        "BackupRun",
        "BackupComponent",
        "BackupRunDestination",
        "BackupKey",
      ]),
    );
  });

  it("calls builder.objectRef for all discovery types", () => {
    const builder = makeBuilder();
    new BackupObject(builder, makeArchive());
    const refNames = (builder.objectRef as jest.Mock).mock.calls.map((c: any[]) => c[0] as string);
    expect(refNames).toEqual(
      expect.arrayContaining([
        "BackupDiscoveredService",
        "BackupDiscoveredVolume",
        "BackupDiscoveredPath",
        "BackupDiscoveredEnvFile",
        "BackupDiscovery",
      ]),
    );
  });

  it("assigns all exported properties", () => {
    const builder = makeBuilder();
    const instance = new BackupObject(builder, makeArchive());
    expect(instance.BackupDestinationType).toBeDefined();
    expect(instance.BackupRunStatus).toBeDefined();
    expect(instance.BackupRunTrigger).toBeDefined();
    expect(instance.BackupComponentType).toBeDefined();
    expect(instance.BackupComponentStatus).toBeDefined();
    expect(instance.BackupKeyAlgorithm).toBeDefined();
    expect(instance.BackupArchiveAvailability).toBeDefined();
    expect(instance.BackupPolicyObject).toBeDefined();
    expect(instance.BackupDestinationObject).toBeDefined();
    expect(instance.BackupRunObject).toBeDefined();
    expect(instance.BackupComponentObject).toBeDefined();
    expect(instance.BackupRunDestinationObject).toBeDefined();
    expect(instance.BackupKeyObject).toBeDefined();
    expect(instance.BackupDiscoveredServiceObject).toBeDefined();
    expect(instance.BackupDiscoveredVolumeObject).toBeDefined();
    expect(instance.BackupDiscoveredPathObject).toBeDefined();
    expect(instance.BackupDiscoveredEnvFileObject).toBeDefined();
    expect(instance.BackupDiscoveryObject).toBeDefined();
    expect(instance.BackupPolicyFields).toBeDefined();
    expect(instance.BackupDestinationFields).toBeDefined();
    expect(instance.BackupRunFields).toBeDefined();
    expect(instance.BackupComponentFields).toBeDefined();
    expect(instance.BackupRunDestinationFields).toBeDefined();
    expect(instance.BackupKeyFields).toBeDefined();
  });
});
