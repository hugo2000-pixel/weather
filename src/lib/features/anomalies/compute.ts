// ---------------------------------------------------------------------------
// Climate anomaly computation — pure functions, no side effects
// ---------------------------------------------------------------------------

export type DayOfYear = number; // 1–365

export type NormalStats = {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  p5: number;  // 5th percentile
  p95: number; // 95th percentile
};

export type NormalMap = Map<DayOfYear, NormalStats>;

export type AnomalyComparison = {
  tempDelta: number;
  precipDelta: number;
  severity: "normal" | "notable" | "extreme";
  narrative: string;
};

function dayOfYear(dateStr: string): DayOfYear {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((acc, v) => acc + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo] ?? 0;
  return (sorted[lo] ?? 0) + ((sorted[hi] ?? 0) - (sorted[lo] ?? 0)) * (idx - lo);
}

export function computeNormals(
  times: string[],
  tempMeans: number[],
): NormalMap {
  // Group temps by day-of-year
  const byDoy = new Map<DayOfYear, number[]>();
  times.forEach((t, i) => {
    const doy = dayOfYear(t);
    const existing = byDoy.get(doy) ?? [];
    existing.push(tempMeans[i] ?? 0);
    byDoy.set(doy, existing);
  });

  const result: NormalMap = new Map();
  for (const [doy, values] of byDoy.entries()) {
    const sorted = [...values].sort((a, b) => a - b);
    const avg = mean(values);
    result.set(doy, {
      mean: avg,
      stdDev: stdDev(values, avg),
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      p5: percentile(sorted, 5),
      p95: percentile(sorted, 95),
    });
  }
  return result;
}

export function compareToNormal(
  todayTempC: number,
  todayPrecipMm: number,
  normals: NormalMap,
  todayDateStr: string,
): AnomalyComparison {
  const doy = dayOfYear(todayDateStr);
  const normal = normals.get(doy);

  if (!normal) {
    return { tempDelta: 0, precipDelta: 0, severity: "normal", narrative: "No historical data for this date." };
  }

  const tempDelta = todayTempC - normal.mean;
  const precipDelta = todayPrecipMm - normal.mean; // simplified

  // Severity from σ
  const sigmas = normal.stdDev > 0 ? Math.abs(tempDelta) / normal.stdDev : 0;
  const isExtreme = todayTempC <= normal.p5 || todayTempC >= normal.p95;

  let severity: "normal" | "notable" | "extreme";
  if (isExtreme || sigmas >= 2) {
    severity = "extreme";
  } else if (sigmas >= 1) {
    severity = "notable";
  } else {
    severity = "normal";
  }

  const deltaStr = tempDelta >= 0 ? `+${tempDelta.toFixed(1)}°C` : `${tempDelta.toFixed(1)}°C`;
  let narrative: string;
  if (severity === "extreme") {
    narrative = `Today is exceptionally ${tempDelta > 0 ? "warm" : "cold"} — ${deltaStr} vs the 1991–2020 average. This is in the top/bottom 5% of historical records.`;
  } else if (severity === "notable") {
    narrative = `Today is noticeably ${tempDelta > 0 ? "warmer" : "cooler"} than usual — ${deltaStr} vs historical average.`;
  } else {
    narrative = `Temperature is close to the seasonal average (${deltaStr}).`;
  }

  return { tempDelta: parseFloat(tempDelta.toFixed(1)), precipDelta: parseFloat(precipDelta.toFixed(1)), severity, narrative };
}
