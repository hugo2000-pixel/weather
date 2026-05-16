import { 
  GeocodeResponseSchema, 
  GeocodeResponse, 
  ForecastResponseSchema, 
  ForecastResponse 
} from "../schemas/weather";

const OPEN_METEO_GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1";
const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function searchLocations(query: string): Promise<GeocodeResponse> {
  const url = new URL(`${OPEN_METEO_GEOCODE_URL}/search`);
  url.searchParams.set("name", query);
  url.searchParams.set("count", "10");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch locations: ${res.statusText}`);
  }
  const data = await res.json();
  return GeocodeResponseSchema.parse(data);
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodeResponse> {
  const url = new URL(`${OPEN_METEO_GEOCODE_URL}/reverse`);
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to reverse geocode: ${res.statusText}`);
  }
  const data = await res.json();
  return GeocodeResponseSchema.parse(data);
}

type ForecastParams = {
  lat: number;
  lon: number;
  tempUnit?: "celsius" | "fahrenheit";
  windUnit?: "kmh" | "mph" | "ms";
  precipUnit?: "mm" | "inch";
};

export async function getForecast({ lat, lon, tempUnit = "celsius", windUnit = "kmh", precipUnit = "mm" }: ForecastParams): Promise<ForecastResponse> {
  const url = new URL(OPEN_METEO_FORECAST_URL);
  
  url.searchParams.set("latitude", lat.toString());
  url.searchParams.set("longitude", lon.toString());
  
  // Current
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,uv_index");
  
  // Hourly
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index,relative_humidity_2m");
  
  // Daily
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max");
  
  // Units
  url.searchParams.set("temperature_unit", tempUnit);
  url.searchParams.set("wind_speed_unit", windUnit);
  url.searchParams.set("precipitation_unit", precipUnit);
  
  // Config
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  // Minutely nowcast (best-effort — not all locations support it)
  url.searchParams.set("minutely_15", "precipitation,precipitation_probability,weather_code");
  url.searchParams.set("forecast_minutely_15", "24"); // 6h

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch forecast: ${res.statusText}`);
  }
  const data = await res.json();
  
  return ForecastResponseSchema.parse(data);
}
