import { ABOUT_IMAGE_PUBLIC_PREFIX } from "@/lib/about-images";
import { PROFILE_IMAGE_PUBLIC_PREFIX } from "@/lib/profile-images";

export function isManagedPublicAsset(url: string): boolean {
  const path = url.trim();
  return (
    path.startsWith(PROFILE_IMAGE_PUBLIC_PREFIX) || path.startsWith(ABOUT_IMAGE_PUBLIC_PREFIX)
  );
}

/** Serves GitHub-uploaded images immediately on serverless (no redeploy needed). */
export function resolvePublicAssetUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!trimmed.startsWith("/")) return trimmed;
  if (isManagedPublicAsset(trimmed)) {
    return `/api/public-asset${trimmed}`;
  }
  return trimmed;
}
