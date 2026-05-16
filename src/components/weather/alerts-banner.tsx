"use client";

import { ALERT_THRESHOLDS } from "@/lib/constants/alerts";
import { DailyWeather, CurrentWeather } from "@/lib/schemas/weather";
import { AlertTriangle, Info, Wind, Sun } from "lucide-react";
import { useState } from "react";

interface AlertsBannerProps {
  current: CurrentWeather;
  daily: DailyWeather;
}

type AlertType = "info" | "warning" | "danger";

interface Alert {
  id: string;
  type: AlertType;
  message: string;
  icon: any;
}

export function AlertsBanner({ current, daily }: AlertsBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts: Alert[] = [];

  if (current.uv_index >= ALERT_THRESHOLDS.UV_INDEX_DANGER) {
    alerts.push({
      id: "uv",
      type: "warning",
      message: `High UV Index (${current.uv_index}). Protect yourself from the sun.`,
      icon: Sun,
    });
  }

  if (current.wind_gusts_10m >= ALERT_THRESHOLDS.WIND_GUSTS_KMH_DANGER) {
    alerts.push({
      id: "wind",
      type: "danger",
      message: `Strong wind gusts detected (${current.wind_gusts_10m} km/h).`,
      icon: Wind,
    });
  }

  const todayPrecip = daily.precipitation_sum[0] || 0;
  if (todayPrecip >= ALERT_THRESHOLDS.PRECIPITATION_DAILY_MM_DANGER) {
    alerts.push({
      id: "precip",
      type: "warning",
      message: `Heavy rain expected today (${todayPrecip}mm).`,
      icon: AlertTriangle,
    });
  }

  const todayMaxTemp = daily.temperature_2m_max[0];
  if (todayMaxTemp >= ALERT_THRESHOLDS.TEMP_MAX_C_DANGER) {
    alerts.push({
      id: "heat",
      type: "danger",
      message: `Extreme heat warning (${todayMaxTemp}°C).`,
      icon: AlertTriangle,
    });
  }

  const todayMinTemp = daily.temperature_2m_min[0];
  if (todayMinTemp <= ALERT_THRESHOLDS.TEMP_MIN_C_DANGER) {
    alerts.push({
      id: "cold",
      type: "danger",
      message: `Extreme cold warning (${todayMinTemp}°C).`,
      icon: AlertTriangle,
    });
  }

  const activeAlerts = alerts.filter(a => !dismissed.has(a.id));

  if (activeAlerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      {activeAlerts.map(alert => {
        const Icon = alert.icon;
        const isDanger = alert.type === "danger";
        return (
          <div 
            key={alert.id}
            className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border ${isDanger ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'}`}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <p className="font-medium text-sm">{alert.message}</p>
            </div>
            <button 
              onClick={() => setDismissed(prev => new Set(prev).add(alert.id))}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
            >
              <span className="sr-only">Dismiss</span>
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
