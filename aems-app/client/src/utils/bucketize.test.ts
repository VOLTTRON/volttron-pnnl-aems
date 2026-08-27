import { bucketize } from "./bucketize";

describe("bucketize", () => {
  const t0 = 0;
  const at = (offsetMs: number, value: number | null) => ({
    timestamp: new Date(t0 + offsetMs),
    value,
  });

  it("returns empty when the window is degenerate", () => {
    expect(bucketize([], 100, 100, 5)).toEqual([]);
    expect(bucketize([], 100, 50, 5)).toEqual([]);
    expect(bucketize([], 0, 100, 0)).toEqual([]);
  });

  it("groups points into equal-width buckets and reports 5-number summary", () => {
    // Two buckets: [0, 100) with 1..5, [100, 200) with 6..10.
    const points = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v, i) => at(i * 20, v));
    const out = bucketize(points, 0, 200, 2);
    expect(out).toHaveLength(2);
    expect(out[0].midMs).toBe(50);
    expect(out[1].midMs).toBe(150);
    expect(out[0].min).toBe(1);
    expect(out[0].max).toBe(5);
    expect(out[0].median).toBe(3);
    expect(out[1].min).toBe(6);
    expect(out[1].max).toBe(10);
    expect(out[1].median).toBe(8);
    expect(out[0].count).toBe(5);
  });

  it("skips buckets below the minimum sample threshold", () => {
    // Bucket 0 gets 2 samples, bucket 1 gets 5. minSamples=3 hides bucket 0.
    const points = [
      at(0, 1),
      at(10, 2),
      at(120, 6),
      at(130, 7),
      at(140, 8),
      at(150, 9),
      at(160, 10),
    ];
    const out = bucketize(points, 0, 200, 2, 3);
    expect(out).toHaveLength(1);
    expect(out[0].midMs).toBe(150);
    expect(out[0].count).toBe(5);
  });

  it("ignores null and non-finite values but keeps other samples in the bucket", () => {
    const points = [at(0, 1), at(10, null), at(20, NaN), at(30, 3), at(40, 5), at(50, 7)];
    const out = bucketize(points, 0, 100, 1);
    expect(out).toHaveLength(1);
    expect(out[0].count).toBe(4);
    expect(out[0].min).toBe(1);
    expect(out[0].max).toBe(7);
  });

  it("places the right-inclusive endpoint into the final bucket", () => {
    const points = [at(0, 1), at(50, 2), at(100, 3), at(200, 4)]; // t=200 == endMs
    const out = bucketize(points, 0, 200, 2, 1);
    // Bucket 1 should contain both t=100 and t=200; bucket 0 contains t=0, t=50.
    expect(out[1].count).toBe(2);
    expect(out[1].max).toBe(4);
    expect(out[0].count).toBe(2);
  });

  it("computes nearest-rank quartiles on small samples", () => {
    // Sorted values: [10, 20, 30, 40, 50]. q1(0.25) -> ceil(1.25)=2 -> 20.
    // median(0.5) -> ceil(2.5)=3 -> 30. q3(0.75) -> ceil(3.75)=4 -> 40.
    const points = [10, 20, 30, 40, 50].map((v, i) => at(i * 10, v));
    const [b] = bucketize(points, 0, 100, 1);
    expect(b.q1).toBe(20);
    expect(b.median).toBe(30);
    expect(b.q3).toBe(40);
  });

  it("drops out-of-window points silently", () => {
    const points = [at(-10, 999), at(0, 1), at(50, 2), at(100, 3), at(210, 999)];
    const out = bucketize(points, 0, 100, 1, 1);
    expect(out[0].count).toBe(3);
    expect(out[0].max).toBe(3);
  });
});
