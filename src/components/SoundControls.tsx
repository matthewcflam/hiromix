"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface SoundControlsProps {
  isEnabled: boolean;
  volume: number;
  onToggleEnabled: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

export default function SoundControls({
  isEnabled,
  volume,
  onToggleEnabled,
  onVolumeChange,
}: SoundControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="fixed bottom-32 right-8 z-[90]"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        {/* Main Button */}
        <button
          onClick={() => onToggleEnabled(!isEnabled)}
          className="flex items-center justify-center w-12 h-12 bg-gray-900/90 hover:bg-gray-800 rounded-full shadow-lg transition-colors"
          aria-label={isEnabled ? "Mute sounds" : "Unmute sounds"}
        >
          {isEnabled ? (
            <Volume2 className="w-5 h-5 text-white" />
          ) : (
            <VolumeX className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Volume Slider */}
        <AnimatePresence>
          {isExpanded && isEnabled && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-14 top-1/2 -translate-y-1/2 bg-gray-900/95 rounded-full px-4 py-3 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-white/70 font-medium whitespace-nowrap">
                  Volume
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
                  className="w-24 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer"
                />
                <span className="text-xs text-white font-mono w-8 text-right">
                  {Math.round(volume * 100)}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip when not expanded */}
        {!isExpanded && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black text-white text-xs px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
              {isEnabled ? "Sound effects on" : "Sound effects off"}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
