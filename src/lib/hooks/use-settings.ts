import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SettingsState = {
  tempUnit: 'celsius' | 'fahrenheit';
  windUnit: 'kmh' | 'mph' | 'ms';
  precipUnit: 'mm' | 'inch';
  anthropicApiKey: string;
  setTempUnit: (unit: 'celsius' | 'fahrenheit') => void;
  setWindUnit: (unit: 'kmh' | 'mph' | 'ms') => void;
  setPrecipUnit: (unit: 'mm' | 'inch') => void;
  setAnthropicApiKey: (key: string) => void;
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      tempUnit: 'celsius',
      windUnit: 'kmh',
      precipUnit: 'mm',
      anthropicApiKey: '',
      setTempUnit: (unit) => set({ tempUnit: unit }),
      setWindUnit: (unit) => set({ windUnit: unit }),
      setPrecipUnit: (unit) => set({ precipUnit: unit }),
      setAnthropicApiKey: (key) => set({ anthropicApiKey: key }),
    }),
    {
      name: 'weather-app:settings:v1',
    }
  )
);
