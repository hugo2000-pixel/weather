"use client";

import { useSettings } from "@/lib/hooks/use-settings";
import { CurrentWeather } from "@/lib/schemas/weather";
import { getWeatherState } from "@/lib/constants/wmo-codes";
import { getClothingRecommendation } from "@/lib/utils/clothing";
import { format } from "date-fns";
import { Droplets, Wind, SunDim as UvIcon, ArrowUp, ArrowDown, Sunrise, Sunset, Shirt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface CurrentConditionsProps {
  current: CurrentWeather;
  daily: any;
  locationName: string;
}

export function CurrentConditions({ current, daily, locationName }: CurrentConditionsProps) {
  const { tempUnit, windUnit, precipUnit } = useSettings();
  const state = getWeatherState(current.weather_code);
  const Icon = state.icon;

  const sunrise = daily?.sunrise?.[0] ? format(new Date(daily.sunrise[0]), "HH:mm") : "--:--";
  const sunset = daily?.sunset?.[0] ? format(new Date(daily.sunset[0]), "HH:mm") : "--:--";

  const clothingRec = getClothingRecommendation(current.temperature_2m, daily?.precipitation_probability_max?.[0] || 0, current.uv_index);

  return (
    <Card className={`overflow-hidden relative ${current.is_day ? "bg-gradient-to-br from-blue-500/20 to-cyan-400/10" : "bg-gradient-to-br from-slate-900 to-indigo-950 text-white"}`}>
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <h2 className="text-3xl font-bold tracking-tight">{locationName}</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              {format(new Date(current.time), "EEEE, MMM d, yyyy | HH:mm")}
            </p>
            <div className="flex items-center gap-4 mt-4">
              <Icon className={`w-16 h-16 ${current.is_day ? "text-amber-500" : "text-slate-300"}`} />
              <div className="flex flex-col">
                <span className="text-6xl font-black tracking-tighter">
                  {Math.round(current.temperature_2m)}°
                </span>
                <span className="text-xl font-medium">{state.label}</span>
              </div>
            </div>
            <p className="text-sm opacity-80 mt-1">
              Feels like {Math.round(current.apparent_temperature)}°
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full md:w-auto mt-4 md:mt-0">
            <WeatherMetric icon={Droplets} label="Humidity" value={`${current.relative_humidity_2m}%`} />
            <WeatherMetric 
              icon={Wind} 
              label="Wind" 
              value={`${current.wind_speed_10m} ${windUnit}`} 
              subValue={`Gusts ${current.wind_gusts_10m}`}
            />
            <WeatherMetric icon={ArrowDown} label="Pressure" value={`${current.pressure_msl} hPa`} />
            <WeatherMetric icon={UvIcon} label="UV Index" value={`${current.uv_index}`} />
            <WeatherMetric icon={Sunrise} label="Sunrise" value={sunrise} />
            <WeatherMetric icon={Sunset} label="Sunset" value={sunset} />
          </div>
        </div>

        {/* Clothing Recommendation Banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-primary/10 rounded-xl p-4 flex items-center gap-3 border border-primary/20"
        >
          <Shirt className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold text-sm">How to dress</p>
            <p className="text-sm opacity-90">{clothingRec}</p>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

function WeatherMetric({ icon: Icon, label, value, subValue }: { icon: any, label: string, value: string, subValue?: string }) {
  return (
    <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-xl">
      <Icon className="w-5 h-5 opacity-70" />
      <div className="flex flex-col">
        <span className="text-xs opacity-70 font-medium uppercase tracking-wider">{label}</span>
        <span className="font-semibold">{value}</span>
        {subValue && <span className="text-[10px] opacity-70">{subValue}</span>}
      </div>
    </div>
  );
}
