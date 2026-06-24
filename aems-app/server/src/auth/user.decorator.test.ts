import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

let capturedFactory: (data: unknown, ctx: ExecutionContext) => unknown;

jest.mock("@nestjs/common", () => {
  const actual = jest.requireActual("@nestjs/common");
  return {
    ...actual,
    createParamDecorator: jest.fn((factory: (data: unknown, ctx: ExecutionContext) => unknown) => {
      capturedFactory = factory;
      return actual.createParamDecorator(factory);
    }),
  };
});

import { User } from "./user.decorator";

function makeContext(user: Express.User | undefined): ExecutionContext {
  const req = { user } as unknown as Request;
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as unknown as ExecutionContext;
}

describe("User decorator factory", () => {
  it("extracts user from the HTTP request", () => {
    const user = { id: "u1" } as Express.User;
    const result = capturedFactory(undefined, makeContext(user));
    expect(result).toBe(user);
  });

  it("returns undefined when request has no user", () => {
    const result = capturedFactory(undefined, makeContext(undefined));
    expect(result).toBeUndefined();
  });

  it("User is defined (decorator was created)", () => {
    expect(User).toBeDefined();
  });
});
