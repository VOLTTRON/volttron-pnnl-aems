 
import { PrismaSessionStore } from "./session.service";
import { PrismaService } from "@/prisma/prisma.service";
import { SessionData } from "express-session";

function makePrisma() {
  return {
    prisma: {
      session: {
        findFirst: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    },
  };
}

const cookieMock = { maxAge: 86400000 } as SessionData["cookie"];
const sessionData: SessionData = {
  cookie: cookieMock,
  passport: { user: "user-1" },
};

describe("PrismaSessionStore", () => {
  let store: PrismaSessionStore;
  let prisma: ReturnType<typeof makePrisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = makePrisma();
    store = new PrismaSessionStore(prisma as unknown as PrismaService);
  });

  describe("get()", () => {
    it("returns the session data when the session exists and is not expired", (done) => {
      prisma.prisma.session.findFirst.mockResolvedValue({ id: "sess-1", data: sessionData });
      store.get("sess-1", (err, session) => {
        expect(err).toBeNull();
        expect(session).toEqual(sessionData);
        done();
      });
    });

    it("returns null when no session is found", (done) => {
      prisma.prisma.session.findFirst.mockResolvedValue(null);
      store.get("sess-none", (err, session) => {
        expect(err).toBeNull();
        expect(session).toBeNull();
        done();
      });
    });

    it("returns null when session data is not an object", (done) => {
      prisma.prisma.session.findFirst.mockResolvedValue({ id: "sess-1", data: "invalid-string" });
      store.get("sess-1", (err, session) => {
        expect(err).toBeNull();
        expect(session).toBeNull();
        done();
      });
    });

    it("calls back with error on Prisma failure", (done) => {
      prisma.prisma.session.findFirst.mockRejectedValue(new Error("DB error"));
      store.get("sess-1", (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });
    });
  });

  describe("set()", () => {
    it("upserts the session row with userId from passport", (done) => {
      store.set("sess-1", sessionData, (err) => {
        expect(err).toBeUndefined();
        expect(prisma.prisma.session.upsert).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: "sess-1" } }),
        );
        done();
      });
    });

    it("calls back with error when no userId in session", (done) => {
      const noUser: SessionData = { cookie: cookieMock };
      store.set("sess-1", noUser, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(prisma.prisma.session.upsert).not.toHaveBeenCalled();
        done();
      });
    });

    it("calls back with error on Prisma failure", (done) => {
      prisma.prisma.session.upsert.mockRejectedValue(new Error("DB error"));
      store.set("sess-1", sessionData, (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });
    });
  });

  describe("destroy()", () => {
    it("deletes the session row", (done) => {
      store.destroy("sess-1", (err) => {
        expect(err).toBeUndefined();
        expect(prisma.prisma.session.deleteMany).toHaveBeenCalledWith({ where: { id: "sess-1" } });
        done();
      });
    });

    it("calls back with error on Prisma failure", (done) => {
      prisma.prisma.session.deleteMany.mockRejectedValue(new Error("DB error"));
      store.destroy("sess-1", (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });
    });
  });
});
