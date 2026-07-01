import { getTranslations } from "next-intl/server";

import { generateInitialsIcon } from "@/lib/favicon-image";
import { getNameInitials } from "@/lib/initials";

export const size = { width: 180, height: 180 };
export const contentType = "image/svg+xml";

type AppleIconProps = {
  params: Promise<{ locale: string }>;
};

export default async function AppleIcon({ params }: AppleIconProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  const initials = getNameInitials(t("name"), locale);

  return generateInitialsIcon({ initials, size: 180 });
}
