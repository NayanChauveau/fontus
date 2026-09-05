import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, resolveLocale } from "@/presentation/i18n/locale";
import { getMessages, type Locale } from "@/presentation/i18n/messages";

export async function requestLocale(): Promise<Locale> {
  const jar = await cookies();
  return resolveLocale(jar.get(LOCALE_COOKIE_NAME)?.value);
}

export async function requestMessages() {
  return getMessages(await requestLocale());
}
