"use client";

import { HourlyWeather } from "@/lib/schemas/weather";
import { useSettings } from "@/lib/hooks/use-settings";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HourlyChartProps {
  hourly: HourlyWeather;
  selectedDate: Date;
}

export function HourlyChart({ hourly, selectedDate }: HourlyChartProps) {
  const { tempUnit } = useSettings();
  
  // Filter for next 24 hours from the selected date or current time if selectedDate is today
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const startIndex = isToday 
    ? hourly.time.findIndex(t => new Date(t) >= new Date()) 
    : hourly.time.findIndex(t => new Date(t).toDateString() === selectedDate.toDateString());

  const data = hourly.time.slice(Math.max(0, startIndex), startIndex + 24).map((time, idx) => {
    const realIdx = startIndex + idx;
    return {
      time: format(new Date(time), "ha"),
      temp: hourly.temperature_2m[realIdx],
      precip: hourly.precipitation_probability[realIdx],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Forecast</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
            <YAxis 
              yAxisId="left" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12 }} 
              domain={['dataMin - 2', 'dataMax + 2']} 
              tickFormatter={(val) => `${Math.round(val)}°`} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              axisLine={false} 
              tickLine={false} 
              tick={false} 
              domain={[0, 100]} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelStyle={{ fontWeight: 'bold', color: '#666' }}
              formatter={(value: number, name: string) => {
                if (name === "temp") return [`${Math.round(value)}°`, "Temperature"];
                return [`${value}%`, "Precipitation"];
              }}
            />
            <Bar yAxisId="right" dataKey="precip" fill="#3b82f6" opacity={0.2} radius={[4, 4, 0, 0]} />
            <Area 
              yAxisId="left" 
              type="monotone" 
              dataKey="temp" 
              stroke="#f59e0b" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorTemp)" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
