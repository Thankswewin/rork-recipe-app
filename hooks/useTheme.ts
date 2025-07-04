import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

interface ThemeState {
  isDark: boolean;
  colors: typeof Colors.light;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      colors: Colors.light,
      toggleTheme: () => {
        const { isDark } = get();
        const newIsDark = !isDark;
        set({
          isDark: newIsDark,
          colors: newIsDark ? Colors.dark : Colors.light,
        });
      },
      setTheme: (isDark: boolean) => {
        set({
          isDark,
          colors: isDark ? Colors.dark : Colors.light,
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);