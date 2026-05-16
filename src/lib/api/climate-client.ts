// Climate API client with IndexedDB caching via idb-keyval
import { get, set } from "idb-keyval";
import { z } from "zod";
import { computeNormals, compareToNormal, type NormalMap } from "@/lib/features/anomalies/compute";

const CACHE_VERSION = "v1";
const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

const ClimateResponseSchema = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_mean: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
  }),
});

type CacheEntry = {
  normals: Array<[number, { mean: number; stdDev: number; min: number; max: number; p5: number; p95: number }]>;
  fetchedAt: number;
};

function roundCoord(n: number): number {
  return Math.round(n * 10) / 10;
}

function cacheKey(lat: number, lon: number): string {
  return `weather-app:climate:${CACHE_VERSION}:${roundCoord(lat)},${roundCoord(lon)}`;
}

function normalMapToArray(map: NormalMap): CacheEntry["normals"] {
  return Array.from(map.entries());
}

function arrayToNormalMap(arr: CacheEntry["normals"]): NormalMap {
  return new Map(arr);
}

export async function fetchClimateNormals(lat: number, lon: number): Promise<NormalMap> {
  const key = cacheKey(lat, lon);

  // Check IndexedDB cache
  const cached = await get<CacheEntry>(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return arrayToNormalMap(cached.normals);
  }

  // Fetch from climate API
  const url = new URL("https://climate-api.open-meteo.com/v1/climate");
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("start_date", "1991-01-01");
  url.searchParams.set("end_date", "2020-12-31");
  url.searchParams.set("daily", "temperature_2m_mean,precipitation_sum");
  url.searchParams.set("models", "EC_Earth3P_HR");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Climate API error: ${res.statusText}`);

  const raw = await res.json() as unknown;
  const parsed = ClimateResponseSchema.parse(raw);

  const normals = computeNormals(
    parsed.daily.time,
    parsed.daily.temperature_2m_mean
  );

  // Save to IndexedDB
  await set(key, { normals: normalMapToArray(normals), fetchedAt: Date.now() } satisfies CacheEntry);

  return normals;
}

export { compareToNormal };
