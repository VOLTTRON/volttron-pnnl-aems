import { KeycloakController } from "./keycloak.controller";
import { Request, Response } from "express";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    user: undefined as unknown as Express.User,
    query: {},
    logIn: jest.fn(),
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  return {
    redirect: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("KeycloakController.login", () => {
  let controller: KeycloakController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new KeycloakController();
  });

  it("calls req.logIn and returns its resolution when user is present", async () => {
    const user = { id: "u1" } as Express.User;
    const req = makeReq({
      logIn: jest.fn().mockImplementation((u: Express.User, cb: (err: Error | null) => void) => cb(null)),
    });
    req.user = user;

    const result = await controller.login(req, user);

    expect(req.logIn).toHaveBeenCalledWith(user, expect.any(Function));
    expect(result).toBeUndefined();
  });

  it("returns undefined when user is absent", async () => {
    const req = makeReq();

    const result = await controller.login(req, undefined as unknown as Express.User);

    expect(req.logIn).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});

describe("KeycloakController.callback", () => {
  let controller: KeycloakController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new KeycloakController();
  });

  it("redirects to req.query.redirect after logIn when user is present and redirect provided", async () => {
    const user = { id: "u1" } as Express.User;
    const req = makeReq({
      query: { redirect: "/dashboard" },
      logIn: jest.fn().mockImplementation((u: Express.User, cb: (err: Error | null) => void) => cb(null)),
    });
    req.user = user;
    const res = makeRes();

    await controller.callback(req, res, user);

    expect(req.logIn).toHaveBeenCalledWith(user, expect.any(Function));
    expect(res.redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects to / when no redirect query param is present", async () => {
    const user = { id: "u1" } as Express.User;
    const req = makeReq({
      query: {},
      logIn: jest.fn().mockImplementation((u: Express.User, cb: (err: Error | null) => void) => cb(null)),
    });
    req.user = user;
    const res = makeRes();

    await controller.callback(req, res, user);

    expect(res.redirect).toHaveBeenCalledWith("/");
  });

  it("returns undefined without calling logIn when user is absent", async () => {
    const req = makeReq();
    const res = makeRes();

    const result = await controller.callback(req, res, undefined as unknown as Express.User);

    expect(req.logIn).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
