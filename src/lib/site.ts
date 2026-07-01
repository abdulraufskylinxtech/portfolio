export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/** Builds a wa.me link from E.164 or local format (digits only). */
export function getWhatsAppUrl(phone: string, prefill?: string): string {
  const digits = phone.replace(/\D/g, "");
  const base = `https://wa.me/${digits}`;
  return prefill ? `${base}?text=${encodeURIComponent(prefill)}` : base;
}
