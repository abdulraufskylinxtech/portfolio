import {
  getSunArcPosition,
  getSunArcPositionForLightTheme,
  getSunriseSunset,
} from "@/lib/sun-position";

export type HijriDate = {
  day: number;
  month: number;
  year: number;
  monthLength: number;
  label: string;
};

export type MoonPhaseInfo = {
  /** 0 = new, 0.5 = full, 1 = new (cycle position for drawing) */
  phase: number;
  /** 0–1 lit fraction */
  illumination: number;
  isWaxing: boolean;
  hijri: HijriDate;
};

export type MoonArcPosition = {
  x: number;
  y: number;
  elevation: number;
  opacity: number;
  phase: number;
  illumination: number;
  isWaxing: boolean;
  isNight: boolean;
  hijri: HijriDate;
};

const hijriFormatter = new Intl.DateTimeFormat("en-u-ca-islamic", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const hijriPartsFormatter = new Intl.DateTimeFormat("en-u-ca-islamic", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

function parseHijriParts(date: Date): Pick<HijriDate, "day" | "month" | "year"> {
  const parts = hijriPartsFormatter.formatToParts(date);
  const day = Number(parts.find((p) => p.type === "day")?.value ?? 1);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? 1447);
  return { day, month, year };
}

/** Length of the current Hijri month (29 or 30) from the civil Islamic calendar. */
function getHijriMonthLength(date: Date): number {
  const anchor = parseHijriParts(date);
  let cursor = new Date(date);
  let lastDay = anchor.day;

  for (let i = 0; i < 32; i++) {
    cursor.setDate(cursor.getDate() + 1);
    const next = parseHijriParts(cursor);
    if (next.month !== anchor.month || next.year !== anchor.year) {
      return lastDay;
    }
    lastDay = next.day;
  }

  return 30;
}

export function getHijriDate(date: Date = new Date()): HijriDate {
  const { day, month, year } = parseHijriParts(date);
  const monthLength = getHijriMonthLength(date);
  return {
    day,
    month,
    year,
    monthLength,
    label: hijriFormatter.format(date),
  };
}

/**
 * Moon phase from the Islamic (Hijri) calendar day.
 * Day 1 ≈ new hilal → mid-month full → last days waning crescent.
 */
export function getMoonPhase(date: Date): MoonPhaseInfo {
  const hijri = getHijriDate(date);
  const { day, monthLength } = hijri;
  const fullMoonDay = Math.ceil(monthLength / 2);

  let illumination: number;
  let phase: number;
  let isWaxing: boolean;

  if (day <= fullMoonDay) {
    isWaxing = true;
    const t = fullMoonDay <= 1 ? 1 : (day - 1) / (fullMoonDay - 1);
    illumination = 0.5 * (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))));
    phase = t * 0.5;
  } else {
    isWaxing = false;
    const remaining = monthLength - fullMoonDay;
    const t = remaining <= 0 ? 0 : (monthLength - day) / remaining;
    illumination = 0.5 * (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, t))));
    phase = 0.5 + (1 - t) * 0.5;
  }

  // 1st of Hijri month — very thin hilal
  if (day === 1) {
    illumination = Math.min(illumination, 0.07);
    phase = 0.015;
  } else if (day === 2) {
    illumination = Math.min(illumination, 0.14);
    phase = Math.min(phase, 0.06);
  }

  // Full moon night(s) around mid-month
  if (day === fullMoonDay || (monthLength === 30 && day === fullMoonDay + 1)) {
    illumination = Math.max(illumination, 0.98);
    phase = 0.5;
  }

  return { phase, illumination, isWaxing, hijri };
}

function toDecimalHours(date: Date): number {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

/** Moon follows the same 180° arc, ~12 h opposite the sun, with Hijri lunar phase. */
export function getMoonArcPosition(
  date: Date,
  width: number,
  height: number,
  latitude = 31.48,
  options?: { themeDark?: boolean },
): MoonArcPosition {
  const moonTime = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  let arc = getSunArcPosition(moonTime, width, height, latitude);

  if (options?.themeDark && arc.opacity < 0.25) {
    const fallback = getSunArcPositionForLightTheme(moonTime, width, height, latitude);
    arc = {
      ...arc,
      x: fallback.x,
      y: fallback.y,
      elevation: fallback.elevation,
      opacity: Math.max(arc.opacity, fallback.opacity * 0.85),
    };
  }

  const { phase, illumination, isWaxing, hijri } = getMoonPhase(date);

  const now = toDecimalHours(date);
  const { sunrise, sunset } = getSunriseSunset(date, latitude);
  const isNight = now < sunrise || now > sunset;

  const nightBoost = isNight ? 1 : 0.35;
  const phaseVisibility = 0.4 + illumination * 0.6;
  let opacity = Math.min(1, Math.max(arc.opacity, isNight ? 0.55 : 0) * nightBoost * phaseVisibility);

  if (options?.themeDark) {
    opacity = Math.max(opacity, 0.45 + illumination * 0.4);
  }

  return {
    x: arc.x,
    y: arc.y,
    elevation: arc.elevation,
    opacity,
    phase,
    illumination,
    isWaxing,
    isNight,
    hijri,
  };
}

/** Lightweight canvas moon — lit fraction & wax/wane from Hijri day. */
export function drawMoonDisc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  phase: number,
  illumination: number,
  isWaxing: boolean,
  opacity: number,
) {
  if (opacity < 0.02) return;

  const lit = Math.min(1, Math.max(0, illumination));

  const glow = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 4.5);
  glow.addColorStop(0, `rgba(180, 195, 230, ${opacity * 0.22 * Math.max(lit, 0.15)})`);
  glow.addColorStop(0.5, `rgba(120, 140, 190, ${opacity * 0.08 * Math.max(lit, 0.1)})`);
  glow.addColorStop(1, "rgba(100, 120, 180, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius * 4.5, 0, Math.PI * 2);
  ctx.fill();

  if (lit < 0.04) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(130, 145, 175, ${opacity * 0.3})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    return;
  }

  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(30, 38, 55, ${opacity * 0.95})`;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = `rgba(228, 233, 248, ${opacity})`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  if (lit < 0.995) {
    const carveAmount = 1 - lit;
    const carveOffset = carveAmount * radius * 1.92;
    const carveX = isWaxing ? x + carveOffset : x - carveOffset;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(carveX, y, radius * 0.98, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(160, 175, 210, ${opacity * 0.35})`;
  ctx.lineWidth = 0.75;
  ctx.stroke();

  ctx.restore();
}

export function getMoonShadowColor(): string {
  return "148, 163, 184";
}

export function moonToShadowInput(moon: MoonArcPosition) {
  return {
    x: moon.x,
    y: moon.y,
    elevation: moon.elevation,
    opacity: moon.opacity,
    isDaylight: false,
    progress: 0,
  };
}
