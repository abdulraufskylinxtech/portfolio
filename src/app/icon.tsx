import { generateInitialsIcon } from "@/lib/favicon-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/svg+xml";

export default function Icon() {
  return generateInitialsIcon({ initials: "SL", size: 32 });
}
