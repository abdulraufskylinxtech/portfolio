export type SunArcPosition = {
  x: number;
  y: number;
  /** 0 = sunrise (east), 0.5 = noon, 1 = sunset (west) */
  progress: number;
  /** 0 at horizon, 1 at zenith */
  elevation: number;
  opacity: number;
  isDaylight: boolean;
};

export type SkyPhase = "day" | "twilight" | "night";

const TWILIGHT_HOURS = 0.75;

function toDecimalHours(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/** Approximate sunrise/sunset in local decimal hours for a given latitude & date. */
export function getSunriseSunset(date: Date, latitude: number): { sunrise: number; sunset: number } {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  const declination =
    23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const latRad = (latitude * Math.PI) / 180;
  const declRad = (declination * Math.PI) / 180;
  const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);
  const clamped = Math.min(1, Math.max(-1, cosHourAngle));
  const hourAngleRad = Math.acos(clamped);
  const daylightHours = (2 * hourAngleRad * 12) / Math.PI;
  const solarNoon = 12;
  return {
    sunrise: solarNoon - daylightHours / 2,
    sunset: solarNoon + daylightHours / 2,
  };
}

export function getSkyPhase(date: Date, latitude: number): SkyPhase {
  const now = toDecimalHours(date);
  const { sunrise, sunset } = getSunriseSunset(date, latitude);

  if (now >= sunrise && now <= sunset) return "day";
  if (
    (now > sunset && now < sunset + TWILIGHT_HOURS) ||
    (now < sunrise && now > sunrise - TWILIGHT_HOURS)
  ) {
    return "twilight";
  }
  return "night";
}

/**
 * Maps real local time to a point on a 180° arc across the top of the hero.
 * East (morning) → top (noon) → west (evening).
 */
export function getSunArcPosition(
  date: Date,
  width: number,
  height: number,
  latitude = 31.48,
): SunArcPosition {
  const now = toDecimalHours(date);
  const { sunrise, sunset } = getSunriseSunset(date, latitude);
  const skyPhase = getSkyPhase(date, latitude);
  const dayLength = sunset - sunrise;

  let progress = 0.5;
  let elevation = 0;
  let opacity = 0;
  let isDaylight = skyPhase === "day";

  if (skyPhase === "day") {
    progress = (now - sunrise) / dayLength;
    opacity = 1;
    elevation = Math.sin(progress * Math.PI);
  } else if (skyPhase === "twilight") {
    if (now > sunset) {
      progress = 1;
      opacity = 1 - (now - sunset) / TWILIGHT_HOURS;
      elevation = 0.06 * opacity;
    } else {
      progress = 0;
      opacity = 1 - (sunrise - now) / TWILIGHT_HOURS;
      elevation = 0.06 * opacity;
    }
  } else {
    progress = now < sunrise ? 0 : 1;
    opacity = 0;
    elevation = 0;
    isDaylight = false;
  }

  // 180° arc: π (east/left) → π/2 (noon/top) → 0 (west/right)
  const angle = Math.PI * (1 - progress);
  const radius = width * 0.52;
  const apexY = height * 0.05;
  const cx = width / 2;
  const cy = apexY + radius;

  let x = cx + radius * Math.cos(angle);
  let y = cy - radius * Math.sin(angle);

  // At horizon (sunrise/sunset), sit on the bottom edge so the disc stays partially visible
  if (elevation < 0.15 && opacity > 0.02) {
    const coreRadius = 18 + elevation * 22;
    const glowExtent = coreRadius * 5.5;
    y = Math.max(y, height - glowExtent * 0.35);
  }

  ({ x, y } = clampCelestialToViewport(x, y, width, height, elevation, opacity));

  return {
    x,
    y,
    progress,
    elevation: elevation || Math.sin(progress * Math.PI),
    opacity,
    isDaylight,
  };
}

/** Keep at least ~30% of the glow visible until opacity fades to zero. */
export function clampCelestialToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  elevation: number,
  opacity: number,
): { x: number; y: number } {
  if (opacity < 0.02 || width <= 0 || height <= 0) return { x, y };

  const coreRadius = 18 + elevation * 22;
  const glowPad = coreRadius * 5.5;
  const minPad = glowPad * 0.3;

  return {
    x: Math.min(width - minPad, Math.max(minPad, x)),
    y: Math.min(height - minPad * 0.5, Math.max(minPad * 0.35, y)),
  };
}

/**
 * Sun arc for light UI theme — real local time by day, decorative midday sun at local night.
 */
export function getSunArcPositionForLightTheme(
  date: Date,
  width: number,
  height: number,
  latitude = 31.48,
): SunArcPosition {
  const skyPhase = getSkyPhase(date, latitude);
  if (skyPhase !== "night") {
    return getSunArcPosition(date, width, height, latitude);
  }

  const radius = width * 0.52;
  const apexY = height * 0.05;
  const cx = width / 2;
  const cy = apexY + radius;
  const progress = 0.42;
  const elevation = 0.72;
  const angle = Math.PI * (1 - progress);
  let x = cx + radius * Math.cos(angle);
  let y = cy - radius * Math.sin(angle);
  ({ x, y } = clampCelestialToViewport(x, y, width, height, elevation, 1));

  return {
    x,
    y,
    progress,
    elevation,
    opacity: 0.92,
    isDaylight: true,
  };
}

export type SunShadow = {
  offsetX: number;
  offsetY: number;
  blur: number;
  opacity: number;
};

/** Shadow falls away from the sun — longer & softer when the sun is low. */
export function getSunShadowForPoint(
  sun: SunArcPosition,
  pointX: number,
  pointY: number,
): SunShadow {
  if (sun.opacity < 0.05) {
    return { offsetX: 0, offsetY: 0, blur: 0, opacity: 0 };
  }

  const dx = pointX - sun.x;
  const dy = pointY - sun.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;

  const length = 5 + (1 - sun.elevation) * 26;
  const blur = 4 + sun.elevation * 8 + length * 0.35;
  const opacity = sun.opacity * (0.22 + (1 - sun.elevation) * 0.28);

  return {
    offsetX: Math.round(nx * length * 10) / 10,
    offsetY: Math.round(ny * length * 10) / 10,
    blur: Math.round(blur * 10) / 10,
    opacity: Math.round(opacity * 100) / 100,
  };
}

export function sunShadowToFilter(
  shadow: SunShadow,
  color = "180, 83, 9",
): string | undefined {
  if (shadow.opacity <= 0) return undefined;
  const { offsetX, offsetY, blur, opacity } = shadow;
  const soft = `${Math.round(offsetX * 0.55)}px ${Math.round(offsetY * 0.55)}px ${Math.round(blur * 1.8)}px rgba(${color}, ${opacity * 0.45})`;
  const main = `${offsetX}px ${offsetY}px ${blur}px rgba(${color}, ${opacity})`;
  return `drop-shadow(${main}) drop-shadow(${soft})`;
}

export function sunShadowToBoxShadow(
  shadow: SunShadow,
  color = "180, 83, 9",
): string | undefined {
  if (shadow.opacity <= 0) return undefined;
  const { offsetX, offsetY, blur, opacity } = shadow;
  return `${offsetX}px ${offsetY}px ${blur}px rgba(${color}, ${opacity}), ${Math.round(offsetX * 0.5)}px ${Math.round(offsetY * 0.5)}px ${Math.round(blur * 1.6)}px rgba(${color}, ${opacity * 0.4})`;
}
