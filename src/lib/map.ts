export type SiteMap = {
  latitude: number;
  longitude: number;
  zoom?: number;
  label?: string;
};

export function getMapEmbedUrl(map: SiteMap): string {
  const zoom = map.zoom ?? 13;
  const delta = 0.04 * (14 / zoom);
  const { latitude: lat, longitude: lng } = map;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
}

export function getMapDirectionsUrl(map: SiteMap): string {
  const query = map.label
    ? encodeURIComponent(map.label)
    : `${map.latitude},${map.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
