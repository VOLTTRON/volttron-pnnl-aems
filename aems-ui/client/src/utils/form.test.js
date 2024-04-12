import { validate } from "./form";

describe("form.validate()", () => {
  it("should allow for a valid type", () => {
    expect(validate("email")).toBeTruthy();
  });

  it("should throw exception for an invalid type", () => {
    expect(() => validate("nonsense")).toThrow();
  });
});

describe("form.validate().isValid()", () => {
  it("should validate email", () => {
    expect(validate("email").isValid("john.doe@pnnl.gov")).toBeTruthy();
  });

  it("should invalidate email", () => {
    expect(validate("email").isValid("john.doe@invalid")).toBeFalsy();
  });

  it("should validate name", () => {
    expect(validate("name").isValid("john doe")).toBeTruthy();
  });

  it("should invalidate name", () => {
    expect(validate("name").isValid("j")).toBeFalsy();
  });

  it("should validate password", () => {
    expect(validate("password").isValid("P@ssW0rd")).toBeTruthy();
  });

  it("should invalidate password", () => {
    expect(validate("password").isValid("password")).toBeFalsy();
  });

  it("should validate url", () => {
    expect(validate("url").isValid("http://foo.com")).toBeTruthy();
  });

  it("should invalidate url", () => {
    expect(validate("url").isValid("foo")).toBeFalsy();
  });

  it("should validate ip", () => {
    expect(validate("ip").isValid("127.0.0.1")).toBeTruthy();
  });

  it("should invalidate ip", () => {
    expect(validate("ip").isValid("256.0.0.1")).toBeFalsy();
  });
});

describe("form.validate().getMessage()", () => {
  it("should validate email", () => {
    expect(validate("email").getMessage("john.doe@pnnl.gov")).toBeFalsy();
  });

  it("should invalidate email", () => {
    expect(validate("email").getMessage("john.doe@invalid")).toBeTruthy();
  });

  it("should validate name", () => {
    expect(validate("name").getMessage("john doe")).toBeFalsy();
  });

  it("should invalidate name", () => {
    expect(validate("name").getMessage("j")).toBeTruthy();
  });

  it("should validate password", () => {
    expect(validate("password").getMessage("P@ssW0rd")).toBeFalsy();
  });

  it("should invalidate password", () => {
    expect(validate("password").getMessage("password")).toBeTruthy();
  });

  it("should validate url", () => {
    expect(validate("url").getMessage("http://foo.com")).toBeFalsy();
  });

  it("should invalidate url", () => {
    expect(validate("url").getMessage("foo")).toBeTruthy();
  });

  it("should validate ip", () => {
    expect(validate("ip").getMessage("127.0.0.1")).toBeFalsy();
  });

  it("should invalidate ip", () => {
    expect(validate("ip").getMessage("256.0.0.1")).toBeTruthy();
  });
});
