"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import type { MusicTrack } from "@/types";
import QueueDropdown from "./QueueDropdown";

interface MusicPlayerProps {
  tracks: MusicTrack[];
}

export default function MusicPlayer({ tracks }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.unload();
    }

    if (!currentTrack.audioSrc) return;

    const sound = new Howl({
      src: [currentTrack.audioSrc],
      html5: true,
      volume: 0.7,
      onend: () => {
        handleNext();
      },
    });

    soundRef.current = sound;

    if (isPlaying) {
      sound.play();
    }

    return () => {
      sound.unload();
    };
  }, [currentTrackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  const handlePrevious = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length);
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setShowQueue(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      onMouseEnter={() => setShowQueue(true)}
      onMouseLeave={() => setShowQueue(false)}
      className="fixed right-6 top-6 z-50"
    >
      <div className="relative">
        {/* Minimal player */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2">
          {/* Album art */}
          <div className="h-10 w-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.album || currentTrack.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Track info */}
          <div className="min-w-[120px] max-w-[140px]">
            <p className="truncate text-xs font-semibold text-black">
              {currentTrack.title}
            </p>
            <p className="truncate text-[10px] text-gray-600">
              {currentTrack.artist}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevious}
              className="p-1 hover:opacity-60 transition-opacity"
              aria-label="Previous"
            >
              <SkipBack className="h-3 w-3" />
            </button>
            <button
              onClick={togglePlay}
              className="p-1 hover:opacity-60 transition-opacity"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-3 w-3" fill="black" />
              ) : (
                <Play className="h-3 w-3" fill="black" />
              )}
            </button>
            <button
              onClick={handleNext}
              className="p-1 hover:opacity-60 transition-opacity"
              aria-label="Next"
            >
              <SkipForward className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Queue */}
        <AnimatePresence>
          {showQueue && (
            <QueueDropdown
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              onTrackSelect={handleTrackSelect}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
