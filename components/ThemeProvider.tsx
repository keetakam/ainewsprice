"use client";

import { createContext, useContext, useEffect, useState } from "react";

const themes = {
  purple: { accent: "#6c63ff", accentHover: "#5a52e0" },
  blue:   { accent: "#3b82f6", accentHover: "#2563eb" },
  green:  { accent: "#10b981", accentHover: "#059669" },
  orange: { accent: "#f97316", accentHover: "#ea6e0d" },
  pink:   { accent: "#ec4899", accentHover: "#db2777" },
  red:    { accent: "#ef4444", accentHover: "#dc2626" },
} as const;

export type ThemeName = keyof typeof themes;

const ThemeContext = createContext<{
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}>({ theme: "purple", setTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("purple");

  function setTheme(t: ThemeName) {
    setThemeState(t);
    const { accent, accentHover } = themes[t];
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-hover", accentHover);
    localStorage.setItem("theme", t);
  }

  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeName | null;
    if (saved && themes[saved]) setTheme(saved);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export { themes };
