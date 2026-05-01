"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface LoadingScreenProps {
  durationMs: number;
  pondBackgroundSrc: string;
  loadingGifSrc: string;
  heading?: string;
  onComplete: () => void;
}

const EXIT_DURATION_MS = 420;

interface ProgressStage {
  start: number;
  end: number;
  from: number;
  to: number;
  easing: (t: number) => number;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInQuad = (t: number) => t * t;

const PROGRESS_STAGES: ProgressStage[] = [
  { start: 0, end: 0.12, from: 0, to: 18, easing: easeOutCubic },
  { start: 0.12, end: 0.24, from: 18, to: 26, easing: easeInOutSine },
  { start: 0.24, end: 0.42, from: 26, to: 54, easing: easeOutCubic },
  { start: 0.42, end: 0.56, from: 54, to: 62, easing: easeInOutSine },
  { start: 0.56, end: 0.76, from: 62, to: 85, easing: easeOutCubic },
  { start: 0.76, end: 0.9, from: 85, to: 94, easing: easeInOutSine },
  { start: 0.9, end: 0.98, from: 94, to: 99, easing: easeInQuad },
  { start: 0.98, end: 1, from: 99, to: 100, easing: easeOutCubic },
];

const getStaggeredProgress = (elapsedMs: number, durationMs: number): number => {
  const ratio = Math.min(1, Math.max(0, elapsedMs / durationMs));
  const stage =
    PROGRESS_STAGES.find(({ start, end }) => ratio >= start && ratio <= end) ??
    PROGRESS_STAGES[PROGRESS_STAGES.length - 1];

  const stageSpan = Math.max(0.0001, stage.end - stage.start);
  const localT = Math.min(1, Math.max(0, (ratio - stage.start) / stageSpan));
  const eased = stage.easing(localT);
  const baseProgress = stage.from + (stage.to - stage.from) * eased;

  // Subtle pulse variation to feel less machine-linear while remaining monotonic.
  const pulse = ratio < 0.98 ? Math.sin(elapsedMs / 120) * 0.22 + Math.sin(elapsedMs / 60) * 0.08 : 0;
  return Math.min(100, Math.max(0, baseProgress + pulse));
};

export default function LoadingScreen({
  durationMs,
  loadingGifSrc,
  heading = "Loading",
  onComplete,
}: LoadingScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const safeDurationMs = Math.max(1, durationMs);
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [backgroundFailed, setBackgroundFailed] = useState(false);
  const [gifFailed, setGifFailed] = useState(false);
  const lastProgressRef = useRef(0);

  useEffect(() => {
    let rafId: number | null = null;
    let timeoutId: number | null = null;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const baseProgress = getStaggeredProgress(elapsed, safeDurationMs);
      let nextProgress = Math.round(baseProgress);

      if (elapsed < safeDurationMs) {
        nextProgress = Math.min(99, nextProgress);
      }

      nextProgress = Math.max(lastProgressRef.current, nextProgress);
      lastProgressRef.current = nextProgress;
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        setIsExiting(true);
        timeoutId = window.setTimeout(onComplete, prefersReducedMotion ? 0 : EXIT_DURATION_MS);
        return;
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [onComplete, prefersReducedMotion, safeDurationMs]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : EXIT_DURATION_MS / 1000, ease: "easeInOut" }}
      aria-live="polite"
      aria-label="Website loading screen"
    >
      <div className="absolute inset-0">
        {!backgroundFailed && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            alt=""
            className="h-full w-full object-cover"
            onError={() => setBackgroundFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/30 via-emerald-200/25 to-emerald-300/35" />
        {backgroundFailed && (
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-emerald-200 to-emerald-300" />
        )}
      </div>

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center">
        {!gifFailed ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={loadingGifSrc}
            alt="Loading animation"
            className="h-44 w-44 max-w-[55vw] object-contain sm:h-56 sm:w-56"
            onError={() => setGifFailed(true)}
          />
        ) : (
          <div className="rounded-xl bg-white/70 px-6 py-4 text-sm font-semibold text-gray-700 shadow-sm">
            Add your loading GIF at {loadingGifSrc}
          </div>
        )}

        <div className="mt-7 w-full max-w-xs">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-gray-700">
            {heading}
          </p>
          <p
            className="text-4xl tracking-tight text-gray-900 tabular-nums"
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 700,
            }}
          >
            {progress}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}

