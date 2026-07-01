"use client";

import { useEffect } from "react";

/**
 * Imperative ring + dot cursor — zero React re-renders on move.
 * Hover states handled via CSS :has() (no DOM traversal per frame).
 */
export function CustomCursor() {
  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine) and (min-width: 768px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let ring: HTMLDivElement | null = null;
    let dot: HTMLDivElement | null = null;

    const disable = () => {
      document.body.classList.remove("ux-cursor-active");
      ring?.remove();
      dot?.remove();
      ring = null;
      dot = null;
    };

    const enable = () => {
      if (ring && dot) return;
      ring = document.createElement("div");
      ring.className = "ux-cursor-ring";
      ring.setAttribute("aria-hidden", "true");

      dot = document.createElement("div");
      dot.className = "ux-cursor-dot";
      dot.setAttribute("aria-hidden", "true");

      document.body.append(ring, dot);
      document.body.classList.add("ux-cursor-active");
    };

    const sync = () => {
      if (finePointer.matches && !reducedMotion.matches) enable();
      else disable();
    };

    const move = (x: number, y: number) => {
      if (!ring || !dot) return;
      const transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      ring.style.transform = transform;
      dot.style.transform = transform;
    };

    const onMove = (e: MouseEvent) => {
      if (!ring || !dot) return;
      move(e.clientX, e.clientY);
    };

    sync();
    window.addEventListener("mousemove", onMove, { passive: true });
    finePointer.addEventListener("change", sync);
    reducedMotion.addEventListener("change", sync);

    return () => {
      window.removeEventListener("mousemove", onMove);
      finePointer.removeEventListener("change", sync);
      reducedMotion.removeEventListener("change", sync);
      disable();
    };
  }, []);

  return null;
}
