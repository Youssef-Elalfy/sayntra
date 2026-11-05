"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { TiltController } from "./tilt";
export type Locale = "ar" | "en";
export type Theme = "light" | "dark" | "system";
interface Preferences {
  language: Locale;
  theme: Theme;
  setLanguage: (l: Locale) => void;
  setTheme: (t: Theme) => void;
  t: (en: string, ar: string) => string;
}
const Context = createContext<Preferences | null>(null);
export function Providers({
  children,
  initialLanguage,
  initialTheme,
}: {
  children: React.ReactNode;
  initialLanguage: Locale;
  initialTheme: Theme;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: true },
        },
      }),
  );
  const [language, updateLanguage] = useState(initialLanguage);
  const [theme, updateTheme] = useState(initialTheme);
  const value = useMemo(
    () => ({
      language,
      theme,
      t: (en: string, ar: string) => (language === "ar" ? ar : en),
      setLanguage(l: Locale) {
        updateLanguage(l);
        document.documentElement.lang = l;
        document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
        document.cookie = `sayntra-language=${l}; Path=/; Max-Age=31536000; SameSite=Lax`;
      },
      setTheme(v: Theme) {
        updateTheme(v);
        const root = document.documentElement;
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          root.classList.add("theme-switching");
          window.setTimeout(() => root.classList.remove("theme-switching"), 420);
        }
        root.dataset.theme = v;
        document.cookie = `sayntra-theme=${v}; Path=/; Max-Age=31536000; SameSite=Lax`;
      },
    }),
    [language, theme],
  );
  return (
    <Context.Provider value={value}>
      <QueryClientProvider client={client}>
        <MotionConfig reducedMotion="user">
          <TiltController />
          {children}
        </MotionConfig>
      </QueryClientProvider>
    </Context.Provider>
  );
}
export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error("Preferences provider is missing");
  return context;
}
