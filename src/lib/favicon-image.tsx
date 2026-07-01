type IconOptions = {
  initials: string;
  size: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateInitialsIcon({ initials, size }: IconOptions) {
  const fontSize = Math.round(size * (initials.length > 2 ? 0.36 : 0.42));
  const radius = size >= 128 ? 36 : 6;
  const safeInitials = escapeXml(initials);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${safeInitials}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  <text
    x="50%"
    y="50%"
    fill="#ffffff"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="${fontSize}"
    font-weight="700"
    text-anchor="middle"
    dominant-baseline="central"
  >${safeInitials}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
