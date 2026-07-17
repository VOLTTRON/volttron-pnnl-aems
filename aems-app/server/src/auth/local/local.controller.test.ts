import { LocalController } from "./local.controller";
import { Request } from "express";

function makeReq(logInErr: Error | null = null): Request {
  return {
    user: undefined as unknown as Express.User,
    logIn: jest.fn((user: Express.User, cb: (err: Error | null) => void) => cb(logInErr)),
  } as unknown as Request;
}

describe("LocalController.login", () => {
  let controller: LocalController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new LocalController();
  });

  it("calls req.logIn and resolves with user when user is present", async () => {
    const user = { id: "u1" } as Express.User;
    const req = makeReq();
    req.user = user;

    const result = await controller.login(req, user);

    expect(req.logIn).toHaveBeenCalledWith(user, expect.any(Function));
    expect(result).toBe(user);
  });

  it("returns null when user is absent", async () => {
    const req = makeReq();

    const result = await controller.login(req, undefined as unknown as Express.User);

    expect(result).toBeNull();
    expect(req.logIn).not.toHaveBeenCalled();
  });

  it("rejects when req.logIn calls back with an error", async () => {
    const user = { id: "u1" } as Express.User;
    const req = makeReq(new Error("login failed"));
    req.user = user;

    await expect(controller.login(req, user)).rejects.toThrow("login failed");
  });
});
