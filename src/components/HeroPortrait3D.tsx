import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
};

export function HeroPortrait3D({ src, alt, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative h-[220px] w-[220px] overflow-hidden rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background sm:h-[240px] sm:w-[240px] md:h-[260px] md:w-[260px] lg:h-[300px] lg:w-[300px] xl:h-[340px] xl:w-[340px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-[center_20%] shadow-[0_20px_50px_hsl(var(--primary)/0.3)]"
        />
      </div>
      <div className="mt-2 h-3 w-20 rounded-full bg-primary/25 blur-md lg:h-4 lg:w-24" aria-hidden />
    </div>
  );
}
