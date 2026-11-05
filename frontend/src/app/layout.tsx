import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Providers, type Locale, type Theme } from "@/components/providers";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/tajawal/400.css";
import "@fontsource/tajawal/500.css";
import "@fontsource/tajawal/700.css";
import "@fontsource/tajawal/800.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "SAYNTRA — Smarter Repairs. Better Business.",
    template: "%s | SAYNTRA",
  },
  description:
    "A connected workspace for repair centers. Customers, devices, repairs, inventory and invoicing in Arabic and English.",
};
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jar, requestHeaders] = await Promise.all([cookies(), headers()]);
  const savedLanguage = jar.get("sayntra-language")?.value;
  const language: Locale =
    savedLanguage === "ar" || savedLanguage === "en"
      ? savedLanguage
      : requestHeaders.get("accept-language")?.startsWith("ar")
        ? "ar"
        : "en";
  const savedTheme = jar.get("sayntra-theme")?.value;
  const theme: Theme =
    savedTheme === "dark" || savedTheme === "light" ? savedTheme : "system";
  return (
    <html
      data-scroll-behavior="smooth"
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      data-theme={theme}
    >
      <body>
        <a className="skip-link" href="#main">
          {language === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
        </a>
        <Providers initialLanguage={language} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
