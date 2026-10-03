/**
 * Two-language UI (Thai / English). Strings live next to the code that uses them as pairs —
 * `t("ชั่วโมงคุมสอบ", "Invigilation hours")` — so a screen can never ship with only one language.
 */

export type Locale = "th" | "en";

export const LOCALES: readonly Locale[] = ["th", "en"];
export const DEFAULT_LOCALE: Locale = "th";
export const LOCALE_COOKIE = "dentops-locale";
/** One year — the choice is a personal preference, not a session setting. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** A piece of text in both languages. */
export interface Bi {
  th: string;
  en: string;
}

export function bi(th: string, en: string): Bi {
  return { th, en };
}

export function isLocale(value: unknown): value is Locale {
  return value === "th" || value === "en";
}

export interface Translator {
  (th: string, en: string): string;
  (text: Bi): string;
  locale: Locale;
}

export function translator(locale: Locale): Translator {
  const t = ((thOrText: string | Bi, en?: string) => {
    if (typeof thOrText === "string") return locale === "en" ? (en ?? thOrText) : thOrText;
    return thOrText[locale];
  }) as Translator;
  t.locale = locale;
  return t;
}

/** BCP 47 tag for Intl APIs. Thai uses the Buddhist calendar like every Thai official date. */
export function intlLocale(locale: Locale): string {
  return locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB";
}
