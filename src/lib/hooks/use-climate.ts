import { useQuery } from "@tanstack/react-query";
import { fetchClimateNormals } from "@/lib/api/climate-client";
import { compareToNormal, type NormalMap } from "@/lib/features/anomalies/compute";

export function useClimateNormals(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ["climate-normals", lat, lon],
    queryFn: () => fetchClimateNormals(lat!, lon!),
    enabled: lat !== null && lon !== null,
    // Very long stale time — data is cached in IndexedDB for 90 days already
    staleTime: 7 * 24 * 60 * 60_000,
    gcTime: 30 * 24 * 60 * 60_000,
    retry: 1,
  });
}

/** Build the 365-day normal band array for the anomaly chart */
export function buildNormalBand(normals: NormalMap): Array<{ doy: number; mean: number; low: number; high: number }> {
  const result: Array<{ doy: number; mean: number; low: number; high: number }> = [];
  for (let doy = 1; doy <= 365; doy++) {
    const n = normals.get(doy);
    if (n) {
      result.push({
        doy,
        mean: parseFloat(n.mean.toFixed(1)),
        low: parseFloat((n.mean - n.stdDev).toFixed(1)),
        high: parseFloat((n.mean + n.stdDev).toFixed(1)),
      });
    }
  }
  return result;
}

export { compareToNormal };
