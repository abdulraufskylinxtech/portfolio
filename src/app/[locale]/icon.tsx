import { loadContentData } from "@/lib/content-store";
import { getDisplayName } from "@/lib/data";
import { generateInitialsIcon } from "@/lib/favicon-image";
import { getNameInitials } from "@/lib/initials";

export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

type IconProps = {
  params: Promise<{ locale: string }>;
};

export default async function Icon({ params }: IconProps) {
  const { locale } = await params;
  const { site } = await loadContentData();
  const initials = getNameInitials(getDisplayName(site, locale), locale);

  return generateInitialsIcon({ initials, size: 32 });
}
