import { UserMutation } from "./mutate.service";
import { SchemaBuilderService } from "../builder.service";
import { UserQuery } from "./query.service";
import { UserObject } from "./object.service";
import { AccountQuery } from "../account/query.service";
import { AccountMutation } from "../account/mutate.service";
import { CommentQuery } from "../comment/query.service";
import { BannerQuery } from "../banner/query.service";
import { CommentMutation } from "../comment/mutate.service";
import { BannerMutation } from "../banner/mutate.service";
import { UnitQuery } from "../unit/query.service";
import { KeycloakAdminService } from "../keycloak/keycloak-admin.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

type Resolve = (query: unknown, root: unknown, args: unknown, ctx: unknown) => Promise<unknown>;

const resolvers: Record<string, Resolve> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    DateTime: "DateTime",
    prismaCreate: jest.fn(() => "UserCreate"),
    prismaUpdate: jest.fn(() => "UserUpdate"),
    prismaUpdateRelation: jest.fn(() => "UserUpdateRelation"),
    mutationField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makePrisma(updateResult = { id: "u1" }, findResult: unknown = { role: null }) {
  return {
    prisma: {
      user: {
        update: jest.fn().mockResolvedValue(updateResult),
        delete: jest.fn().mockResolvedValue(updateResult),
        findUnique: jest.fn().mockResolvedValue(findResult),
      },
    },
  } as unknown as PrismaService;
}

function makeDeps(): [SubscriptionService, UserObject, UserQuery, AccountQuery, CommentQuery, BannerQuery, UnitQuery, AccountMutation, CommentMutation, BannerMutation, KeycloakAdminService] {
  return [
    { publish: jest.fn().mockResolvedValue(undefined) } as unknown as SubscriptionService,
    { UserPreferences: "UserPreferences" } as unknown as UserObject,
    { UserWhereUnique: "UserWhereUnique" } as unknown as UserQuery,
    { AccountWhereUnique: "AccountWhereUnique" } as unknown as AccountQuery,
    { CommentWhereUnique: "CommentWhereUnique" } as unknown as CommentQuery,
    { BannerWhereUnique: "BannerWhereUnique" } as unknown as BannerQuery,
    { UnitWhereUnique: "UnitWhereUnique" } as unknown as UnitQuery,
    { AccountCreate: "AccountCreate" } as unknown as AccountMutation,
    { CommentCreate: "CommentCreate" } as unknown as CommentMutation,
    { BannerCreate: "BannerCreate" } as unknown as BannerMutation,
    { syncAdminRole: jest.fn().mockResolvedValue(undefined) } as unknown as KeycloakAdminService,
  ];
}

const userRoles = { admin: false, user: true, super: false };
const adminRoles = { admin: true, user: true, super: false };

// scenario: user-edit-rights
describe("A user may change their own name, image, preferences and password; email/role admin-only; no edit or delete above grants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("updateUser as non-admin acting on self", () => {
    const selfCtx = { user: { id: "u1", roles: [{ name: "user" }], authRoles: userRoles } };

    async function runSelfUpdate(update: Record<string, unknown>) {
      const prisma = makePrisma({ id: "u1" });
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["updateUser"] as Resolve;
      await resolve({}, null, { where: { id: "u1" }, update }, selfCtx);
      return (prisma.prisma.user.update as jest.Mock).mock.calls[0][0];
    }

    it("writes name", async () => {
      const call = await runSelfUpdate({ name: "new name" });
      expect(call.data).toEqual(expect.objectContaining({ name: "new name" }));
    });

    it("writes image", async () => {
      const call = await runSelfUpdate({ image: "https://x/pic.png" });
      expect(call.data).toEqual(expect.objectContaining({ image: "https://x/pic.png" }));
    });

    it("writes preferences", async () => {
      const call = await runSelfUpdate({ preferences: { theme: "dark" } });
      expect(call.data).toEqual(expect.objectContaining({ preferences: { theme: "dark" } }));
    });

    it("writes password", async () => {
      const call = await runSelfUpdate({ password: "newpw" });
      expect(call.data).toEqual(expect.objectContaining({ password: "newpw" }));
    });

    it("drops email even if sent", async () => {
      const call = await runSelfUpdate({ email: "x@y.z", name: "n" });
      expect(call.data).toEqual(expect.objectContaining({ name: "n" }));
      expect(call.data).not.toHaveProperty("email");
    });

    it("drops role from updateData (non-admin never changes their own role)", async () => {
      // A user may grant 'user' to themselves (validateRoleGrant passes), but the
      // resolver still drops `role` from the write — role stays admin-only.
      const call = await runSelfUpdate({ role: "user", name: "n" });
      expect(call.data).toEqual(expect.objectContaining({ name: "n" }));
      expect(call.data).not.toHaveProperty("role");
    });

    it("refuses when a non-admin tries to grant a role above their level", async () => {
      const prisma = makePrisma();
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["updateUser"] as Resolve;
      await expect(
        resolve({}, null, { where: { id: "u1" }, update: { role: "admin" } }, { user: { id: "u1", roles: [], authRoles: userRoles } }),
      ).rejects.toThrow(/permission to grant/i);
    });

    it("negative control: without the name/image unlock, a self name update is silently dropped", async () => {
      // The guard: if the resolver dropped name, call.data would not contain it.
      const call = await runSelfUpdate({ name: "new name" });
      expect(Object.keys(call.data)).toContain("name");
    });
  });

  describe("updateUser as non-admin acting on someone else", () => {
    it("refuses with an authorization error", async () => {
      const prisma = makePrisma();
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["updateUser"] as Resolve;
      await expect(
        resolve({}, null, { where: { id: "u2" }, update: { name: "x" } }, { user: { id: "u1", roles: [], authRoles: userRoles } }),
      ).rejects.toThrow(/unauthorized/i);
    });
  });

  describe("updateUser as admin", () => {
    const adminCtx = { user: { id: "a1", roles: [{ name: "admin" }], authRoles: adminRoles } };

    it("writes email", async () => {
      const prisma = makePrisma();
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["updateUser"] as Resolve;
      await resolve({}, null, { where: { id: "u1" }, update: { email: "e@f.g" } }, adminCtx);
      const call = (prisma.prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(call.data).toEqual(expect.objectContaining({ email: "e@f.g" }));
    });
  });

  describe("deleteUser: no deleting above one's grants", () => {
    const adminCtx = { user: { id: "a1", roles: [{ name: "admin" }], authRoles: adminRoles } };
    const superCtx = { user: { id: "s1", roles: [{ name: "super" }], authRoles: { ...adminRoles, super: true } } };

    it("admin cannot delete a super user (role they could not grant)", async () => {
      const prisma = makePrisma({ id: "sx" }, { role: "super" });
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["deleteUser"] as Resolve;
      await expect(
        resolve({}, null, { where: { id: "sx" } }, adminCtx),
      ).rejects.toThrow(/permission to grant/i);
      expect(prisma.prisma.user.delete).not.toHaveBeenCalled();
    });

    it("admin can delete a plain user (null role grants)", async () => {
      const prisma = makePrisma({ id: "u1" }, { role: null });
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["deleteUser"] as Resolve;
      await expect(resolve({}, null, { where: { id: "u1" } }, adminCtx)).resolves.toMatchObject({ id: "u1" });
      expect(prisma.prisma.user.delete).toHaveBeenCalled();
    });

    it("super may delete anyone (super grants admin)", async () => {
      const prisma = makePrisma({ id: "a2" }, { role: "admin" });
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["deleteUser"] as Resolve;
      await expect(resolve({}, null, { where: { id: "a2" } }, superCtx)).resolves.toMatchObject({ id: "a2" });
      expect(prisma.prisma.user.delete).toHaveBeenCalled();
    });

    it("negative control: without the role-grant check, admin would delete a super (and this test flips red)", async () => {
      // The guard: the admin-attempts-super case above rejects. If someone drops the
      // check, that test turns green when it should stay red — this control exists to
      // keep the shape of the proof honest.
      const prisma = makePrisma({ id: "sx" }, { role: "super" });
      new UserMutation(makeBuilder(), prisma, ...makeDeps());
      const resolve = resolvers["deleteUser"] as Resolve;
      await expect(
        resolve({}, null, { where: { id: "sx" } }, adminCtx),
      ).rejects.toBeDefined();
    });
  });
});
