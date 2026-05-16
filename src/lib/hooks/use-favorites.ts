import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GeocodeResult } from '../schemas/weather';

type FavoritesState = {
  favorites: GeocodeResult[];
  addFavorite: (location: GeocodeResult) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
};

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (location) => {
        if (!get().isFavorite(location.id)) {
          set({ favorites: [...get().favorites, location] });
        }
      },
      removeFavorite: (id) =>
        set({ favorites: get().favorites.filter((fav) => fav.id !== id) }),
      isFavorite: (id) => get().favorites.some((fav) => fav.id === id),
    }),
    {
      name: 'weather-app:favorites:v1',
    }
  )
);
