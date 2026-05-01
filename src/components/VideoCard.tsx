"use client";

import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useInView } from "react-intersection-observer";
import type { TimelineItem } from "@/types";
import { cn } from "@/lib/utils";
import { Play, Pause } from "lucide-react";

interface VideoCardProps {
  item: TimelineItem;
}

export default function VideoCard({ item }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  useEffect(() => {
    if (!videoRef.current) return;

    if (inView) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, user interaction required
      });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [inView]);

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

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <motion.div
      ref={ref}
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
        {item.videoSrc ? (
          <video
            ref={videoRef}
            src={item.videoSrc}
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
            poster={item.src}
          />
        ) : (
          <div className="h-full w-full relative">
            <Image
              src={item.src}
              alt="Content"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Play/Pause button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            scale: isHovered ? 1 : 0.8,
          }}
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-colors hover:bg-white/30"
        >
          {isPlaying ? (
            <Pause className="h-8 w-8 text-white" fill="white" />
          ) : (
            <Play className="h-8 w-8 text-white" fill="white" />
          )}
        </motion.button>

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
              {item.description && (
                <p className="text-sm opacity-80">{item.description}</p>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-wider">
            <span className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
              {item.category} • Video
            </span>
            <span>{formatDate(item.date)}</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
