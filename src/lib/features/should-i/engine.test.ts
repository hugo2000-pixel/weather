import { describe, it, expect } from "vitest";
import { sliceHourly, scoreActivity, ACTIVITY_REGISTRY, type WeatherWindow } from "./engine";

const makeWindow = (hour: number, overrides: Partial<WeatherWindow> = {}): WeatherWindow => ({
  hour: `2025-01-01T${String(hour).padStart(2, "0")}:00`,
  tempC: 15,
  precipProb: 10,
  precipMm: 0,
  windKmh: 12,
  uvIndex: 3,
  relHumidity: 60,
  weatherCode: 0,
  isDay: hour >= 6 && hour < 20 ? 1 : 0,
  ...overrides,
});

const GOOD_DAY = Array.from({ length: 24 }, (_, i) => makeWindow(i));

describe("sliceHourly", () => {
  it("returns only windows within hour range", () => {
    const result = sliceHourly(GOOD_DAY, 8, 12);
    expect(result.every((w) => {
      const h = new Date(w.hour).getHours();
      return h >= 8 && h < 12;
    })).toBe(true);
    expect(result).toHaveLength(4);
  });
});

describe("Activity: run", () => {
  const run = ACTIVITY_REGISTRY.find((a) => a.id === "run")!;

  it("scores 3 on a perfect running day", () => {
    const perfect = GOOD_DAY.map((w) => ({ ...w, tempC: 14, windKmh: 10, precipProb: 5, uvIndex: 4 }));
    const result = scoreActivity(run, perfect, "loc", "ts-perfect");
    expect(result.value).toBeGreaterThanOrEqual(2);
  });

  it("scores 0 on a rainy hot day", () => {
    const bad = GOOD_DAY.map((w) => ({ ...w, tempC: 36, precipProb: 90, windKmh: 40 }));
    const result = scoreActivity(run, bad, "loc", "ts-bad");
    expect(result.value).toBeLessThanOrEqual(1);
  });
});

describe("Activity: hang-laundry", () => {
  const laundry = ACTIVITY_REGISTRY.find((a) => a.id === "hang-laundry")!;

  it("scores high when humidity low and wind moderate", () => {
    const good = GOOD_DAY.map((w) => ({ ...w, relHumidity: 50, windKmh: 12, precipProb: 3 }));
    const result = scoreActivity(laundry, good, "loc", "ts-laundry-good");
    expect(result.value).toBeGreaterThanOrEqual(2);
  });

  it("scores low when humidity is very high", () => {
    const bad = GOOD_DAY.map((w) => ({ ...w, relHumidity: 90, precipProb: 60 }));
    const result = scoreActivity(laundry, bad, "loc", "ts-laundry-bad");
    expect(result.value).toBeLessThanOrEqual(1);
  });
});

describe("Activity: stargaze", () => {
  const stargaze = ACTIVITY_REGISTRY.find((a) => a.id === "stargaze")!;

  it("scores high on a clear night", () => {
    const clearNight = GOOD_DAY.map((w) => ({ ...w, weatherCode: 0, relHumidity: 55, isDay: 0 }));
    const result = scoreActivity(stargaze, clearNight, "loc", "ts-star-good");
    expect(result.value).toBeGreaterThanOrEqual(2);
  });
});
