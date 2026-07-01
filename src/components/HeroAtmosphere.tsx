"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Starfield } from "@/components/Starfield";
import { Sunlight } from "@/components/Sunlight";
import { cn } from "@/lib/utils";

type HeroAtmosphereProps = {
  className?: string;
};

export function HeroAtmosphere({ className }: HeroAtmosphereProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 isolate [contain:strict] [transform:translateZ(0)]",
        className,
      )}
      aria-hidden
    >
      {!isDark && <Sunlight className="h-full w-full opacity-100 transition-opacity duration-[2000ms]" active />}
      {isDark && (
        <Starfield className="h-full w-full opacity-100 transition-opacity duration-[2000ms]" active themeDark />
      )}
    </div>
  );
}
