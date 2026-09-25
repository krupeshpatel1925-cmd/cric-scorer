"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId =
  | "midnight"
  | "daylight"
  | "royal-blue"
  | "gold-champions"
  | "crimson-arena";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  subtitle: string;
  mode: "dark" | "light";
  primaryColor: string;
  accentColor: string;
  bgPreview: string;
}

export const THEMES: ThemeOption[] = [
  {
    id: "midnight",
    name: "Midnight Pitch",
    subtitle: "Pro Obsidian & Emerald",
    mode: "dark",
    primaryColor: "#10b981",
    accentColor: "#059669",
    bgPreview: "#090d16",
  },
  {
    id: "daylight",
    name: "Daylight Stadium",
    subtitle: "Crisp White & Grass Green",
    mode: "light",
    primaryColor: "#059669",
    accentColor: "#10b981",
    bgPreview: "#f8fafc",
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    subtitle: "Sapphire & Electric Cyan",
    mode: "dark",
    primaryColor: "#3b82f6",
    accentColor: "#06b6d4",
    bgPreview: "#060b18",
  },
  {
    id: "gold-champions",
    name: "Gold Champions",
    subtitle: "Trophy Gold & Charcoal",
    mode: "dark",
    primaryColor: "#f59e0b",
    accentColor: "#fbbf24",
    bgPreview: "#0c0c0f",
  },
  {
    id: "crimson-arena",
    name: "Crimson Arena",
    subtitle: "Scarlet Passion & Carbon",
    mode: "dark",
    primaryColor: "#ef4444",
    accentColor: "#f43f5e",
    bgPreview: "#0d0607",
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  isDark: boolean;
  toggleLightDark: () => void;
  currentThemeConfig: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("midnight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("cric_theme") as ThemeId | null;
      if (savedTheme && THEMES.some((t) => t.id === savedTheme)) {
        setThemeState(savedTheme);
        applyTheme(savedTheme);
      } else {
        applyTheme("midnight");
      }
    } catch {
      applyTheme("midnight");
    }
    setMounted(true);
  }, []);

  const applyTheme = (themeId: ThemeId) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", themeId);

    const themeConfig = THEMES.find((t) => t.id === themeId) || THEMES[0];
    if (themeConfig.mode === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }

    // Update browser theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeConfig.primaryColor);
    }
  };

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("cric_theme", newTheme);
    } catch {}
  };

  const toggleLightDark = () => {
    if (theme === "daylight") {
      setTheme("midnight");
    } else {
      setTheme("daylight");
    }
  };

  const currentThemeConfig =
    THEMES.find((t) => t.id === theme) || THEMES[0];
  const isDark = currentThemeConfig.mode === "dark";

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        toggleLightDark,
        currentThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
