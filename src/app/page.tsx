"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import HeroHeader from "@/components/HeroHeader";
import LoadingScreen from "@/components/LoadingScreen";
import { timelineData } from "@/data/timeline";
import { getShuffledMusicTracks } from "@/data/music";
import { loadingScreenConfig } from "@/lib/loadingScreenConfig";
import type { MusicTrack } from "@/types";

// Dynamically import heavy components
const TimelineCarousel = dynamic(() => import("@/components/TimelineCarousel"), {
  loading: () => <div className="h-screen w-screen" />,
  ssr: true,
});

const MusicPlayer = dynamic(() => import("@/components/MusicPlayer"), {
  loading: () => null,
  ssr: true,
});

export default function Home() {
  const [showLoader, setShowLoader] = useState(true);
  const [playlistTracks, setPlaylistTracks] = useState<MusicTrack[] | null>(null);

  useEffect(() => {
    setPlaylistTracks(getShuffledMusicTracks());
  }, []);

  const handleLoaderComplete = useCallback(() => {
    setShowLoader(false);
  }, []);

  const isLoaderActive = showLoader;
  const isContentInteractive = !showLoader;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white">
      <div
        style={{
          opacity: isContentInteractive ? 1 : 0,
          pointerEvents: isContentInteractive ? "auto" : "none",
          transition: "opacity 220ms ease-out",
        }}
      >
        <HeroHeader />
        <TimelineCarousel items={timelineData} />
        {playlistTracks && <MusicPlayer tracks={playlistTracks} />}
      </div>

      {isLoaderActive && (
        <LoadingScreen
          durationMs={loadingScreenConfig.durationMs}
          loadingGifSrc={loadingScreenConfig.loadingGifSrc}
          heading={loadingScreenConfig.heading}
          onComplete={handleLoaderComplete}
        />
      )}
    </main>
  );
}
