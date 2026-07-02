import { defineRouting } from "next-intl/routing";

import { ROUTING_LOCALE_CODES } from "@/lib/locale-catalog";

export const routing = defineRouting({
  locales: ROUTING_LOCALE_CODES,
  defaultLocale: "en",
  localePrefix: "always",
});
