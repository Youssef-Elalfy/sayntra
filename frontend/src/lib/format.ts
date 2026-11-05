import type { Locale } from "@/components/providers";

/*
 * Locale-aware formatting with Western digits (0-9) by default, including in
 * Arabic: prices, repair references, invoices and identifiers stay readable
 * and copyable. Switch DIGITS to "arab" (or make it a user/organization
 * setting later) to render Eastern Arabic digits instead.
 */
export type DigitSystem = "latn" | "arab";
export const DIGITS: DigitSystem = "latn";

export function localeTag(language: Locale, digits: DigitSystem = DIGITS) {
  return language === "ar" ? `ar-EG-u-nu-${digits}` : `en-EG-u-nu-latn`;
}

export function formatNumber(value: number, language: Locale) {
  return new Intl.NumberFormat(localeTag(language)).format(value);
}

export function formatDate(
  value: string | number | Date,
  language: Locale,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  return new Intl.DateTimeFormat(localeTag(language), options).format(
    new Date(value),
  );
}

const units: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3_600],
  ["minute", 60],
];

/** "5 minutes ago" / "منذ 5 دقائق", falling back to "just now". */
export function formatRelative(
  value: string | number | Date,
  language: Locale,
  now: number = Date.now(),
) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(localeTag(language), {
    numeric: "auto",
  });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "minute");
}
