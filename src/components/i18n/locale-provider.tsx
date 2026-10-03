"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, translator, type Locale, type Translator } from "@/lib/i18n/locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translator;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = next;
      setLocaleState(next);
      // Server-rendered headings and page titles read the cookie.
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ locale, setLocale, t: translator(locale) }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside <LocaleProvider>");
  return value;
}

export function useLocale(): Locale {
  return useLocaleContext().locale;
}

export function useSetLocale(): (locale: Locale) => void {
  return useLocaleContext().setLocale;
}

/** `const t = useT(); t("ภาษาไทย", "English")` */
export function useT(): Translator {
  return useLocaleContext().t;
}

/** For server components that need a single translated phrase inside client-rendered markup. */
export function T({ th, en }: { th: string; en: string }) {
  return <>{useT()(th, en)}</>;
}
