"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SearchBar } from "@/components/weather/search-bar";
import { CurrentConditions } from "@/components/weather/current-conditions";
import { HourlyChart } from "@/components/weather/hourly-chart";
import { DailyForecast } from "@/components/weather/daily-forecast";
import { AlertsBanner } from "@/components/weather/alerts-banner";
import { SettingsDrawer } from "@/components/weather/settings-drawer";
import { ActivityChips } from "@/components/weather/activity-chips";
import { NowcastCard } from "@/components/weather/nowcast-card";
import { AiBriefing } from "@/components/weather/ai-briefing";
import { AmbientCanvas } from "@/components/weather/ambient-canvas";
import { useWeather, useReverseGeocode } from "@/lib/hooks/use-weather";
import { useSettings } from "@/lib/hooks/use-settings";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { GeocodeResult } from "@/lib/schemas/weather";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MapPin, Star, StarOff, CloudSun } from "lucide-react";
import { toast } from "sonner";
import { getWeatherState } from "@/lib/constants/wmo-codes";
import { ACTIVITY_REGISTRY, scoreActivity } from "@/lib/features/should-i/engine";
import type { MinutelyWindow } from "@/lib/features/nowcast/analyze";

// Lazy-load map (Leaflet cannot SSR)
const WeatherMap = dynamic(() => import("@/components/weather/weather-map"), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[300px] rounded-xl" />,
});

export default function Home() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodeResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { tempUnit, windUnit, precipUnit } = useSettings();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();

  // Geolocation on first load
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setCoords({ lat: 48.8566, lon: 2.3522 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        setCoords({ lat: 48.8566, lon: 2.3522 });
        toast.info("Location denied — showing Paris.");
      }
    );
  }, []);

  const { data: weather, isLoading, isError } = useWeather(
    coords?.lat ?? null,
    coords?.lon ?? null,
    tempUnit, windUnit, precipUnit
  );

  const { data: reverseGeo } = useReverseGeocode(
    !selectedLocation && coords ? coords.lat : null,
    !selectedLocation && coords ? coords.lon : null
  );

  const locationName = selectedLocation
    ? `${selectedLocation.name}${selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ""}`
    : reverseGeo?.results?.[0]
    ? `${reverseGeo.results[0].name}${reverseGeo.results[0].admin1 ? `, ${reverseGeo.results[0].admin1}` : ""}`
    : "Current Location";

  const locationKey = coords ? `${Math.round(coords.lat * 10)},${Math.round(coords.lon * 10)}` : "";
  const forecastTimestamp = weather ? weather.current.time : "";

  // Build minutely windows for nowcast
  const minutelyWindows: MinutelyWindow[] | null = useMemo(() => {
    const m = weather?.minutely_15;
    if (!m) return null;
    return m.time.map((t, i) => ({
      time: t,
      precipitation: m.precipitation[i] ?? 0,
      precipitation_probability: m.precipitation_probability[i] ?? 0,
      weather_code: m.weather_code[i] ?? 0,
    }));
  }, [weather]);

  // Build briefing context for AI
  const briefingCtx = useMemo(() => {
    if (!weather) return null;
    const state = getWeatherState(weather.current.weather_code);
    // Top 3 activity scores (scored synchronously from already-loaded data)
    const hourlyWindows = weather.hourly.time.map((t, i) => ({
      hour: t,
      tempC: weather.hourly.temperature_2m[i] ?? 0,
      precipProb: weather.hourly.precipitation_probability[i] ?? 0,
      precipMm: weather.hourly.precipitation[i] ?? 0,
      windKmh: weather.hourly.wind_speed_10m[i] ?? 0,
      uvIndex: weather.hourly.uv_index[i] ?? 0,
      relHumidity: weather.hourly.relative_humidity_2m[i] ?? 0,
      weatherCode: weather.hourly.weather_code[i] ?? 0,
      isDay: new Date(t).getHours() >= 6 && new Date(t).getHours() < 20 ? 1 : 0,
    }));
    const topActivities = ACTIVITY_REGISTRY.slice(0, 3).map((a) => ({
      label: a.label,
      score: scoreActivity(a, hourlyWindows, locationKey, forecastTimestamp).value,
    }));
    return {
      location: locationName,
      tempC: weather.current.temperature_2m,
      weatherLabel: state.label,
      feelsLikeC: weather.current.apparent_temperature,
      uvIndex: weather.current.uv_index,
      anomalyNarrative: "Seasonal comparison unavailable.",
      topActivities,
      alerts: [] as string[],
    };
  }, [weather, locationKey, forecastTimestamp, locationName]);

  const handleLocationSelect = (loc: GeocodeResult) => {
    setSelectedLocation(loc);
    setCoords({ lat: loc.latitude, lon: loc.longitude });
    setSelectedDate(new Date());
  };

  const handleMapClick = (lat: number, lon: number) => {
    setSelectedLocation(null);
    setCoords({ lat, lon });
    setSelectedDate(new Date());
  };

  const favId = selectedLocation?.id ?? (coords ? Math.round(coords.lat * 1000 + coords.lon * 1000) : 0);

  const toggleFavorite = () => {
    if (!coords) return;
    if (isFavorite(favId)) {
      removeFavorite(favId);
      toast.success("Removed from favorites");
    } else {
      addFavorite(
        selectedLocation ?? ({
          id: favId, name: locationName,
          latitude: coords.lat, longitude: coords.lon,
        } as GeocodeResult)
      );
      toast.success("Added to favorites");
    }
  };

  // Onboarding / loading state
  if (!coords) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 text-center">
        <CloudSun className="w-20 h-20 text-primary animate-pulse" aria-hidden />
        <h1 className="text-3xl font-bold">Weather App</h1>
        <p className="text-muted-foreground max-w-sm">Requesting your location for an accurate forecast…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pb-20">
      {weather && <AmbientCanvas weatherCode={weather.current.weather_code} isDay={weather.current.is_day === 1} />}
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SearchBar onLocationSelect={handleLocationSelect} />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {favorites.map((fav) => (
            <Button key={fav.id} variant="secondary" size="sm" onClick={() => handleLocationSelect(fav)} className="shrink-0">
              <MapPin className="w-3 h-3 mr-1" aria-hidden />
              {fav.name}
            </Button>
          ))}
          <Button variant="outline" size="icon" onClick={toggleFavorite} aria-label={isFavorite(favId) ? "Remove from favorites" : "Add to favorites"}>
            {isFavorite(favId)
              ? <Star className="w-4 h-4 text-amber-500 fill-amber-500" aria-hidden />
              : <StarOff className="w-4 h-4" aria-hidden />
            }
          </Button>
          <SettingsDrawer />
        </div>
      </header>

      {isError && (
        <div role="alert" className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm">
          Failed to load weather data. Please check your connection.
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / main column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[280px] w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-[300px] w-full rounded-xl" />
            </>
          ) : weather ? (
            <>
              <AlertsBanner current={weather.current} daily={weather.daily} />

              <CurrentConditions
                current={weather.current}
                daily={weather.daily}
                locationName={locationName}
              />

              {/* Nowcast */}
              <NowcastCard minutely={minutelyWindows} />

              {/* AI Briefing */}
              {briefingCtx && <AiBriefing ctx={briefingCtx} />}

              {/* Activity chips */}
              <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col gap-3">
                <h3 className="font-semibold">Should I…?</h3>
                <ActivityChips
                  hourly={weather.hourly}
                  locationKey={locationKey}
                  forecastTimestamp={forecastTimestamp}
                />
              </div>

              <HourlyChart hourly={weather.hourly} selectedDate={selectedDate} />
            </>
          ) : null}
        </div>

        {/* Right / sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-card rounded-xl border p-4 shadow-sm">
            <h3 className="font-semibold mb-4">7-Day Forecast</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : weather ? (
              <DailyForecast daily={weather.daily} onSelectDay={setSelectedDate} selectedDate={selectedDate} />
            ) : null}
          </div>

          <div className="bg-card rounded-xl border p-4 shadow-sm flex flex-col gap-3">
            <h3 className="font-semibold">Map</h3>
            <WeatherMap lat={coords.lat} lon={coords.lon} onLocationSelect={handleMapClick} />
            <p className="text-xs text-center text-muted-foreground">Click the map to change location.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
