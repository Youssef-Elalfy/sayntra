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
/**
 * "production" only once the real launch is approved. Every other stage
 * (local, preview) is labelled on screen and kept out of search engines.
 */
const stage = process.env.NEXT_PUBLIC_DEPLOY_STAGE ?? "local";
// Public stages: the real launch and the portfolio demo may be indexed.
const isProduction = stage === "production" || stage === "demo";

export const metadata: Metadata = {
  title: {
    default: "SAYNTRA — Smarter Repairs. Better Business.",
    template: "%s | SAYNTRA",
  },
  description:
    "A connected workspace for repair centers: customers, devices, repair intake and technicians, in Arabic and English.",
  robots: isProduction ? undefined : { index: false, follow: false },
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
        {stage === "demo" && (
          <p className="preview-banner demo-banner" role="note">
            {language === "ar"
              ? "عرض تجريبي للأعمال: كل البيانات وهمية وتُحفظ في متصفحك فقط."
              : "Portfolio demo: all data is fictional and stays in your browser."}
          </p>
        )}
        {stage === "preview" && (
          <p className="preview-banner" role="note">
            {language === "ar"
              ? "نسخة تجريبية للتطوير: لا تستخدمها لبيانات عملاء حقيقية."
              : "Development preview: do not use for real customer data."}
          </p>
        )}
        <Providers initialLanguage={language} initialTheme={theme}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
