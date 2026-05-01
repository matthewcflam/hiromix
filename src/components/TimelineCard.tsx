"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";
import type { TimelineItem } from "@/types";
import { cn } from "@/lib/utils";

interface TimelineCardProps {
  item: TimelineItem;
}

export default function TimelineCard({ item }: TimelineCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const aspectRatio = {
    portrait: "aspect-[3/4]",
    square: "aspect-square",
    landscape: "aspect-[16/9]",
  }[item.width];

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group relative h-[600px] w-full"
    >
      <div
        className={cn(
          "relative h-full w-full overflow-hidden rounded-sm bg-gray-100 shadow-lg",
          aspectRatio
        )}
      >
        <motion.div
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full w-full relative"
        >
          <Image
            src={item.src}
            alt="Timeline item image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={false}
            loading="lazy"
          />
        </motion.div>

        {/* Metadata overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 20,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute bottom-0 left-0 right-0 p-6 text-white"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold leading-tight">
                {"Timeline item image"}
              </h3>
              {item.description && (
                <p className="mt-1 text-sm opacity-80">{item.description}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-wider">
            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              {item.category}
            </span>
            <span>{formatDate(item.date)}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
