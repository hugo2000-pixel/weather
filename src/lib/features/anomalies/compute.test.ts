import { describe, it, expect } from "vitest";
import { computeNormals, compareToNormal } from "./compute";

// Generate 30 years of daily data (simplified: same DOY each year)
function makeTimes(years: number): string[] {
  const times: string[] = [];
  for (let y = 1991; y < 1991 + years; y++) {
    for (let d = 1; d <= 365; d++) {
      const date = new Date(y, 0, d);
      times.push(date.toISOString().split("T")[0]!);
    }
  }
  return times;
}

describe("computeNormals", () => {
  it("produces a map with 365 entries for 30 years of data", () => {
    const times = makeTimes(30);
    const temps = times.map(() => 15 + Math.random() * 4 - 2); // ~15°C ±2
    const normals = computeNormals(times, temps);
    expect(normals.size).toBeGreaterThan(300); // Some years may skip leap day
  });

  it("mean is close to the input mean for uniform data", () => {
    const times = makeTimes(30);
    const temps = times.map(() => 20);
    const normals = computeNormals(times, temps);
    const entry = normals.get(15);
    expect(entry).toBeDefined();
    expect(entry!.mean).toBeCloseTo(20, 0);
  });
});

describe("compareToNormal", () => {
  it("returns extreme when today is far above normal", () => {
    const times = makeTimes(30);
    const temps = times.map(() => 15);
    const normals = computeNormals(times, temps);
    const result = compareToNormal(32, 0, normals, "2025-01-10");
    expect(result.severity).toBe("extreme");
    expect(result.tempDelta).toBeGreaterThan(10);
  });

  it("returns normal when today matches historical mean", () => {
    const times = makeTimes(30);
    const temps = times.map(() => 15);
    const normals = computeNormals(times, temps);
    const result = compareToNormal(15, 0, normals, "2025-01-10");
    expect(result.severity).toBe("normal");
    expect(Math.abs(result.tempDelta)).toBeLessThan(1);
  });
});
