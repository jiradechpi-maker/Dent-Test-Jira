import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, translator, type Locale, type Translator } from "./locale";

/** The saved choice (TH | EN switch); everyone else starts in Thai, the language of the academic office. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getT(): Promise<Translator> {
  return translator(await getLocale());
}
