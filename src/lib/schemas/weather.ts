import { z } from "zod";

// --- Geocoding Schemas ---

export const GeocodeResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  elevation: z.number().optional(),
  feature_code: z.string().optional(),
  country_code: z.string().optional(),
  admin1_id: z.number().optional(),
  timezone: z.string().optional(),
  population: z.number().optional(),
  country_id: z.number().optional(),
  country: z.string().optional(),
  admin1: z.string().optional(),
  admin2: z.string().optional(),
  admin3: z.string().optional(),
});

export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;

export const GeocodeResponseSchema = z.object({
  results: z.array(GeocodeResultSchema).optional(),
  generationtime_ms: z.number().optional(),
});

export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;

// --- Forecast Schemas ---

export const CurrentWeatherSchema = z.object({
  time: z.string(),
  interval: z.number().optional(),
  temperature_2m: z.number(),
  relative_humidity_2m: z.number(),
  apparent_temperature: z.number(),
  is_day: z.number(),
  precipitation: z.number(),
  weather_code: z.number(),
  wind_speed_10m: z.number(),
  wind_direction_10m: z.number(),
  wind_gusts_10m: z.number(),
  pressure_msl: z.number(),
  uv_index: z.number(),
});

export type CurrentWeather = z.infer<typeof CurrentWeatherSchema>;

export const HourlyWeatherSchema = z.object({
  time: z.array(z.string()),
  temperature_2m: z.array(z.number()),
  precipitation_probability: z.array(z.number()),
  precipitation: z.array(z.number()),
  weather_code: z.array(z.number()),
  wind_speed_10m: z.array(z.number()),
  uv_index: z.array(z.number()),
  relative_humidity_2m: z.array(z.number()),
});

export type HourlyWeather = z.infer<typeof HourlyWeatherSchema>;

export const DailyWeatherSchema = z.object({
  time: z.array(z.string()),
  weather_code: z.array(z.number()),
  temperature_2m_max: z.array(z.number()),
  temperature_2m_min: z.array(z.number()),
  sunrise: z.array(z.string()),
  sunset: z.array(z.string()),
  uv_index_max: z.array(z.number()),
  precipitation_sum: z.array(z.number()),
  precipitation_probability_max: z.array(z.number()),
  wind_speed_10m_max: z.array(z.number()),
});

export type DailyWeather = z.infer<typeof DailyWeatherSchema>;

export const Minutely15Schema = z.object({
  time: z.array(z.string()),
  precipitation: z.array(z.number()),
  precipitation_probability: z.array(z.number()),
  weather_code: z.array(z.number()),
});

export type Minutely15 = z.infer<typeof Minutely15Schema>;

export const ForecastResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  elevation: z.number(),
  current_units: z.record(z.string(), z.string()).optional(),
  current: CurrentWeatherSchema,
  hourly_units: z.record(z.string(), z.string()).optional(),
  hourly: HourlyWeatherSchema,
  daily_units: z.record(z.string(), z.string()).optional(),
  daily: DailyWeatherSchema,
  minutely_15: Minutely15Schema.optional(),
});

export type ForecastResponse = z.infer<typeof ForecastResponseSchema>;

// --- Air Quality Schema (Optional) ---
export const AirQualityResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  generationtime_ms: z.number(),
  utc_offset_seconds: z.number(),
  timezone: z.string(),
  timezone_abbreviation: z.string(),
  hourly: z.object({
    time: z.array(z.string()),
    us_aqi: z.array(z.number()),
  }),
});

export type AirQualityResponse = z.infer<typeof AirQualityResponseSchema>;
