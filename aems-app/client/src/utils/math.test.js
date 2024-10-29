import { clamp, invlerp, lerp, range } from "./math";

describe("math.clamp()", () => {
  it("should clamp(1,0,5) => 1", () => {
    expect(clamp(1, 0, 5)).toEqual(1);
  });
  it("should clamp(0,0,5) => 0", () => {
    expect(clamp(0, 0, 5)).toEqual(0);
  });
  it("should clamp(5,0,5) => 5", () => {
    expect(clamp(5, 0, 5)).toEqual(5);
  });
  it("should clamp(7,0,5) => 5", () => {
    expect(clamp(7, 0, 5)).toEqual(5);
  });
  it("should clamp(-7,0,5) => 0", () => {
    expect(clamp(-7, 0, 5)).toEqual(0);
  });
  it("should clamp(0,5,5) => 5", () => {
    expect(clamp(0, 5, 5)).toEqual(5);
  });
});

describe("math.invlerp()", () => {
  it("should invlerp(3,10,3) => 0.0", () => {
    expect(invlerp(3, 10, 3)).toEqual(0.0);
  });
  it("should invlerp(3,10,8) => ~0.714", () => {
    expect(invlerp(3, 10, 8)).toEqual(0.7142857142857143);
  });
  it("should invlerp(3,10,10) => 1.0", () => {
    expect(invlerp(3, 10, 10)).toEqual(1.0);
  });
  it("should invlerp(3,10,0) => 0.0", () => {
    expect(invlerp(3, 10, 0)).toEqual(0.0);
  });
  it("should invlerp(3,10,100) => 1.0", () => {
    expect(invlerp(3, 10, 100)).toEqual(1.0);
  });
});

describe("math.lerp()", () => {
  it("should lerp(3,10,0.0) => 3", () => {
    expect(lerp(3, 10, 0.0)).toEqual(3);
  });
  it("should lerp(3,10,~0.714) => 8", () => {
    expect(lerp(3, 10, 0.7142857142857143)).toEqual(8);
  });
  it("should lerp(3,10,1.0) => 10", () => {
    expect(lerp(3, 10, 1.0)).toEqual(10);
  });
  it("should lerp(3,10,1.0) => 10", () => {
    expect(lerp(3, 10, 1.0)).toEqual(10);
  });
});

describe("math.range()", () => {
  it("should range(0,5,0,5,1) => 1", () => {
    expect(range(0, 5, 0, 5, 1)).toEqual(1);
  });
  it("should range(0,5,0,5,0) => 0", () => {
    expect(range(0, 5, 0, 5, 0)).toEqual(0);
  });
  it("should range(0,5,0,5,5) => 5", () => {
    expect(range(0, 5, 0, 5, 5)).toEqual(5);
  });
  it("should range(0,5,0,5,7) => 5", () => {
    expect(range(0, 5, 0, 5, 7)).toEqual(5);
  });
  it("should range(0,5,0,5,-7) => 0", () => {
    expect(range(0, 5, 0, 5, -7)).toEqual(0);
  });
  it("should range(0,5,0,5,5) => 5", () => {
    expect(range(0, 5, 0, 5, 5)).toEqual(5);
  });
  it("should range(0.0,1.0,3,10,0.0) => 3", () => {
    expect(range(0.0, 1.0, 3, 10, 0.0)).toEqual(3);
  });
  it("should range(0.0,1.0,3,10,~0.714) => 8", () => {
    expect(range(0.0, 1.0, 3, 10, 0.7142857142857143)).toEqual(8);
  });
  it("should range(0.0,1.0,3,10,1.0) => 10", () => {
    expect(range(0.0, 1.0, 3, 10, 1.0)).toEqual(10);
  });
  it("should range(0.0,1.0,3,10,1.0) => 10", () => {
    expect(range(0.0, 1.0, 3, 10, 1.0)).toEqual(10);
  });
  it("should range(3,3,0.0,1.0,3) => 1", () => {
    expect(range(3, 3, 0.0, 1.0, 3)).toEqual(1);
  });
});
