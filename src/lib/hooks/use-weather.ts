import { useQuery } from "@tanstack/react-query";
import { getForecast, searchLocations, reverseGeocode } from "../api/client";

export function useWeather(lat: number | null, lon: number | null, tempUnit: "celsius" | "fahrenheit", windUnit: "kmh" | "mph" | "ms", precipUnit: "mm" | "inch") {
  return useQuery({
    queryKey: ["weather", lat, lon, tempUnit, windUnit, precipUnit],
    queryFn: () => getForecast({ lat: lat!, lon: lon!, tempUnit, windUnit, precipUnit }),
    enabled: lat !== null && lon !== null,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 3,
  });
}

export function useLocationSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchLocations(query),
    enabled: query.length >= 2,
    staleTime: 24 * 60 * 60_000, // 24h
  });
}

export function useReverseGeocode(lat: number | null, lon: number | null) {
  return useQuery({
    queryKey: ["reverse", lat, lon],
    queryFn: () => reverseGeocode(lat!, lon!),
    enabled: lat !== null && lon !== null,
    staleTime: 24 * 60 * 60_000,
  });
}
