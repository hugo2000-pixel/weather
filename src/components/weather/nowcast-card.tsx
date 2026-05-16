"use client";

import { useMemo, useRef, useState } from "react";
import { analyzeNowcast, formatNowcastHeadline, type MinutelyWindow } from "@/lib/features/nowcast/analyze";
import { Card, CardContent } from "@/components/ui/card";
import { CloudRain, Droplets } from "lucide-react";

interface NowcastCardProps {
  minutely: MinutelyWindow[] | null;
  /** Fall back to hourly-derived summary if minutely unavailable */
  hourlyFallback?: string;
}

const CELL_W = 4; // px per cell
const CELL_MAX_H = 32; // max cell height px

function intensityColor(prob: number): string {
  if (prob >= 70) return "#3b82f6"; // blue-500
  if (prob >= 40) return "#93c5fd"; // blue-300
  return "#dbeafe"; // blue-100
}

export function NowcastCard({ minutely, hourlyFallback }: NowcastCardProps) {
  const [tooltip, setTooltip] = useState<{ x: number; mm: number; prob: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const summary = useMemo(
    () => (minutely && minutely.length > 0 ? analyzeNowcast(minutely) : null),
    [minutely]
  );

  const headline = summary ? formatNowcastHeadline(summary) : (hourlyFallback ?? "Minutely data unavailable for this location.");
  const isPulsing = summary?.status === "starting-soon";

  const totalW = 96 * CELL_W;

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-blue-500 shrink-0" aria-hidden />
          <p
            className={`text-sm font-semibold ${isPulsing ? "motion-safe:animate-pulse" : ""}`}
            aria-live="polite"
          >
            {headline}
          </p>
        </div>

        {!minutely || minutely.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            {hourlyFallback
              ? "Using hourly data — minutely not available for this location."
              : "No precipitation data available."}
          </p>
        ) : (
          <>
            {/* SVG timeline */}
            <div className="relative overflow-x-auto" role="img" aria-label="6-hour precipitation timeline">
              <svg
                ref={svgRef}
                width={totalW}
                height={CELL_MAX_H + 20}
                className="block"
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Time labels every 1h (4 cells × 15min = 1h) */}
                {Array.from({ length: 7 }, (_, hi) => (
                  <text
                    key={hi}
                    x={hi * 4 * CELL_W}
                    y={CELL_MAX_H + 14}
                    fontSize={9}
                    fill="currentColor"
                    className="fill-muted-foreground"
                  >
                    {hi === 0 ? "Now" : `+${hi}h`}
                  </text>
                ))}

                {/* Precipitation cells */}
                {minutely.slice(0, 96).map((slot, i) => {
                  const maxMm = 5;
                  const h = Math.max(2, Math.min(CELL_MAX_H, (slot.precipitation / maxMm) * CELL_MAX_H));
                  const x = i * CELL_W;
                  const y = CELL_MAX_H - h;
                  const fill = intensityColor(slot.precipitation_probability);
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={y}
                      width={CELL_W - 0.5}
                      height={h}
                      fill={fill}
                      rx={1}
                      onMouseEnter={() => setTooltip({ x, mm: slot.precipitation, prob: slot.precipitation_probability })}
                      style={{ cursor: "crosshair" }}
                    />
                  );
                })}

                {/* Tooltip overlay */}
                {tooltip && (
                  <g>
                    <rect
                      x={Math.min(tooltip.x + 6, totalW - 100)}
                      y={0}
                      width={96}
                      height={28}
                      rx={4}
                      fill="white"
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    />
                    <text
                      x={Math.min(tooltip.x + 12, totalW - 94)}
                      y={18}
                      fontSize={10}
                      fill="#334155"
                    >
                      {tooltip.mm.toFixed(1)}mm · {tooltip.prob}% chance
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-blue-100" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-blue-300" /> Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block bg-blue-500" /> High
              </span>
              <Droplets className="w-3 h-3 ml-auto" aria-hidden />
              <span>Hover for details</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
