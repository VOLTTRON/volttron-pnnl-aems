
import { CurrentQuery } from "./query.service";
import { SchemaBuilderService } from "../builder.service";
import { PrismaService } from "@/prisma/prisma.service";

const resolvers: Record<string, (query: unknown, root: unknown, args: unknown, ctx: unknown) => unknown> = {};

function makeMockT() {
  return {
    prismaField: jest.fn((opts: any) => opts),
    arg: jest.fn((opts: any) => opts),
  };
}

function makeBuilder(): SchemaBuilderService {
  const mockT = makeMockT();
  return {
    queryField: jest.fn((name: string, cb: (t: unknown) => any) => {
      const opts = cb(mockT);
      resolvers[name] = opts.resolve;
    }),
  } as unknown as SchemaBuilderService;
}

function makePrisma(returnUser: object | null = { id: "u1", email: "a@b.com" }) {
  return {
    prisma: {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(returnUser),
      },
    },
  } as unknown as PrismaService;
}

const userCtx = { user: { id: "u1", authRoles: { user: true } } };
const anonCtx = { user: null };

describe("CurrentQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(resolvers).forEach((k) => delete resolvers[k]);
  });

  describe("readCurrent resolver", () => {
    it("returns null without calling Prisma when user is not authenticated", async () => {
      const prisma = makePrisma();
      new CurrentQuery(makeBuilder(), prisma);

      const resolve = resolvers["readCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, {}, anonCtx);

      expect(result).toBeNull();
      expect(prisma.prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it("calls prisma.user.findUniqueOrThrow with the current user id when authenticated", async () => {
      const user = { id: "u1", email: "a@b.com" };
      const prisma = makePrisma(user);
      new CurrentQuery(makeBuilder(), prisma);

      const resolve = resolvers["readCurrent"] as (q: unknown, r: unknown, a: unknown, c: unknown) => Promise<unknown>;
      const result = await resolve({}, null, {}, userCtx);

      expect(prisma.prisma.user.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" } }),
      );
      expect(result).toEqual(user);
    });
  });
});
