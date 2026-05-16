"use client";

import { DailyWeather } from "@/lib/schemas/weather";
import { getWeatherState } from "@/lib/constants/wmo-codes";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { CloudRain } from "lucide-react";
import { motion } from "framer-motion";

interface DailyForecastProps {
  daily: DailyWeather;
  onSelectDay: (date: Date) => void;
  selectedDate: Date;
}

export function DailyForecast({ daily, onSelectDay, selectedDate }: DailyForecastProps) {
  // Find absolute min and max for the 7 days to scale the temperature bars
  const minTempAll = Math.min(...daily.temperature_2m_min);
  const maxTempAll = Math.max(...daily.temperature_2m_max);
  const rangeAll = maxTempAll - minTempAll;

  return (
    <div className="flex flex-col gap-3">
      {daily.time.map((time, i) => {
        const date = new Date(time);
        const isSelected = date.toDateString() === selectedDate.toDateString();
        const state = getWeatherState(daily.weather_code[i]);
        const Icon = state.icon;
        
        const minTemp = daily.temperature_2m_min[i];
        const maxTemp = daily.temperature_2m_max[i];
        
        const leftPercent = ((minTemp - minTempAll) / rangeAll) * 100;
        const widthPercent = ((maxTemp - minTemp) / rangeAll) * 100;
        
        const precipProb = daily.precipitation_probability_max[i];

        return (
          <motion.div
            key={time}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelectDay(date)}
            className={`cursor-pointer rounded-xl transition-colors ${isSelected ? "ring-2 ring-primary bg-primary/5" : ""}`}
          >
            <Card className="border-none shadow-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
              <CardContent className="p-3 sm:p-4 flex items-center justify-between gap-4">
                <div className="w-24 font-medium text-sm sm:text-base">
                  {i === 0 ? "Today" : format(date, "EEE")}
                </div>
                
                <div className="flex items-center gap-2 w-16">
                  <Icon className="w-6 h-6 text-primary" />
                  {precipProb > 20 && (
                    <span className="text-xs text-blue-500 font-semibold flex items-center">
                      {precipProb}%
                    </span>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-3">
                  <span className="text-sm font-semibold w-8 text-right opacity-70">
                    {Math.round(minTemp)}°
                  </span>
                  
                  <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute h-full rounded-full bg-gradient-to-r from-blue-400 to-amber-500"
                      style={{
                        left: `${Math.max(0, leftPercent)}%`,
                        width: `${Math.max(10, widthPercent)}%`
                      }}
                    />
                  </div>

                  <span className="text-sm font-semibold w-8">
                    {Math.round(maxTemp)}°
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
