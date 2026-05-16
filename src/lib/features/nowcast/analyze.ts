// ---------------------------------------------------------------------------
// Nowcast analysis — pure functions, no side effects
// ---------------------------------------------------------------------------

export type Intensity = "light" | "moderate" | "heavy";

export type NowcastSummary =
  | { status: "dry"; nextRainIn: number | null; nextRainIntensity?: Intensity }
  | { status: "raining"; endsIn: number | null; intensity: Intensity }
  | { status: "starting-soon"; startsIn: number; durationEstimate: number; intensity: Intensity };

export type MinutelyWindow = {
  time: string;
  precipitation: number;
  precipitation_probability: number;
  weather_code: number;
};

const THRESHOLDS = {
  LIGHT_MM: 0.5,
  MODERATE_MM: 2,
  RAIN_PROB_CUTOFF: 30, // % probability to consider "raining"
  STARTING_SOON_MINUTES: 30, // warn if rain starts within this many minutes
} as const;

function getIntensity(mm: number): Intensity {
  if (mm >= THRESHOLDS.MODERATE_MM) return "heavy";
  if (mm >= THRESHOLDS.LIGHT_MM) return "moderate";
  return "light";
}

function isRaining(w: MinutelyWindow): boolean {
  return w.precipitation > 0 || w.precipitation_probability >= THRESHOLDS.RAIN_PROB_CUTOFF;
}

export function analyzeNowcast(minutely: MinutelyWindow[]): NowcastSummary {
  if (minutely.length === 0) {
    return { status: "dry", nextRainIn: null };
  }

  const now = minutely[0];

  // Currently raining?
  if (now && isRaining(now)) {
    // Find when it stops
    const stopIdx = minutely.findIndex((w, i) => i > 0 && !isRaining(w));
    const endsIn = stopIdx === -1 ? null : stopIdx * 15; // 15-min intervals
    const intensity = getIntensity(now.precipitation);
    return { status: "raining", endsIn, intensity };
  }

  // Find when rain starts
  const startIdx = minutely.findIndex((w, i) => i > 0 && isRaining(w));

  if (startIdx === -1) {
    return { status: "dry", nextRainIn: null };
  }

  const startsIn = startIdx * 15;

  // Find how long it lasts
  const afterStart = minutely.slice(startIdx);
  const endRelIdx = afterStart.findIndex((w, i) => i > 0 && !isRaining(w));
  const durationEstimate = endRelIdx === -1 ? (afterStart.length * 15) : endRelIdx * 15;
  const intensity = getIntensity(minutely[startIdx]?.precipitation ?? 0);

  if (startsIn <= THRESHOLDS.STARTING_SOON_MINUTES) {
    return { status: "starting-soon", startsIn, durationEstimate, intensity };
  }

  return {
    status: "dry",
    nextRainIn: startsIn,
    nextRainIntensity: intensity,
  };
}

export function formatNowcastHeadline(summary: NowcastSummary): string {
  switch (summary.status) {
    case "dry":
      if (summary.nextRainIn === null) return "Dry for the next 6 hours.";
      return `Dry. Rain expected in ${summary.nextRainIn} min (${summary.nextRainIntensity ?? "light"}).`;
    case "raining":
      if (summary.endsIn === null) return `Raining now — ${summary.intensity}.`;
      return `Raining now — stops in ~${summary.endsIn} min.`;
    case "starting-soon":
      return `Rain in ${summary.startsIn} min — ${summary.intensity}, ~${summary.durationEstimate} min.`;
  }
}
