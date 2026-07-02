import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import { loadContentData } from "@/lib/content-store";
import { loadUiMessages } from "@/lib/ui-messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  let site;
  try {
    const content = await loadContentData();
    site = content.site;
  } catch {
    site = undefined;
  }

  return {
    locale,
    messages: await loadUiMessages(locale, site),
  };
});
