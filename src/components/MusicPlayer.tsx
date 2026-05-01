"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import type { MusicTrack } from "@/types";
import QueueDropdown from "./QueueDropdown";

interface MusicPlayerProps {
  tracks: MusicTrack[];
}

const BASE_PLAYER_SCALE = 1.5;
const DEFAULT_MUSIC_VOLUME = 0.3;
const MUSIC_VOLUME_STORAGE_KEY = "music-player-volume";

const formatClock = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

function RewindGlyph() {
  return (
    <span className="relative block h-4 w-6">
      <span className="absolute left-0 top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[8px] border-r-black" />
      <span className="absolute left-[8px] top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[8px] border-r-black" />
    </span>
  );
}

function ForwardGlyph() {
  return (
    <span className="relative block h-4 w-6">
      <span className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-l-[8px] border-l-black" />
      <span className="absolute right-[8px] top-1/2 -translate-y-1/2 border-y-[6px] border-y-transparent border-l-[8px] border-l-black" />
    </span>
  );
}

export default function MusicPlayer({ tracks }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showQueue, setShowQueue] = useState(false);
  const [pressedControl, setPressedControl] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [viewportScale, setViewportScale] = useState(1);
  const [musicVolume, setMusicVolume] = useState(DEFAULT_MUSIC_VOLUME);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [trackLengthSeconds, setTrackLengthSeconds] = useState(tracks[0]?.duration ?? 0);
  const soundRef = useRef<Howl | null>(null);
  const currentTrack = tracks[currentTrackIndex];

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedMusicVolume = window.localStorage.getItem(MUSIC_VOLUME_STORAGE_KEY);
      if (savedMusicVolume === null) return;

      const parsedVolume = Number(savedMusicVolume);
      if (!Number.isNaN(parsedVolume)) {
        setMusicVolume(Math.max(0, Math.min(1, parsedVolume)));
      }
    } catch (error) {
      console.error("Failed to load music volume preference:", error);
    }
  }, []);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.stop();
      soundRef.current.unload();
      soundRef.current = null;
    }

    if (!currentTrack.audioSrc) return;

    const sound = new Howl({
      src: [currentTrack.audioSrc],
      html5: false,
      volume: musicVolume,
      onload: () => {
        const loadedDuration = sound.duration();
        setTrackLengthSeconds(loadedDuration > 0 ? loadedDuration : currentTrack.duration ?? 0);
      },
      onend: () => {
        handleNext();
      },
    });

    soundRef.current = sound;

    if (isPlaying) {
      sound.play();
    }

    return () => {
      if (soundRef.current === sound) {
        sound.stop();
        sound.unload();
        soundRef.current = null;
      }
    };
  }, [currentTrackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    soundRef.current?.volume(musicVolume);

    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MUSIC_VOLUME_STORAGE_KEY, musicVolume.toString());
    } catch (error) {
      console.error("Failed to save music volume preference:", error);
    }
  }, [musicVolume]);

  useEffect(() => {
    setElapsedSeconds(0);
    setTrackLengthSeconds(currentTrack.duration ?? 0);
  }, [currentTrackIndex, currentTrack.duration]);

  useEffect(() => {
    const updateSeek = () => {
      const sound = soundRef.current;
      if (!sound) return;

      const seek = sound.seek();
      if (typeof seek === "number") {
        setElapsedSeconds(seek);
      }
    };

    updateSeek();
    if (!isPlaying) return;

    const intervalId = window.setInterval(updateSeek, 200);
    return () => window.clearInterval(intervalId);
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    const updateViewportScale = () => {
      const widthFactor = window.innerWidth / 1440;
      const heightFactor = window.innerHeight / 900;
      const normalizedFactor = Math.min(widthFactor, heightFactor);
      const nextScale = Math.max(0.8, Math.min(1.25, normalizedFactor));
      setViewportScale(nextScale);
    };

    updateViewportScale();
    window.addEventListener("resize", updateViewportScale);

    return () => {
      window.removeEventListener("resize", updateViewportScale);
    };
  }, []);

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

  const handleMusicVolumeChange = (nextValue: number) => {
    setMusicVolume(Math.max(0, Math.min(1, nextValue)));
  };

  const buttonDepthClass = (control: string) =>
    pressedControl === control
      ? "scale-[0.96]"
      : "scale-100";

  const handlePressStart = (control: string) => setPressedControl(control);
  const handlePressEnd = () => setPressedControl(null);
  const playerScale = BASE_PLAYER_SCALE * viewportScale * 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: playerScale }}
      animate={{ opacity: 1, scale: playerScale }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onMouseLeave={() => {
        setShowQueue(false);
        setPressedControl(null);
      }}
      className="fixed right-2 top-2 z-40 origin-top-right win95-ui"
    >
      <div className="relative">
        <div className="retro-metal-pink relative flex items-center gap-4 rounded-[18px] p-3 shadow-[2px_2px_0_#00000030,inset_1px_1px_0_#ffffff,inset_-1px_-1px_0_#d9b8d9]">
          {/* Metal texture overlay */}
          <div 
            className="absolute inset-0 rounded-[18px] pointer-events-none"
            style={{
              backgroundImage: 'url(/assets/metal.webp)',
              backgroundSize: 'auto',
              backgroundRepeat: 'repeat',
              mixBlendMode: 'overlay',
              opacity: 0.4,
            }}
          />
          <div className="retro-metal-pink-soft relative z-10 w-[260px] p-[2px] shadow-[inset_1px_1px_0_#e5c5e5,inset_-1px_-1px_0_#fff0f8]">
            <div className="ipod-glass-display px-3 py-3">
              <div className={`relative z-10 mb-2 flex items-center justify-between ${showVolumeSlider ? "text-[10px]" : "text-[12px]"} tracking-[0.1em] text-[#f2f2f2]`}>
                <span className="transition-all duration-300">{showVolumeSlider ? "NOW PLAYING" : "NOW PLAYING"}</span>
                <span className="transition-all duration-300">{isPlaying ? "ACTIVE" : "PAUSED"}</span>
              </div>
              <div className={`relative z-10 mb-2 flex items-center justify-between ${showVolumeSlider ? "text-[10px]" : "text-[12px]"} tracking-[0.12em] text-[#d7d7d7]`}>
                <span className="transition-all duration-300">{formatClock(elapsedSeconds)}</span>
                <span className="transition-all duration-300">{formatClock(trackLengthSeconds)}</span>
              </div>

              <div className={`relative z-10 flex items-center ${showVolumeSlider ? "gap-2 p-2" : "gap-4 p-3"} bg-[#000000] shadow-[inset_1px_1px_0_#3a3a3a,inset_-1px_-1px_0_#090909]`}>
                <div className={`flex-shrink-0 overflow-hidden border border-[#646464] transition-all duration-300 ${showVolumeSlider ? "h-16 w-16" : "h-24 w-24"}`}>
                  <Image
                    src={currentTrack.albumArt}
                    alt={currentTrack.album || currentTrack.title}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    priority={true}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-bold uppercase tracking-[0.08em] text-[#e9e9e9] transition-all duration-300 ${showVolumeSlider ? "text-[9px]" : "text-[12px]"}`}>
                    {currentTrack.artist}
                  </p>
                  <p className={`truncate font-bold text-[#ffffff] transition-all duration-300 ${showVolumeSlider ? "text-sm" : "text-[16px]"}`}>{currentTrack.title}</p>
                </div>
              </div>

              {showVolumeSlider && (
                <div className="relative z-10 mt-3 p-[2px] shadow-[inset_1px_1px_0_#3a3a3a,inset_-1px_-1px_0_#090909] animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 bg-[#000000] px-2 py-2">
                    <span className="text-[9px] uppercase tracking-[0.08em] text-[#ffffff]">
                      Vol
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(musicVolume * 100)}
                      onChange={(event) => handleMusicVolumeChange(Number(event.target.value) / 100)}
                      className="win95-volume-slider flex-1"
                      aria-label="Music volume"
                    />
                    <span className="w-10 text-right text-[9px] text-[#ffffff]">
                      {Math.round(musicVolume * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="retro-metal-pink relative z-10 h-40 w-40 rounded-full shadow-[2px_2px_0_#00000030,inset_2px_2px_0_#ffffff,inset_-2px_-2px_0_#d9b8d9]">
            <button
              type="button"
              onPointerDown={() => handlePressStart("menu")}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onClick={() => setShowQueue((prev) => !prev)}
              className={`retro-metal-pink-soft absolute left-1/2 top-3 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold tracking-[0.2em] text-[#000080] shadow-[inset_1px_1px_0_#fff0f8,inset_-1px_-1px_0_#e5c5e5] transition-all duration-100 ${buttonDepthClass("menu")}`}
              aria-label="Toggle queue"
            >
              MENU
            </button>

            <button
              type="button"
              onPointerDown={() => handlePressStart("rewind")}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onClick={handlePrevious}
              className={`retro-metal-pink-soft absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-[inset_1px_1px_0_#fff0f8,inset_-1px_-1px_0_#e5c5e5] transition-all duration-100 ${buttonDepthClass("rewind")}`}
              aria-label="Previous track"
            >
              <RewindGlyph />
            </button>

            <button
              type="button"
              onPointerDown={() => handlePressStart("forward")}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onClick={handleNext}
              className={`retro-metal-pink-soft absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full shadow-[inset_1px_1px_0_#fff0f8,inset_-1px_-1px_0_#e5c5e5] transition-all duration-100 ${buttonDepthClass("forward")}`}
              aria-label="Next track"
            >
              <ForwardGlyph />
            </button>

            <button
              type="button"
              onPointerDown={() => handlePressStart("play")}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onClick={togglePlay}
              className={`retro-metal-pink-soft absolute left-1/2 top-1/2 flex h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#000000] text-lg font-bold text-[#000080] shadow-[inset_2px_2px_0_#fff0f8,inset_-2px_-2px_0_#e5c5e5] transition-all duration-100 ${buttonDepthClass("play")}`}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "||" : ">"}
            </button>

            <button
              type="button"
              onPointerDown={() => handlePressStart("volume")}
              onPointerUp={handlePressEnd}
              onPointerLeave={handlePressEnd}
              onClick={() => setShowVolumeSlider((prev) => !prev)}
              className={`retro-metal-pink-soft absolute left-1/2 bottom-3 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-bold tracking-[0.2em] text-[#000080] shadow-[inset_1px_1px_0_#fff0f8,inset_-1px_-1px_0_#e5c5e5] transition-all duration-100 ${buttonDepthClass("volume")}`}
              aria-label="Toggle volume slider"
            >
              VOL
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showQueue && (
            <QueueDropdown
              tracks={tracks}
              currentTrackIndex={currentTrackIndex}
              onTrackSelect={handleTrackSelect}
              className="left-auto right-0 top-[calc(100%-1px)] mt-0 w-[460px]"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
