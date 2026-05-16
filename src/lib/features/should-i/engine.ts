import {
  PersonStanding, Bike, Flag, PawPrint, UtensilsCrossed,
  Flame, Waves, Wind, Car, Star, Camera, LucideIcon
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WeatherWindow = {
  hour: string;          // ISO timestamp for the start of the hour
  tempC: number;
  precipProb: number;    // 0-100
  precipMm: number;
  windKmh: number;
  uvIndex: number;
  relHumidity: number;
  weatherCode: number;
  isDay: number;         // 0 or 1
};

export type ActivityScore = {
  value: 0 | 1 | 2 | 3; // 0=bad 1=poor 2=good 3=great
  reasons: string[];
  bestWindow?: { start: string; end: string };
};

export type Activity = {
  id: string;
  label: string;
  icon: LucideIcon;
  score: (windows: WeatherWindow[]) => ActivityScore;
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function sliceHourly(windows: WeatherWindow[], fromHour: number, toHour: number): WeatherWindow[] {
  return windows.filter((w) => {
    const h = new Date(w.hour).getHours();
    return h >= fromHour && h < toHour;
  });
}

/** Find the best consecutive 2h+ window that maximises a numeric evaluator */
function bestWindow(
  windows: WeatherWindow[],
  evaluate: (w: WeatherWindow) => number,
  minLength = 2
): { start: string; end: string } | undefined {
  if (windows.length < minLength) return undefined;
  let bestScore = -Infinity;
  let bestStart = 0;
  let bestEnd = 0;
  for (let i = 0; i <= windows.length - minLength; i++) {
    const slice = windows.slice(i, i + minLength);
    const s = slice.reduce((acc, w) => acc + evaluate(w), 0) / minLength;
    if (s > bestScore) {
      bestScore = s;
      bestStart = i;
      bestEnd = i + minLength - 1;
    }
  }
  if (bestScore === -Infinity) return undefined;
  return { start: windows[bestStart]!.hour, end: windows[bestEnd]!.hour };
}

// ---------------------------------------------------------------------------
// Activity Definitions
// ---------------------------------------------------------------------------

const RUN_THRESHOLDS = { tempMin: 8, tempMax: 22, windMax: 25, precipMax: 20, uvMax: 7 } as const;
const CYCLE_THRESHOLDS = { tempMin: 10, tempMax: 28, windMax: 30, precipMax: 15, uvMax: 8 } as const;
const GOLF_THRESHOLDS = { windMax: 20, precipMax: 10, tempMin: 12, tempMax: 30 } as const;
const PICNIC_THRESHOLDS = { tempMin: 16, tempMax: 30, precipMax: 20, windMax: 25 } as const;
const BBQ_THRESHOLDS = { tempMin: 18, precipMax: 10, windMax: 30 } as const;
const BEACH_THRESHOLDS = { tempMin: 22, precipMax: 5, windMax: 25, uvMin: 3 } as const;
const LAUNDRY_THRESHOLDS = { humidMax: 70, windMin: 5, windMax: 25, precipMax: 5 } as const;
const CAR_WASH_THRESHOLDS = { precipMax: 5, windMax: 20 } as const;
const STARGAZE_THRESHOLDS = { cloudCodeMax: 2, humidMax: 85 } as const; // WMO 0=clear,1=mainly clear,2=partly cloudy,3=overcast
const PHOTO_THRESHOLDS = { maxPrecip: 5 } as const;

function scoreFromBools(bools: boolean[]): 0 | 1 | 2 | 3 {
  const passing = bools.filter(Boolean).length;
  const ratio = passing / bools.length;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

const activityRun: Activity = {
  id: "run",
  label: "Run",
  icon: PersonStanding,
  score: (windows) => {
    const day = sliceHourly(windows, 6, 20);
    const reasons: string[] = [];
    const good = day.filter((w) => {
      const ok =
        w.tempC >= RUN_THRESHOLDS.tempMin && w.tempC <= RUN_THRESHOLDS.tempMax &&
        w.windKmh < RUN_THRESHOLDS.windMax && w.precipProb < RUN_THRESHOLDS.precipMax &&
        w.uvIndex < RUN_THRESHOLDS.uvMax;
      return ok;
    });
    const value = scoreFromBools([
      day.some((w) => w.tempC >= RUN_THRESHOLDS.tempMin && w.tempC <= RUN_THRESHOLDS.tempMax),
      day.some((w) => w.windKmh < RUN_THRESHOLDS.windMax),
      day.some((w) => w.precipProb < RUN_THRESHOLDS.precipMax),
    ]);
    if (day.some((w) => w.precipProb >= 50)) reasons.push("High rain probability.");
    if (day.some((w) => w.tempC > 28)) reasons.push("It might be too hot for running.");
    if (day.some((w) => w.windKmh > 30)) reasons.push("Strong winds.");
    if (reasons.length === 0 && value >= 2) reasons.push("Comfortable running conditions.");
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, (w) => -((w.tempC - 14) ** 2)) };
  },
};

const activityCycle: Activity = {
  id: "cycle",
  label: "Cycle",
  icon: Bike,
  score: (windows) => {
    const day = sliceHourly(windows, 6, 20);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.tempC >= CYCLE_THRESHOLDS.tempMin),
      day.some((w) => w.windKmh < CYCLE_THRESHOLDS.windMax),
      day.some((w) => w.precipProb < CYCLE_THRESHOLDS.precipMax),
    ]);
    if (day.some((w) => w.windKmh > 30)) reasons.push("Headwinds could make cycling hard.");
    if (day.some((w) => w.precipProb > 40)) reasons.push("Rain may affect visibility.");
    if (reasons.length === 0 && value >= 2) reasons.push("Good cycling conditions.");
    const good = day.filter((w) => w.windKmh < CYCLE_THRESHOLDS.windMax && w.precipProb < CYCLE_THRESHOLDS.precipMax);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, () => 1) };
  },
};

const activityGolf: Activity = {
  id: "golf",
  label: "Golf",
  icon: Flag,
  score: (windows) => {
    const day = sliceHourly(windows, 7, 19);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.windKmh < GOLF_THRESHOLDS.windMax),
      day.some((w) => w.precipProb < GOLF_THRESHOLDS.precipMax),
      day.some((w) => w.tempC >= GOLF_THRESHOLDS.tempMin && w.tempC <= GOLF_THRESHOLDS.tempMax),
    ]);
    if (day.some((w) => w.windKmh > 20)) reasons.push("Wind could affect your swing.");
    if (day.some((w) => w.precipProb > 20)) reasons.push("Possible rain on the course.");
    if (reasons.length === 0 && value >= 2) reasons.push("Ideal golf weather.");
    const good = day.filter((w) => w.windKmh < GOLF_THRESHOLDS.windMax);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, (w) => -w.windKmh) };
  },
};

const activityHorseRide: Activity = {
  id: "horse-ride",
  label: "Horse Ride",
  icon: PawPrint,
  score: (windows) => {
    const day = sliceHourly(windows, 7, 19);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.tempC >= 10 && w.tempC <= 28),
      day.some((w) => w.precipProb < 20),
      day.some((w) => w.windKmh < 30),
    ]);
    if (day.some((w) => w.precipProb > 30)) reasons.push("Rain may spook horses.");
    if (day.some((w) => w.windKmh > 30)) reasons.push("High winds are stressful for horses.");
    if (reasons.length === 0 && value >= 2) reasons.push("Calm conditions for riding.");
    const good = day.filter((w) => w.precipProb < 20 && w.windKmh < 30);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, () => 1) };
  },
};

const activityPicnic: Activity = {
  id: "picnic",
  label: "Picnic",
  icon: UtensilsCrossed,
  score: (windows) => {
    const day = sliceHourly(windows, 10, 18);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.tempC >= PICNIC_THRESHOLDS.tempMin),
      day.some((w) => w.precipProb < PICNIC_THRESHOLDS.precipMax),
      day.some((w) => w.windKmh < PICNIC_THRESHOLDS.windMax),
    ]);
    if (day.some((w) => w.precipProb > 30)) reasons.push("Pack a waterproof sheet just in case.");
    if (day.some((w) => w.tempC < 15)) reasons.push("It might be a bit cool outside.");
    if (reasons.length === 0 && value >= 2) reasons.push("Perfect picnic weather!");
    const good = day.filter((w) => w.tempC >= PICNIC_THRESHOLDS.tempMin && w.precipProb < PICNIC_THRESHOLDS.precipMax);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, (w) => w.tempC) };
  },
};

const activityBbq: Activity = {
  id: "bbq",
  label: "BBQ",
  icon: Flame,
  score: (windows) => {
    const day = sliceHourly(windows, 12, 21);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.tempC >= BBQ_THRESHOLDS.tempMin),
      day.some((w) => w.precipProb < BBQ_THRESHOLDS.precipMax),
      day.some((w) => w.windKmh < BBQ_THRESHOLDS.windMax),
    ]);
    if (day.some((w) => w.precipProb > 20)) reasons.push("Rain could dampen the BBQ.");
    if (day.some((w) => w.windKmh > 30)) reasons.push("High winds make grilling tricky.");
    if (reasons.length === 0 && value >= 2) reasons.push("Fire up the grill!");
    const good = day.filter((w) => w.tempC >= BBQ_THRESHOLDS.tempMin && w.precipProb < 20);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, (w) => w.tempC) };
  },
};

const activityBeach: Activity = {
  id: "beach",
  label: "Beach",
  icon: Waves,
  score: (windows) => {
    const day = sliceHourly(windows, 10, 19);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.tempC >= BEACH_THRESHOLDS.tempMin),
      day.some((w) => w.precipProb < BEACH_THRESHOLDS.precipMax),
      day.some((w) => w.windKmh < BEACH_THRESHOLDS.windMax),
      day.some((w) => w.uvIndex >= BEACH_THRESHOLDS.uvMin),
    ]);
    if (day.some((w) => w.tempC < 20)) reasons.push("It may be too cool for the beach.");
    if (day.some((w) => w.precipProb > 10)) reasons.push("Some rain expected.");
    if (reasons.length === 0 && value >= 2) reasons.push("Beach day! Don't forget sunscreen.");
    const good = day.filter((w) => w.tempC >= BEACH_THRESHOLDS.tempMin && w.precipProb < 10);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, (w) => w.tempC) };
  },
};

const activityHangLaundry: Activity = {
  id: "hang-laundry",
  label: "Hang Laundry",
  icon: Wind,
  score: (windows) => {
    const day = sliceHourly(windows, 8, 18);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.relHumidity < LAUNDRY_THRESHOLDS.humidMax),
      day.some((w) => w.windKmh >= LAUNDRY_THRESHOLDS.windMin && w.windKmh <= LAUNDRY_THRESHOLDS.windMax),
      day.some((w) => w.precipProb < LAUNDRY_THRESHOLDS.precipMax),
    ]);
    if (day.some((w) => w.relHumidity > 75)) reasons.push("High humidity — clothes will dry slowly.");
    if (day.some((w) => w.precipProb > 10)) reasons.push("Risk of rain.");
    if (reasons.length === 0 && value >= 2) reasons.push("Good drying conditions.");
    const good = day.filter((w) => w.relHumidity < LAUNDRY_THRESHOLDS.humidMax && w.precipProb < LAUNDRY_THRESHOLDS.precipMax);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, (w) => -w.relHumidity) };
  },
};

const activityWashCar: Activity = {
  id: "wash-car",
  label: "Wash Car",
  icon: Car,
  score: (windows) => {
    const day = sliceHourly(windows, 8, 19);
    const reasons: string[] = [];
    const value = scoreFromBools([
      day.some((w) => w.precipProb < CAR_WASH_THRESHOLDS.precipMax),
      day.some((w) => w.windKmh < CAR_WASH_THRESHOLDS.windMax),
      day.some((w) => w.tempC > 5),
    ]);
    if (day.some((w) => w.precipProb > 20)) reasons.push("Rain would undo your hard work.");
    if (day.some((w) => w.windKmh > 20)) reasons.push("Dusty winds after washing.");
    if (reasons.length === 0 && value >= 2) reasons.push("Great day to wash the car.");
    const good = day.filter((w) => w.precipProb < 10);
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(good, () => 1) };
  },
};

const activityStargaze: Activity = {
  id: "stargaze",
  label: "Stargaze",
  icon: Star,
  score: (windows) => {
    const night = sliceHourly(windows, 20, 24).concat(sliceHourly(windows, 0, 5));
    const reasons: string[] = [];
    // Cloud cover approximated from WMO code: 0=clear, 1=mainly clear, 2=partly cloudy, 3+=overcast
    const clearNight = night.filter((w) => w.weatherCode <= STARGAZE_THRESHOLDS.cloudCodeMax);
    const value = scoreFromBools([
      night.length > 0,
      clearNight.length >= 2,
      night.some((w) => w.relHumidity < STARGAZE_THRESHOLDS.humidMax),
    ]);
    if (clearNight.length < 2) reasons.push("Too much cloud cover tonight.");
    if (night.some((w) => w.relHumidity > 85)) reasons.push("High humidity reduces sky clarity.");
    if (reasons.length === 0 && value >= 2) reasons.push("Clear skies — great for stargazing!");
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(clearNight, (w) => -w.relHumidity) };
  },
};

const activityGoldenHour: Activity = {
  id: "photography-golden-hour",
  label: "Golden Hour",
  icon: Camera,
  score: (windows) => {
    // Sunrise golden hour 6-8, sunset 17-19
    const goldenWindows = sliceHourly(windows, 6, 8).concat(sliceHourly(windows, 17, 19));
    const reasons: string[] = [];
    const clear = goldenWindows.filter((w) => w.precipProb < PHOTO_THRESHOLDS.maxPrecip && w.weatherCode <= 2);
    const value = scoreFromBools([
      clear.length >= 2,
      goldenWindows.some((w) => w.isDay === 1),
    ]);
    if (goldenWindows.every((w) => w.precipProb > 20)) reasons.push("Rain or clouds may obscure golden light.");
    if (reasons.length === 0 && value >= 2) reasons.push("Good light for photography.");
    return { value, reasons: reasons.slice(0, 2), bestWindow: bestWindow(clear, (w) => -w.precipProb) };
  },
};

// ---------------------------------------------------------------------------
// Registry (extensible — just add to this array)
// ---------------------------------------------------------------------------

export const ACTIVITY_REGISTRY: Activity[] = [
  activityRun, activityCycle, activityGolf, activityHorseRide, activityPicnic,
  activityBbq, activityBeach, activityHangLaundry, activityWashCar, activityStargaze, activityGoldenHour,
];

// ---------------------------------------------------------------------------
// Memoized scorer (cache keyed by activityId + location + forecastTimestamp)
// ---------------------------------------------------------------------------

const cache = new Map<string, ActivityScore>();

export function scoreActivity(
  activity: Activity,
  windows: WeatherWindow[],
  locationKey: string,
  forecastTimestamp: string
): ActivityScore {
  const key = `${activity.id}::${locationKey}::${forecastTimestamp}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const result = activity.score(windows);
  cache.set(key, result);
  return result;
}

export function scoreColor(value: 0 | 1 | 2 | 3): string {
  const colors: Record<0 | 1 | 2 | 3, string> = {
    0: "bg-red-500",
    1: "bg-amber-400",
    2: "bg-green-500",
    3: "bg-emerald-400",
  };
  return colors[value];
}
