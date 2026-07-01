type CanvasLoopOptions = {
  fps?: number;
};

/** Throttled canvas loop — pauses off-screen and when tab is hidden. */
export function runCanvasLoop(
  canvas: HTMLCanvasElement,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  options: CanvasLoopOptions = {},
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const minFrameMs = 1000 / (options.fps ?? 30);
  let rafId = 0;
  let lastFrame = 0;
  let paused = false;

  const tick = (time: number) => {
    rafId = 0;
    if (paused || document.hidden) return;

    if (time - lastFrame < minFrameMs) {
      rafId = requestAnimationFrame(tick);
      return;
    }

    lastFrame = time;
    draw(ctx, canvas.offsetWidth, canvas.offsetHeight);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId === 0) {
      lastFrame = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  };

  const stop = () => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const observer = new IntersectionObserver(
    ([entry]) => {
      paused = !entry.isIntersecting;
      if (paused) stop();
      else if (!document.hidden) start();
    },
    { threshold: 0 },
  );
  observer.observe(canvas);

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!paused) start();
  };
  document.addEventListener("visibilitychange", onVisibility);

  start();

  return () => {
    stop();
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

export function canvasDpr(): number {
  return Math.min(window.devicePixelRatio || 1, 1.5);
}
