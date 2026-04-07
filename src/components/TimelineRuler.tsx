"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import type { TimelineItem } from "@/types";

interface TimelineRulerProps {
  items: TimelineItem[];
}

export default function TimelineRuler({ items }: TimelineRulerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const rulerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useMotionValue(0);
  const smoothProgress = useSpring(scrollProgress, {
    stiffness: 100,
    damping: 30,
  });

  // Get date range
  const dates = items.map((item) => new Date(item.date)).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  // Generate year ticks
  const years: number[] = [];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }

  useEffect(() => {
    const handleScroll = () => {
      // This would be synced with the actual carousel scroll
      // For now, it's a simplified version
      const scrollX = window.scrollX || 0;
      scrollProgress.set(scrollX);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollProgress]);

  return (
    <div
      ref={rulerRef}
      className="fixed bottom-0 left-0 right-0 z-30 h-24 border-t border-gray-200 bg-white/80 backdrop-blur-sm"
    >
      <div className="relative h-full w-full overflow-hidden">
        {/* Tick marks */}
        <div className="absolute bottom-0 left-0 right-0 flex h-12 items-end justify-between px-8">
          {/* Small ticks for months */}
          <div className="flex h-full w-full items-end justify-between">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="h-2 w-px bg-gray-300"
                style={{ opacity: 0.3 + (i % 5 === 0 ? 0.4 : 0) }}
              />
            ))}
          </div>
        </div>

        {/* Year labels */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 pb-2">
          {years.map((year) => (
            <div key={year} className="relative">
              <div className="absolute bottom-12 h-6 w-px bg-black" />
              <span className="text-sm font-bold tabular-nums">{year}</span>
            </div>
          ))}
        </div>

        {/* Current date indicator */}
        <motion.div
          className="absolute bottom-0 left-1/2 h-32 w-0.5 bg-black"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            originY: 1,
          }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
            {items[activeIndex] && new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(new Date(items[activeIndex].date))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
