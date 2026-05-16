"use client";

import { useState } from "react";
import { Thermometer } from "lucide-react";
import { type AnomalyComparison } from "@/lib/features/anomalies/compute";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, ReferenceLine } from "recharts";

interface AnomalyBadgeProps {
  comparison: AnomalyComparison | null;
  dailyNormals?: Array<{ doy: number; mean: number; low: number; high: number }>;
  currentDoy?: number;
  currentTemp?: number;
}

function deltaColor(delta: number, severity: AnomalyComparison["severity"]): string {
  if (severity === "extreme") return delta > 0 ? "text-red-500" : "text-blue-500";
  if (severity === "notable") return delta > 0 ? "text-orange-500" : "text-sky-500";
  return "text-muted-foreground";
}

export function AnomalyBadge({ comparison, dailyNormals, currentDoy, currentTemp }: AnomalyBadgeProps) {
  const [open, setOpen] = useState(false);

  if (!comparison) return null;

  const { tempDelta, severity } = comparison;
  const color = deltaColor(tempDelta, severity);
  const sign = tempDelta >= 0 ? "+" : "";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1.5 text-sm font-semibold ${color} hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-ring rounded outline-none`}
        aria-label={`Temperature anomaly: ${sign}${tempDelta}°C vs seasonal normal. Click for details.`}
      >
        <Thermometer className="w-4 h-4" aria-hidden />
        <span>{sign}{tempDelta}°C vs normal</span>
        {severity !== "normal" && (
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${severity === "extreme" ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"}`}>
            {severity}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Temperature vs Seasonal Normal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{comparison.narrative}</p>
          <p className="text-xs text-muted-foreground mt-1">Based on 1991–2020 climate data.</p>

          {dailyNormals && dailyNormals.length > 0 && (
            <div className="mt-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyNormals} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="normalBand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="doy" tick={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "none" }}
                    formatter={(v: number) => [`${v.toFixed(1)}°C`]}
                    labelFormatter={(doy) => `Day ${doy}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="high"
                    stroke="none"
                    fill="url(#normalBand)"
                    name="Normal high"
                  />
                  <Area
                    type="monotone"
                    dataKey="low"
                    stroke="none"
                    fill="white"
                    name="Normal low"
                  />
                  <Area
                    type="monotone"
                    dataKey="mean"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="none"
                    name="Normal mean"
                  />
                  {currentDoy !== undefined && currentTemp !== undefined && (
                    <ReferenceLine
                      x={currentDoy}
                      stroke={tempDelta > 0 ? "#ef4444" : "#3b82f6"}
                      strokeWidth={2}
                      label={{ value: `Today ${sign}${tempDelta}°C`, position: "top", fontSize: 11 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-muted-foreground mt-1">365-day normal band (mean ± 1σ) · 1991–2020</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
