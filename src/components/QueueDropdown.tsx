"use client";

import { motion } from "framer-motion";
import type { MusicTrack } from "@/types";

interface QueueDropdownProps {
  tracks: MusicTrack[];
  currentTrackIndex: number;
  onTrackSelect: (index: number) => void;
}

export default function QueueDropdown({
  tracks,
  currentTrackIndex,
  onTrackSelect,
}: QueueDropdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute right-0 top-full mt-1 w-64 bg-white/95 backdrop-blur-sm"
    >
      <div className="p-2 max-h-80 overflow-y-auto">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            onClick={() => onTrackSelect(index)}
            className={`flex w-full items-center gap-2 p-2 text-left transition-colors ${
              index === currentTrackIndex
                ? "bg-black text-white"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="h-8 w-8 flex-shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.albumArt}
                alt={track.album || track.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-xs font-semibold ${
                index === currentTrackIndex ? "text-white" : "text-black"
              }`}>
                {track.title}
              </p>
              <p className={`truncate text-[10px] ${
                index === currentTrackIndex ? "text-gray-300" : "text-gray-500"
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
