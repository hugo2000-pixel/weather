"use client";

import { useMemo, useState } from "react";
import { ACTIVITY_REGISTRY, scoreActivity, scoreColor, type WeatherWindow } from "@/lib/features/should-i/engine";
import { HourlyWeather } from "@/lib/schemas/weather";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";

interface ActivityChipsProps {
  hourly: HourlyWeather;
  locationKey: string;
  forecastTimestamp: string;
}

function toWeatherWindows(hourly: HourlyWeather): WeatherWindow[] {
  return hourly.time.map((t, i) => ({
    hour: t,
    tempC: hourly.temperature_2m[i] ?? 0,
    precipProb: hourly.precipitation_probability[i] ?? 0,
    precipMm: hourly.precipitation[i] ?? 0,
    windKmh: hourly.wind_speed_10m[i] ?? 0,
    uvIndex: hourly.uv_index[i] ?? 0,
    relHumidity: hourly.relative_humidity_2m[i] ?? 0,
    weatherCode: hourly.weather_code[i] ?? 0,
    isDay: new Date(t).getHours() >= 6 && new Date(t).getHours() < 20 ? 1 : 0,
  }));
}

const DOT_LABELS: Record<0 | 1 | 2 | 3, string> = {
  0: "Poor",
  1: "Fair",
  2: "Good",
  3: "Great",
};

export function ActivityChips({ hourly, locationKey, forecastTimestamp }: ActivityChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const windows = useMemo(() => toWeatherWindows(hourly), [hourly]);

  const scores = useMemo(
    () =>
      ACTIVITY_REGISTRY.map((activity) => ({
        activity,
        score: scoreActivity(activity, windows, locationKey, forecastTimestamp),
      })),
    [windows, locationKey, forecastTimestamp]
  );

  const selectedEntry = scores.find((s) => s.activity.id === selected);

  return (
    <>
      {/* Chip row */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        role="list"
        aria-label="Activity suitability"
      >
        {scores.map(({ activity, score }) => {
          const Icon = activity.icon;
          const dotClass = scoreColor(score.value);
          return (
            <button
              key={activity.id}
              role="listitem"
              onClick={() => setSelected(activity.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border bg-card text-card-foreground shrink-0 hover:bg-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring outline-none text-sm font-medium"
              aria-label={`${activity.label}: ${DOT_LABELS[score.value]}`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span>{activity.label}</span>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotClass}`} aria-hidden />
            </button>
          );
        })}
      </div>

      {/* Detail sheet */}
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          {selectedEntry && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <selectedEntry.activity.icon className="w-5 h-5" aria-hidden />
                  {selectedEntry.activity.label}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                {/* Score pill */}
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${scoreColor(selectedEntry.score.value)}`}
                  >
                    {DOT_LABELS[selectedEntry.score.value]}
                  </span>
                  <span className="text-muted-foreground text-sm">Today</span>
                </div>

                {/* Reasons */}
                {selectedEntry.score.reasons.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">Why</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {selectedEntry.score.reasons.slice(0, 2).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Best window */}
                {selectedEntry.score.bestWindow && (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold">Best window</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(selectedEntry.score.bestWindow.start), "HH:mm")}
                      {" – "}
                      {format(new Date(selectedEntry.score.bestWindow.end), "HH:mm")}
                    </p>
                  </div>
                )}

                {/* 7-day sparkline */}
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-semibold">Next 7 days</p>
                  <SevenDaySparkline hourly={hourly} activity={selectedEntry.activity} locationKey={locationKey} forecastTimestamp={forecastTimestamp} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function SevenDaySparkline({
  hourly,
  activity,
  locationKey,
  forecastTimestamp,
}: {
  hourly: HourlyWeather;
  activity: (typeof ACTIVITY_REGISTRY)[number];
  locationKey: string;
  forecastTimestamp: string;
}) {
  const windows = useMemo(() => toWeatherWindows(hourly), [hourly]);

  const days = useMemo(() => {
    const map = new Map<string, WeatherWindow[]>();
    for (const w of windows) {
      const day = w.hour.split("T")[0]!;
      const existing = map.get(day) ?? [];
      existing.push(w);
      map.set(day, existing);
    }
    return Array.from(map.entries()).slice(0, 7);
  }, [windows]);

  const BG: Record<0 | 1 | 2 | 3, string> = {
    0: "bg-red-500",
    1: "bg-amber-400",
    2: "bg-green-500",
    3: "bg-emerald-400",
  };

  return (
    <div className="flex gap-1" role="list" aria-label="7 day activity outlook">
      {days.map(([day, dayWindows]) => {
        const score = scoreActivity(activity, dayWindows, locationKey, `${forecastTimestamp}-${day}`);
        return (
          <div key={day} className="flex flex-col items-center gap-1 flex-1" role="listitem">
            <div
              className={`h-8 w-full rounded ${BG[score.value]}`}
              title={`${format(new Date(day), "EEE")}: ${DOT_LABELS[score.value]}`}
              aria-label={`${format(new Date(day), "EEEE")}: ${DOT_LABELS[score.value]}`}
            />
            <span className="text-[10px] text-muted-foreground">{format(new Date(day), "EEE")}</span>
          </div>
        );
      })}
    </div>
  );
}
