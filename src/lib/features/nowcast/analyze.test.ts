import { describe, it, expect } from "vitest";
import { analyzeNowcast, formatNowcastHeadline, type MinutelyWindow } from "./analyze";

const makeSlot = (time: string, mm: number, prob: number): MinutelyWindow => ({
  time,
  precipitation: mm,
  precipitation_probability: prob,
  weather_code: mm > 0 ? 61 : 0,
});

const DRY_SLOTS = Array.from({ length: 24 }, (_, i) =>
  makeSlot(`2025-01-01T${String(i).padStart(2, "0")}:00`, 0, 5)
);

describe("analyzeNowcast", () => {
  it("returns dry when no rain at all", () => {
    const result = analyzeNowcast(DRY_SLOTS);
    expect(result.status).toBe("dry");
    expect((result as any).nextRainIn).toBeNull();
  });

  it("returns raining when first slot has rain", () => {
    const slots = [...DRY_SLOTS];
    slots[0] = makeSlot("2025-01-01T00:00", 1.0, 80);
    const result = analyzeNowcast(slots);
    expect(result.status).toBe("raining");
  });

  it("returns starting-soon when rain begins within 30 min", () => {
    const slots = [...DRY_SLOTS.map((s) => ({ ...s }))];
    slots[1] = makeSlot("2025-01-01T00:15", 0.8, 75);
    slots[2] = makeSlot("2025-01-01T00:30", 0.5, 60);
    const result = analyzeNowcast(slots);
    expect(result.status).toBe("starting-soon");
  });

  it("returns dry with nextRainIn when rain starts after 30 min", () => {
    const slots = [...DRY_SLOTS.map((s) => ({ ...s }))];
    slots[4] = makeSlot("2025-01-01T01:00", 1.2, 80);
    const result = analyzeNowcast(slots);
    expect(result.status).toBe("dry");
    expect((result as any).nextRainIn).toBe(60);
  });
});

describe("formatNowcastHeadline", () => {
  it("formats dry correctly", () => {
    const h = formatNowcastHeadline({ status: "dry", nextRainIn: null });
    expect(h).toBe("Dry for the next 6 hours.");
  });

  it("formats raining correctly", () => {
    const h = formatNowcastHeadline({ status: "raining", endsIn: 15, intensity: "light" });
    expect(h).toContain("stops in ~15 min");
  });
});
