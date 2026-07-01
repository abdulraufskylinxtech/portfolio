"use client";

import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

import { useSiteInfo } from "@/components/providers/content-provider";
import { getMoonArcPosition, getMoonShadowColor, moonToShadowInput } from "@/lib/moon-position";
import {
  getSunArcPositionForLightTheme,
  getSunShadowForPoint,
  sunShadowToBoxShadow,
  sunShadowToFilter,
  type SunShadow,
} from "@/lib/sun-position";

const EMPTY: SunShadow = { offsetX: 0, offsetY: 0, blur: 0, opacity: 0 };

export function useSunShadow(
  sectionRef: React.RefObject<HTMLElement | null>,
  targetRef: React.RefObject<HTMLElement | null>,
  /** Re-run when target remounts (e.g. hero avatar AnimatePresence). */
  refreshKey?: boolean | number | string,
) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [shadow, setShadow] = useState<SunShadow>(EMPTY);
  const [shadowColor, setShadowColor] = useState("180, 83, 9");
  const latitude = useSiteInfo().map?.latitude ?? 31.48;

  const update = useCallback(() => {
    const section = sectionRef.current;
    const target = targetRef.current;

    if (!mounted || !section || !target) {
      return;
    }

    const sectionRect = section.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const pointX = targetRect.left + targetRect.width / 2 - sectionRect.left;
    const pointY = targetRect.top + targetRect.height / 2 - sectionRect.top;

    if (resolvedTheme === "dark") {
      const moon = getMoonArcPosition(new Date(), sectionRect.width, sectionRect.height, latitude, {
        themeDark: true,
      });
      const moonShadow = getSunShadowForPoint(moonToShadowInput(moon), pointX, pointY);
      setShadowColor(getMoonShadowColor());
      setShadow({
        ...moonShadow,
        opacity: moonShadow.opacity * 0.65,
        blur: moonShadow.blur * 1.1,
      });
      return;
    }

    const sun = getSunArcPositionForLightTheme(
      new Date(),
      sectionRect.width,
      sectionRect.height,
      latitude,
    );
    setShadowColor("180, 83, 9");
    setShadow(getSunShadowForPoint(sun, pointX, pointY));
  }, [sectionRef, targetRef, mounted, resolvedTheme, latitude]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    update();

    const interval = window.setInterval(update, 60_000);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });

    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    const section = sectionRef.current;
    const target = targetRef.current;
    if (observer && section) observer.observe(section);
    if (observer && target) observer.observe(target);

    const raf = requestAnimationFrame(update);
    const afterAnim = window.setTimeout(update, 400);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(afterAnim);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, [update, sectionRef, targetRef, refreshKey]);

  return {
    shadow,
    dropShadow: sunShadowToFilter(shadow, shadowColor),
    boxShadow: sunShadowToBoxShadow(shadow, shadowColor),
  };
}
