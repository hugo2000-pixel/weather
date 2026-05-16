import { LucideIcon, Sun, CloudSun, Cloud, CloudFog, CloudRain, CloudDrizzle, CloudLightning, Snowflake, Wind } from "lucide-react";

export type WeatherState = {
  label: string;
  icon: LucideIcon;
  isSevere: boolean;
};

export const WMO_CODES: Record<number, WeatherState> = {
  0: { label: "Clear sky", icon: Sun, isSevere: false },
  1: { label: "Mainly clear", icon: CloudSun, isSevere: false },
  2: { label: "Partly cloudy", icon: CloudSun, isSevere: false },
  3: { label: "Overcast", icon: Cloud, isSevere: false },
  45: { label: "Fog", icon: CloudFog, isSevere: false },
  48: { label: "Depositing rime fog", icon: CloudFog, isSevere: false },
  51: { label: "Light drizzle", icon: CloudDrizzle, isSevere: false },
  53: { label: "Moderate drizzle", icon: CloudDrizzle, isSevere: false },
  55: { label: "Dense drizzle", icon: CloudDrizzle, isSevere: false },
  56: { label: "Light freezing drizzle", icon: CloudDrizzle, isSevere: true },
  57: { label: "Dense freezing drizzle", icon: CloudDrizzle, isSevere: true },
  61: { label: "Slight rain", icon: CloudRain, isSevere: false },
  63: { label: "Moderate rain", icon: CloudRain, isSevere: false },
  65: { label: "Heavy rain", icon: CloudRain, isSevere: true },
  66: { label: "Light freezing rain", icon: CloudRain, isSevere: true },
  67: { label: "Heavy freezing rain", icon: CloudRain, isSevere: true },
  71: { label: "Slight snow fall", icon: Snowflake, isSevere: false },
  73: { label: "Moderate snow fall", icon: Snowflake, isSevere: false },
  75: { label: "Heavy snow fall", icon: Snowflake, isSevere: true },
  77: { label: "Snow grains", icon: Snowflake, isSevere: false },
  80: { label: "Slight rain showers", icon: CloudRain, isSevere: false },
  81: { label: "Moderate rain showers", icon: CloudRain, isSevere: false },
  82: { label: "Violent rain showers", icon: CloudRain, isSevere: true },
  85: { label: "Slight snow showers", icon: Snowflake, isSevere: false },
  86: { label: "Heavy snow showers", icon: Snowflake, isSevere: true },
  95: { label: "Thunderstorm", icon: CloudLightning, isSevere: true },
  96: { label: "Thunderstorm with slight hail", icon: CloudLightning, isSevere: true },
  99: { label: "Thunderstorm with heavy hail", icon: CloudLightning, isSevere: true },
};

export function getWeatherState(code: number): WeatherState {
  return WMO_CODES[code] || { label: "Unknown", icon: Cloud, isSevere: false };
}
