"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { MusicTrack } from "@/types";
import { cn } from "@/lib/utils";

interface QueueDropdownProps {
  tracks: MusicTrack[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
  className?: string;
}

export default function QueueDropdown({
  tracks,
  currentTrackIndex,
  onTrackSelect,
  className,
}: QueueDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "win95-ui absolute right-0 top-full z-20 mt-0 w-64 bg-[#c0c0c0] p-[2px] shadow-[2px_2px_0_#000000,inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#808080]",
        className
      )}
    >
      <div className="h-[380px] overflow-hidden bg-[#c0c0c0] p-[2px] shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_#ffffff]">
        {tracks.slice(currentTrackIndex, currentTrackIndex + 5).map((track, index) => (
          <button
            key={track.id}
            onClick={() => onTrackSelect(currentTrackIndex + index)}
            className={`mb-1 flex w-full items-center gap-3 p-4 text-left transition-colors ${
              index === 0
                ? "bg-[#000080] text-white"
                : "bg-[#c0c0c0] text-black hover:bg-[#d6d6d6]"
            }`}
          >
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden border border-[#000000]">
              <Image
                src={track.albumArt}
                alt={track.album || track.title}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-bold ${
                index === 0 ? "text-white" : "text-black"
              }`}>
                {track.title}
              </p>
              <p className={`truncate text-xs ${
                index === 0 ? "text-gray-200" : "text-[#404040]"
              }`}>
                {track.artist}
              </p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
